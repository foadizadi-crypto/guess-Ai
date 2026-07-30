import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
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
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { GlassCard } from '@/components/GlassCard';
import { GradientButton } from '@/components/GradientButton';
import { PauseMenu } from '@/components/PauseMenu';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { useAdStore } from '@/store/adStore';
import { useAudio } from '@/hooks/useAudio';
import { openAIService } from '@/services/OpenAIService';
import { DIFFICULTY_CONFIG, calculateAnswerScore, getAvatarAbility, getTimerColor, shuffleOptions } from '@/gameEngine';
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
  const isTimerRunning = useGameStore((s) => s.isTimerRunning);
  const gameSession = useGameStore((s) => s.gameSession);
  const setTimer = useGameStore((s) => s.setTimer);
  const setIsTimerRunning = useGameStore((s) => s.setIsTimerRunning);
  const recordAnswer = useGameStore((s) => s.recordAnswer);
  const advanceQuestion = useGameStore((s) => s.advanceQuestion);
  const startSession = useGameStore((s) => s.startSession);
  const endSession = useGameStore((s) => s.endSession);
  const resetGame = useGameStore((s) => s.resetGame);
  const streak = useGameStore((s) => s.streak);
  const consecutiveWrong = useGameStore((s) => s.consecutiveWrong);
  const totalWrong = useGameStore((s) => s.totalWrong);
  const activateDoubleCoins = useGameStore((s) => s.activateDoubleCoins);
  const usePowerUp = useUserStore((s) => s.usePowerUp);
  const powerUps = useUserStore((s) => s.powerUps);
  const selectedAvatarId = useUserStore((s) => s.selectedAvatarId);
  const { adsRemoved, showRewarded } = useAdStore();
  const { playEffect, playMusic, stopMusic } = useAudio();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [gameImageUrl, setGameImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [removedOptions, setRemovedOptions] = useState<number[]>([]);
  const [paused, setPaused] = useState(false);
  const [reviveVisible, setReviveVisible] = useState(false);
  const [reviveLoading, setReviveLoading] = useState(false);
  const [superComboVisible, setSuperComboVisible] = useState(false);
  const endedRef = useRef(false);
  const reviveOffered = useRef(false);
  const shakeX = useSharedValue(0);
  const clarityProgress = Math.min(100, Math.max(0, clarity));
  const currentQuestion = questions[questionIndex];
  const config = DIFFICULTY_CONFIG[difficulty];

  // ── Game music ─────────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      playMusic('game_music');
      return () => { stopMusic(); };
    }, [playMusic, stopMusic]),
  );

  const finishGame = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    setIsTimerRunning(false);
    endSession();
    router.replace(ROUTES.RESULT);
  }, [endSession, router, setIsTimerRunning]);

  /** Intercepts timer-zero to offer a rewarded-ad revive before finishing. */
  const handleTimerEnd = useCallback(() => {
    if (adsRemoved || reviveOffered.current) {
      finishGame();
      return;
    }
    reviveOffered.current = true;
    setIsTimerRunning(false);
    setReviveVisible(true);
  }, [adsRemoved, finishGame, setIsTimerRunning]);

  const handleRevive = useCallback(async () => {
    if (reviveLoading) return;
    setReviveLoading(true);
    try {
      const rewarded = await showRewarded();
      if (rewarded) {
        setReviveVisible(false);
        setTimer(30);
        setIsTimerRunning(true);
        playEffect('coin');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setReviveVisible(false);
        finishGame();
      }
    } catch {
      setReviveVisible(false);
      finishGame();
    } finally {
      setReviveLoading(false);
    }
  }, [finishGame, playEffect, reviveLoading, setIsTimerRunning, setTimer, showRewarded]);

  useEffect(() => {
    setRemovedOptions([]);
  }, [questionIndex]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    openAIService.generateQuestions(category, difficulty, 20).then((items) => {
      if (active) {
        // Shuffle answer options so correct answer position is unpredictable
        const shuffled = items.map((q) => {
          const { options, correctIndex } = shuffleOptions(q);
          return { ...q, options, correctIndex };
        });
        // Fix #1: pin one image for the entire session — use first question's image
        setGameImageUrl(shuffled[0]?.imageUrl ?? null);
        setQuestions(shuffled);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [category, difficulty]);

  useEffect(() => {
    if (!gameSession) startSession(difficulty, category);
  }, [category, difficulty, gameSession, startSession]);

  // ── Main timer countdown ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isTimerRunning || paused || loading || feedback || endedRef.current) return;
    const interval = setInterval(() => {
      const next = Math.max(0, timer - 1);
      setTimer(next);
      // Low-time tick sound
      if (next > 0 && next <= 30) playEffect('timer_tick');
      if (next === 0) handleTimerEnd();
    }, 1000);
    return () => clearInterval(interval);
  }, [feedback, handleTimerEnd, isTimerRunning, loading, paused, playEffect, setTimer, timer]);

  const answerQuestion = useCallback(
    (answerIndex: number) => {
      if (!currentQuestion || feedback || paused || endedRef.current) return;
      const correct = answerIndex === currentQuestion.correctIndex;
      const points = correct ? calculateAnswerScore(difficulty, timer, getAvatarAbility(selectedAvatarId), streak) : 0;
      // Compute new streak locally to act on it immediately (before store update)
      const newStreak = correct ? streak + 1 : 0;
      // Super Combo: every 10th consecutive correct answer → +10s
      if (correct && newStreak > 0 && newStreak % 10 === 0) {
        setTimer(Math.min(180, timer + 10));
        setSuperComboVisible(true);
        setTimeout(() => setSuperComboVisible(false), 2000);
        playEffect('coin');
      }
      setSelectedAnswer(answerIndex);
      setFeedback(correct ? 'correct' : 'wrong');
      setIsTimerRunning(false);
      recordAnswer(correct, points);
      Haptics.notificationAsync(
        correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
      );
      playEffect(correct ? 'correct' : 'wrong');
      if (!correct) {
        shakeX.value = withSequence(
          withTiming(-8, { duration: 50 }),
          withTiming(8, { duration: 50 }),
          withTiming(-5, { duration: 50 }),
          withTiming(0, { duration: 50 }),
        );
      }
      setTimeout(() => {
        // Game over: 5 consecutive wrong OR 10 total wrong
        const { consecutiveWrong: cw, totalWrong: tw } = useGameStore.getState();
        if (cw >= 5 || tw >= 10) {
          finishGame();
          return;
        }
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
      playEffect,
      questionIndex,
      questions.length,
      recordAnswer,
      selectedAvatarId,
      setIsTimerRunning,
      setSuperComboVisible,
      shakeX,
      streak,
      timer,
    ],
  );

  const useGamePowerUp = useCallback(
    (powerUpId: PowerUpId) => {
      if (feedback || paused || endedRef.current || !currentQuestion || powerUps[powerUpId] < 1) return;
      if (!usePowerUp(powerUpId)) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playEffect('button_click');
      if (powerUpId === 'extra-time') {
        setTimer(Math.min(180, timer + 15));
        playEffect('coin');
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
        playEffect('coin');
      }
    },
    [
      activateDoubleCoins,
      advanceQuestion,
      currentQuestion,
      feedback,
      finishGame,
      paused,
      playEffect,
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
    reviveOffered.current = false;
    setPaused(false);
    setSelectedAnswer(null);
    setFeedback(null);
    setReviveVisible(false);
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
                source={{ uri: gameImageUrl ?? '' }}
                style={styles.image}
                blurRadius={blurRadius}
              />
              {/* Reveal % — top-left corner badge, keeps image clean */}
              <View style={[styles.imageBadge, { borderColor: config.color }]}>
                <Ionicons name="eye-outline" size={16} color={config.color} />
                <Text style={[styles.imageBadgeText, { color: config.color }]}>
                  {Math.round(clarityProgress)}% REVEAL
                </Text>
              </View>
              {/* Combo / Super Combo — top-right corner */}
              {streak >= 3 && (
                <View style={[styles.streakBadge, streak >= 10 && styles.superComboBadge]}>
                  <Text style={[styles.streakText, streak >= 10 && styles.superComboText]}>
                    {streak >= 10 ? `⚡ ${streak}x SUPER` : `🔥 ${streak}x COMBO`}
                  </Text>
                </View>
              )}
              {/* Super Combo announcement overlay */}
              {superComboVisible && (
                <View style={styles.superComboAnnounce}>
                  <Text style={styles.superComboAnnounceText}>⚡ SUPER COMBO! +10s</Text>
                </View>
              )}
            </Animated.View>

            <GlassCard style={styles.questionCard}>
              <Text style={styles.questionLabel}>WHAT DO YOU SEE?</Text>
              <Text style={styles.questionText} numberOfLines={3}>
                Identify the mystery image
              </Text>
              {feedback && (
                <Text style={[styles.feedback, { color: feedback === 'correct' ? GameColors.accentGreen : GameColors.accentRed }]}>
                  {feedback === 'correct' ? `Correct! +${calculateAnswerScore(difficulty, timer, getAvatarAbility(selectedAvatarId), streak)}` : `Not quite — ${currentQuestion.answer}`}
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

      {/* ── Revive modal ────────────────────────────────────────────────── */}
      <Modal visible={reviveVisible} transparent animationType="fade" onRequestClose={() => { setReviveVisible(false); finishGame(); }}>
        <View style={styles.reviveBackdrop}>
          <View style={styles.reviveCard}>
            <View style={styles.reviveIcon}>
              <Ionicons name="time-outline" size={52} color={GameColors.accentGold} />
            </View>
            <Text style={styles.reviveTitle}>Time's Up!</Text>
            <Text style={styles.reviveBody}>Watch a short ad to get{'\n'}30 more seconds.</Text>
            <GradientButton
              title={reviveLoading ? 'Loading ad…' : '▶  Watch Ad  +30s'}
              onPress={handleRevive}
              disabled={reviveLoading}
              style={styles.reviveBtn}
            />
            <TouchableOpacity onPress={() => { setReviveVisible(false); finishGame(); }} style={styles.reviveDecline}>
              <Text style={styles.reviveDeclineText}>No thanks, see results</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  imageBadge: { position: 'absolute', left: 14, top: 14, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, backgroundColor: 'rgba(13,2,33,0.75)', flexDirection: 'row', gap: 5, alignItems: 'center' },
  imageBadgeText: { ...Typography.small, fontFamily: 'Inter_700Bold', fontSize: 11 },
  streakBadge: { position: 'absolute', right: 14, top: 14, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#FFD700', backgroundColor: 'rgba(13,2,33,0.85)' },
  streakText: { fontFamily: 'Inter_700Bold', fontSize: 11, color: '#FFD700', letterSpacing: 0.5 },
  superComboBadge: { borderColor: '#00BFFF', backgroundColor: 'rgba(0,50,80,0.92)' },
  superComboText: { color: '#00BFFF' },
  superComboAnnounce: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' },
  superComboAnnounceText: { fontFamily: 'Inter_700Bold', fontSize: 22, color: '#00BFFF', letterSpacing: 1, textShadowColor: '#000', textShadowRadius: 8 },
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
  // Revive modal
  reviveBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  reviveCard: { width: '100%', borderRadius: 28, padding: 28, alignItems: 'center', backgroundColor: GameColors.card, borderWidth: 1, borderColor: GameColors.cardBorder, gap: 16, shadowColor: GameColors.accentGold, shadowOpacity: 0.25, shadowRadius: 20, elevation: 12 },
  reviveIcon: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: GameColors.accentGold, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,215,0,0.08)' },
  reviveTitle: { ...Typography.header, color: GameColors.textWhite, fontSize: 26 },
  reviveBody: { ...Typography.caption, color: GameColors.textSecondary, textAlign: 'center', lineHeight: 22 },
  reviveBtn: { width: '100%' },
  reviveDecline: { paddingVertical: 8, paddingHorizontal: 16 },
  reviveDeclineText: { ...Typography.small, color: GameColors.textSecondary },
});
