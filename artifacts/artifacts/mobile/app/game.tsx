import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { GlassCard } from '@/components/GlassCard';
import { PauseMenu } from '@/components/PauseMenu';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { openAIService } from '@/services/OpenAIService';
import { DIFFICULTY_CONFIG, calculateAnswerScore, getAvatarAbility, getTimerColor } from '@/gameEngine';
import { ROUTES } from '@/navigation/routes';
import type { Question } from '@/types';
import type { PowerUpId } from '@/types';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function GameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const difficulty = useGameStore((s) => s.selectedDifficulty);
  const category = useGameStore((s) => s.selectedCategory);
  const timer = useGameStore((s) => s.timer);
  const score = useGameStore((s) => s.score);
  const clarity = useGameStore((s) => s.clarity);
  const questionIndex = useGameStore((s) => s.currentQuestionIndex);
  const correctAnswers = useGameStore((s) => s.correctAnswers);
  const isTimerRunning = useGameStore((s) => s.isTimerRunning);
  const gameSession = useGameStore((s) => s.gameSession);
  const setTimer = useGameStore((s) => s.setTimer);
  const setIsTimerRunning = useGameStore((s) => s.setIsTimerRunning);
  const recordAnswer = useGameStore((s) => s.recordAnswer);
  const advanceQuestion = useGameStore((s) => s.advanceQuestion);
  const startSession = useGameStore((s) => s.startSession);
  const endSession = useGameStore((s) => s.endSession);
  const resetGame = useGameStore((s) => s.resetGame);
  const activateDoubleCoins = useGameStore((s) => s.activateDoubleCoins);
  const usePowerUp = useUserStore((s) => s.usePowerUp);
  const powerUps = useUserStore((s) => s.powerUps);
  const selectedAvatarId = useUserStore((s) => s.selectedAvatarId);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [removedOptions, setRemovedOptions] = useState<number[]>([]);
  const [paused, setPaused] = useState(false);
  const endedRef = useRef(false);
  const shakeX = useSharedValue(0);
  const clarityProgress = Math.min(100, Math.max(0, clarity));
  const currentQuestion = questions[questionIndex];
  const config = DIFFICULTY_CONFIG[difficulty];

  const finishGame = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    setIsTimerRunning(false);
    endSession();
    router.replace(ROUTES.RESULT);
  }, [endSession, router, setIsTimerRunning]);

  useEffect(() => {
    setRemovedOptions([]);
  }, [questionIndex]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    openAIService.generateQuestions(category, difficulty, 20).then((items) => {
      if (active) {
        setQuestions(items);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [category, difficulty]);

  useEffect(() => {
    if (!gameSession) startSession(difficulty, category);
  }, [category, difficulty, gameSession, startSession]);

  useEffect(() => {
    if (!isTimerRunning || paused || loading || feedback || endedRef.current) return;
    const interval = setInterval(() => {
      const next = Math.max(0, timer - 1);
      setTimer(next);
      if (next === 0) finishGame();
    }, 1000);
    return () => clearInterval(interval);
  }, [feedback, finishGame, isTimerRunning, loading, paused, setTimer, timer]);

  const answerQuestion = useCallback(
    (answerIndex: number) => {
      if (!currentQuestion || feedback || paused || endedRef.current) return;
      const correct = answerIndex === currentQuestion.correctIndex;
      const points = correct ? calculateAnswerScore(difficulty, timer, getAvatarAbility(selectedAvatarId)) : 0;
      setSelectedAnswer(answerIndex);
      setFeedback(correct ? 'correct' : 'wrong');
      setIsTimerRunning(false);
      recordAnswer(correct, points);
      Haptics.notificationAsync(
        correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
      );
      if (!correct) {
        shakeX.value = withSequence(
          withTiming(-8, { duration: 50 }),
          withTiming(8, { duration: 50 }),
          withTiming(-5, { duration: 50 }),
          withTiming(0, { duration: 50 }),
        );
      }
      setTimeout(() => {
        const isLast = questionIndex >= questions.length - 1 || questionIndex >= 19;
        if (isLast) {
          finishGame();
          return;
        }
        advanceQuestion();
        setSelectedAnswer(null);
        setFeedback(null);
        setIsTimerRunning(true);
      }, correct ? 1000 : 1500);
    },
    [
      advanceQuestion,
      currentQuestion,
      difficulty,
      feedback,
      finishGame,
      paused,
      questionIndex,
      questions.length,
      recordAnswer,
      selectedAvatarId,
      setIsTimerRunning,
      shakeX,
      timer,
    ],
  );

  const useGamePowerUp = useCallback(
    (powerUpId: PowerUpId) => {
      if (feedback || paused || endedRef.current || !currentQuestion || powerUps[powerUpId] < 1) return;
      if (!usePowerUp(powerUpId)) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (powerUpId === 'extra-time') {
        setTimer(Math.min(180, timer + 15));
      } else if (powerUpId === 'fifty-fifty') {
        const wrong = currentQuestion.options
          .map((_, index) => index)
          .filter((index) => index !== currentQuestion.correctIndex)
          .slice(0, 2);
        setRemovedOptions(wrong);
      } else if (powerUpId === 'skip-question') {
        if (questionIndex >= questions.length - 1 || questionIndex >= 19) {
          finishGame();
        } else {
          advanceQuestion();
        }
      } else if (powerUpId === 'double-coins') {
        activateDoubleCoins();
      }
    },
    [
      activateDoubleCoins,
      advanceQuestion,
      currentQuestion,
      feedback,
      finishGame,
      paused,
      powerUps,
      questionIndex,
      questions.length,
      setTimer,
      timer,
      usePowerUp,
    ],
  );

  const restart = useCallback(() => {
    endedRef.current = false;
    setPaused(false);
    setSelectedAnswer(null);
    setFeedback(null);
    startSession(difficulty, category);
  }, [category, difficulty, startSession]);

  const exitToLobby = useCallback(() => {
    resetGame();
    router.replace(ROUTES.LOBBY);
  }, [resetGame, router]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));
  const timerStyle = useAnimatedStyle(() => ({
    opacity: timer < 30 ? withSequence(withTiming(0.45, { duration: 500 }), withTiming(1, { duration: 500 })) : 1,
  }));

  const blurRadius = useMemo(() => Math.max(0, Math.round((100 - clarityProgress) / 5)), [clarityProgress]);
  const topPad = Platform.OS === 'web' ? 54 : insets.top + 8;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 12;

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
        <View style={styles.topBar}>
          <BackButton onPress={() => setPaused(true)} />
          <View style={styles.topCenter}>
            <Text style={styles.mode}>{config.label.toUpperCase()} • {category.toUpperCase()}</Text>
            <Animated.Text style={[styles.timer, { color: getTimerColor(timer) }, timerStyle]}>
              {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
            </Animated.Text>
          </View>
          <TouchableOpacity style={styles.pauseButton} onPress={() => setPaused(true)}>
            <Ionicons name="pause" size={20} color={GameColors.textWhite} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.counter}>{Math.min(questionIndex + 1, 20)} / 20</Text>
          <View style={styles.segmentTrack}>
            {Array.from({ length: 20 }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.segment,
                  index < questionIndex && styles.segmentDone,
                  index === questionIndex && { backgroundColor: config.color },
                ]}
              />
            ))}
          </View>
          <Text style={styles.score}>+{score}</Text>
        </View>

        {loading || !currentQuestion ? (
          <View style={styles.loading}>
            <ActivityIndicator color={GameColors.accentGold} size="large" />
            <Text style={styles.loadingText}>Preparing your mystery...</Text>
          </View>
        ) : (
          <>
            <Animated.View style={[styles.imageWrap, shakeStyle]}>
              <Image
                source={{ uri: currentQuestion.imageUrl }}
                style={styles.image}
                blurRadius={blurRadius}
              />
              <View style={styles.imageOverlay}>
                <Text style={styles.clarityValue}>{Math.round(clarityProgress)}%</Text>
                <Text style={styles.clarityLabel}>CLARITY</Text>
              </View>
              <View style={[styles.imageBadge, { borderColor: config.color }]}>
                <Ionicons name="eye-outline" size={16} color={config.color} />
                <Text style={[styles.imageBadgeText, { color: config.color }]}>
                  {config.blurPercent}% BLUR
                </Text>
              </View>
            </Animated.View>

            <GlassCard style={styles.questionCard}>
              <Text style={styles.questionLabel}>WHAT DO YOU SEE?</Text>
              <Text style={styles.questionText} numberOfLines={3}>
                Identify the mystery image
              </Text>
              {feedback && (
                <Text style={[styles.feedback, { color: feedback === 'correct' ? GameColors.accentGreen : GameColors.accentRed }]}>
                  {feedback === 'correct' ? `Correct! +${calculateAnswerScore(difficulty, timer, getAvatarAbility(selectedAvatarId))}` : `Not quite — ${currentQuestion.answer}`}
                </Text>
              )}
            </GlassCard>

            <View style={styles.powerBar}>
              {([
                ['extra-time', 'time-outline', '+15s'],
                ['fifty-fifty', 'contrast-outline', '50/50'],
                ['skip-question', 'play-skip-forward-outline', 'Skip'],
                ['double-coins', 'logo-bitcoin', '2x coins'],
              ] as const).map(([id, icon, label]) => (
                <TouchableOpacity
                  key={id}
                  style={[styles.powerButton, powerUps[id] < 1 && styles.powerButtonDisabled]}
                  onPress={() => useGamePowerUp(id)}
                  disabled={powerUps[id] < 1 || Boolean(feedback)}
                >
                  <Ionicons name={icon} size={15} color={powerUps[id] > 0 ? GameColors.accentGold : GameColors.textSecondary} />
                  <Text style={styles.powerLabel}>{label}</Text>
                  <Text style={styles.powerCount}>{powerUps[id]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.answers}>
              {currentQuestion.options.map((option, index) => {
                if (removedOptions.includes(index)) return null;
                const isCorrect = index === currentQuestion.correctIndex;
                const isSelected = selectedAnswer === index;
                const color = feedback && isCorrect ? GameColors.accentGreen : feedback && isSelected ? GameColors.accentRed : GameColors.textWhite;
                return (
                  <AnimatedTouchable
                    key={`${currentQuestion.id}-${option}`}
                    style={[
                      styles.answerButton,
                      isCorrect && feedback === 'correct' && styles.correctButton,
                      isSelected && feedback === 'wrong' && styles.wrongButton,
                    ]}
                    onPress={() => answerQuestion(index)}
                    disabled={Boolean(feedback)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.answerLetter, { borderColor: color }]}>
                      <Text style={[styles.answerLetterText, { color }]}>{String.fromCharCode(65 + index)}</Text>
                    </View>
                    <Text style={[styles.answerText, { color }]} numberOfLines={2}>{option}</Text>
                    {feedback && isCorrect && <Ionicons name="checkmark-circle" size={20} color={GameColors.accentGreen} />}
                  </AnimatedTouchable>
                );
              })}
            </View>
          </>
        )}
      </View>
      <PauseMenu
        visible={paused}
        onResume={() => {
          setPaused(false);
          setIsTimerRunning(true);
        }}
        onRestart={restart}
        onExit={exitToLobby}
      />
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, gap: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topCenter: { alignItems: 'center', gap: 2 },
  mode: { ...Typography.small, color: GameColors.textSecondary, letterSpacing: 1 },
  timer: { fontSize: 30, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  pauseButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: GameColors.border },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counter: { ...Typography.small, color: GameColors.textSecondary, width: 42 },
  score: { ...Typography.small, color: GameColors.accentGold, width: 42, textAlign: 'right', fontFamily: 'Inter_700Bold' },
  segmentTrack: { flex: 1, flexDirection: 'row', gap: 3 },
  segment: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)' },
  segmentDone: { backgroundColor: GameColors.accentGreen },
  imageWrap: { flex: 1, minHeight: 240, maxHeight: 330, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: GameColors.cardBorder, backgroundColor: GameColors.backgroundSecondary },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(13,2,33,0.2)' },
  clarityValue: { fontSize: 44, color: GameColors.textWhite, fontFamily: 'Inter_700Bold', textShadowColor: '#000', textShadowRadius: 8 },
  clarityLabel: { ...Typography.small, color: GameColors.textWhite, letterSpacing: 2 },
  imageBadge: { position: 'absolute', left: 14, top: 14, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, backgroundColor: 'rgba(13,2,33,0.75)', flexDirection: 'row', gap: 5, alignItems: 'center' },
  imageBadgeText: { ...Typography.small, fontFamily: 'Inter_700Bold', fontSize: 11 },
  questionCard: { padding: 14, gap: 4 },
  powerBar: { flexDirection: 'row', gap: 6 },
  powerButton: { flex: 1, minHeight: 38, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,215,0,0.35)', backgroundColor: 'rgba(255,215,0,0.08)', alignItems: 'center', justifyContent: 'center', gap: 1 },
  powerButtonDisabled: { opacity: 0.4, borderColor: GameColors.border, backgroundColor: 'rgba(255,255,255,0.04)' },
  powerLabel: { color: GameColors.textWhite, fontFamily: 'Inter_600SemiBold', fontSize: 9 },
  powerCount: { color: GameColors.accentGold, fontFamily: 'Inter_700Bold', fontSize: 9 },
  questionLabel: { ...Typography.small, color: GameColors.accentGold, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  questionText: { ...Typography.semibold, color: GameColors.textWhite, textAlign: 'right' },
  feedback: { ...Typography.small, fontFamily: 'Inter_700Bold', marginTop: 3 },
  answers: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  answerButton: { width: '48%', minHeight: 62, flexGrow: 1, flexBasis: '46%', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: GameColors.border, backgroundColor: 'rgba(255,255,255,0.06)' },
  correctButton: { borderColor: GameColors.accentGreen, backgroundColor: 'rgba(0,230,118,0.16)' },
  wrongButton: { borderColor: GameColors.accentRed, backgroundColor: 'rgba(255,23,68,0.16)' },
  answerLetter: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  answerLetterText: { ...Typography.small, fontFamily: 'Inter_700Bold' },
  answerText: { ...Typography.small, flex: 1, fontFamily: 'Inter_600SemiBold' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { ...Typography.caption, color: GameColors.textSecondary },
});