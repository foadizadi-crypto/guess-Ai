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
  interpolateColor,
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
  const superComboActive = useGameStore((s) => s.superComboActive);
  const consecutiveWrong = useGameStore((s) => s.consecutiveWrong);
  const totalWrong = useGameStore((s) => s.totalWrong);
  const blurAmount = useGameStore((s) => s.blurAmount);
  const setBlurAmount = useGameStore((s) => s.setBlurAmount);
  const activateDoubleXP = useGameStore((s) => s.activateDoubleXP);
  const usePowerUp = useUserStore((s) => s.usePowerUp);
  const powerUps = useUserStore((s) => s.powerUps);
  const selectedAvatarId = useUserStore((s) => s.selectedAvatarId);
  const { incrementSessionCounter } = useAdStore();
  const { playEffect, playMusic, stopMusic } = useAudio();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [gameImageUrl, setGameImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [removedOptions, setRemovedOptions] = useState<number[]>([]);
  const [paused, setPaused] = useState(false);
  const [superComboVisible, setSuperComboVisible] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  // ── New state for blur/darkness feedback, segment history, countdown ─────
  const [countdown, setCountdown] = useState(-1);          // -1 = active, 0 = "GO!", 1-3 = ticking
  const [darkness, setDarkness] = useState(0);             // 0-70, accumulates on wrong answers
  const [answerHistory, setAnswerHistory] = useState<('correct' | 'wrong')[]>([]);
  const endedRef = useRef(false);
  const countdownStarted = useRef(false);
  const shakeX = useSharedValue(0);
  // Flash overlay: opacity + color (1=green correct, 0=red wrong)
  const flashOpacity = useSharedValue(0);
  const flashGreen = useSharedValue(1);
  // Countdown number animation
  const cdScale = useSharedValue(1.5);
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

  /** Timer reached zero — proceed directly to results (spec §7: rewarded-only, opt-in). */
  const handleTimerEnd = useCallback(() => {
    finishGame();
  }, [finishGame]);

  useEffect(() => {
    setRemovedOptions([]);
  }, [questionIndex]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    openAIService.generateQuestions(category, difficulty, 20)
      .then(({ questions: items, fromCache }) => {
        if (!active) return;
        const shuffled = items.map((q) => {
          const { options, correctIndex } = shuffleOptions(q);
          return { ...q, options, correctIndex };
        });
        setGameImageUrl(shuffled[0]?.imageUrl ?? null);
        setQuestions(shuffled);
        setIsOffline(fromCache);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const msg = err instanceof Error ? err.message : 'Could not load questions. Check your connection and API keys.';
        setLoadError(msg);
        setLoading(false);
      });
    return () => { active = false; };
  }, [category, difficulty]);

  useEffect(() => {
    if (!gameSession) startSession(difficulty, category);
  }, [category, difficulty, gameSession, startSession]);

  // ── Start countdown once questions finish loading ──────────────────────────
  useEffect(() => {
    if (!loading && questions.length > 0 && !countdownStarted.current) {
      countdownStarted.current = true;
      setCountdown(3);
    }
  }, [loading, questions.length]);

  // ── Countdown ticker: 3→2→1→0("GO!")→-1(active) ───────────────────────────
  useEffect(() => {
    if (countdown <= -1) return;
    if (countdown === 0) {
      const t = setTimeout(() => setCountdown(-1), 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Animate countdown number on each tick ─────────────────────────────────
  useEffect(() => {
    if (countdown > -1) {
      cdScale.value = 1.5;
      cdScale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    }
  }, [countdown, cdScale]);

  // ── Main timer countdown ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isTimerRunning || paused || loading || feedback || endedRef.current || countdown > -1) return;
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
      // Super Combo activates when streak first reaches super_combo_threshold (15).
      // Show the announcement once on activation; no time bonus (spec §3.4).
      if (correct && !superComboActive && newStreak >= 15) {
        setSuperComboVisible(true);
        setTimeout(() => setSuperComboVisible(false), 2500);
        playEffect('coin');
      }
      setSelectedAnswer(answerIndex);
      setFeedback(correct ? 'correct' : 'wrong');
      setIsTimerRunning(false);
      recordAnswer(correct, points);

      // ── Track answer history for segment bar ─────────────────────────────
      setAnswerHistory((prev) => {
        const next = [...prev];
        next[questionIndex] = correct ? 'correct' : 'wrong';
        return next;
      });

      // ── Accumulate darkness on wrong answers (per difficulty) ─────────────
      if (!correct) {
        const penaltyAmount = difficulty === 'hard' ? 7 : difficulty === 'medium' ? 5 : 3;
        setDarkness((prev) => Math.min(70, prev + penaltyAmount));
      }

      // ── Flash green/red tint on image ────────────────────────────────────
      flashGreen.value = correct ? 1 : 0;
      flashOpacity.value = withSequence(
        withTiming(0.45, { duration: 80 }),
        withTiming(0, { duration: 500 }),
      );

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
      if (powerUpId === 'hint') {
        // Shows the first letter (handled by question component via state)
        setHintUsed(true);
        playEffect('coin');
      } else if (powerUpId === 'reveal-blur') {
        setBlurAmount(Math.max(0, blurAmount - 5));
        playEffect('coin');
      } else if (powerUpId === 'skip-question') {
        if (questionIndex >= questions.length - 1 || questionIndex >= 19) {
          finishGame();
        } else {
          advanceQuestion();
        }
      } else if (powerUpId === 'double-xp') {
        activateDoubleXP();
        playEffect('coin');
      }
    },
    [
      activateDoubleXP,
      advanceQuestion,
      blurAmount,
      currentQuestion,
      feedback,
      finishGame,
      paused,
      playEffect,
      powerUps,
      questionIndex,
      questions.length,
      setBlurAmount,
      usePowerUp,
    ],
  );

  const restart = useCallback(() => {
    endedRef.current = false;
    countdownStarted.current = true; // questions already loaded; trigger countdown manually
    setPaused(false);
    setSelectedAnswer(null);
    setFeedback(null);
    setDarkness(0);
    setAnswerHistory([]);
    setCountdown(3);
    startSession(difficulty, category);
  }, [category, difficulty, startSession]);

  const exitToLobby = useCallback(() => {
    // Count early exits as completed sessions for the double-reward counter (spec §7.2)
    incrementSessionCounter();
    resetGame();
    router.replace(ROUTES.LOBBY);
  }, [incrementSessionCounter, resetGame, router]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));
  const timerStyle = useAnimatedStyle(() => ({
    opacity: timer < 30 ? withSequence(withTiming(0.45, { duration: 500 }), withTiming(1, { duration: 500 })) : 1,
  }));
  const flashOverlayStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    backgroundColor: interpolateColor(
      flashGreen.value,
      [0, 1],
      ['rgba(255,23,68,1)', 'rgba(0,230,118,1)'],
    ),
  }));
  const cdStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cdScale.value }],
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
                  index < questionIndex && (
                    answerHistory[index] === 'wrong' ? styles.segmentWrong : styles.segmentDone
                  ),
                  index === questionIndex && { backgroundColor: config.color },
                ]}
              />
            ))}
          </View>
          <Text style={styles.score}>+{score}</Text>
        </View>

        {isOffline && !loading && !loadError && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={13} color="#A78BFA" />
            <Text style={styles.offlineBannerText}>Offline — using cached questions</Text>
          </View>
        )}

        {loadError ? (
          <View style={styles.loading}>
            <Ionicons name="cloud-offline-outline" size={48} color={GameColors.textSecondary} />
            <Text style={[styles.loadingText, { color: '#FF4444', textAlign: 'center', paddingHorizontal: 24 }]}>
              {loadError}
            </Text>
            <TouchableOpacity
              style={{ marginTop: 12, paddingVertical: 12, paddingHorizontal: 28,
                       borderRadius: 12, borderWidth: 1, borderColor: GameColors.border }}
              onPress={() => router.back()}
            >
              <Text style={{ color: GameColors.textWhite, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                ← Go Back
              </Text>
            </TouchableOpacity>
          </View>
        ) : loading || !currentQuestion ? (
          <View style={styles.loading}>
            <ActivityIndicator color={GameColors.accentGold} size="large" />
            <Text style={styles.loadingText}>
              Generating {category} questions ({difficulty})…
            </Text>
          </View>
        ) : (
          <>
            <Animated.View style={[styles.imageWrap, shakeStyle]}>
              {gameImageUrl ? (
                <Image
                  source={{ uri: gameImageUrl }}
                  style={styles.image}
                  blurRadius={blurRadius}
                />
              ) : (
                <View style={[styles.image, { alignItems: 'center', justifyContent: 'center',
                               backgroundColor: 'rgba(139,92,246,0.1)' }]}>
                  <Ionicons name="image-outline" size={48} color={GameColors.textSecondary} />
                  <Text style={{ color: GameColors.textSecondary, fontFamily: 'Inter_400Regular',
                                 fontSize: 12, marginTop: 8 }}>Image unavailable</Text>
                </View>
              )}
              {/* Reveal % — top-left corner badge, keeps image clean */}
              <View style={[styles.imageBadge, { borderColor: config.color }]}>
                <Ionicons name="eye-outline" size={16} color={config.color} />
                <Text style={[styles.imageBadgeText, { color: config.color }]}>
                  {Math.round(clarityProgress)}% REVEAL
                </Text>
              </View>
              {/* Combo / Super Combo — top-right corner */}
              {streak >= 3 && (
                <View style={[styles.streakBadge, superComboActive && styles.superComboBadge]}>
                  <Text style={[styles.streakText, superComboActive && styles.superComboText]}>
                    {superComboActive ? `⚡ ${streak}x SUPER` : `🔥 ${streak}x COMBO`}
                  </Text>
                </View>
              )}
              {/* Super Combo announcement overlay — fires once on activation */}
              {superComboVisible && (
                <View style={styles.superComboAnnounce}>
                  <Text style={styles.superComboAnnounceText}>⚡ SUPER COMBO! ×2.5 XP</Text>
                </View>
              )}
              {/* Dark overlay — accumulates on wrong answers */}
              {darkness > 0 && (
                <View
                  pointerEvents="none"
                  style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(0,0,0,${darkness / 100})` }]}
                />
              )}
              {/* Flash tint — green on correct, red on wrong */}
              <Animated.View
                pointerEvents="none"
                style={[StyleSheet.absoluteFillObject, flashOverlayStyle]}
              />
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
                ['hint', 'bulb-outline', 'Hint'],
                ['reveal-blur', 'eye-outline', 'Reveal'],
                ['skip-question', 'play-skip-forward-outline', 'Skip'],
                ['double-xp', 'flash-outline', '2x XP'],
              ] as [PowerUpId, React.ComponentProps<typeof Ionicons>['name'], string][]).map(([id, icon, label]) => (
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
                    disabled={Boolean(feedback) || countdown > -1}
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

      {/* ── Countdown overlay ─────────────────────────────────────────────── */}
      {countdown > -1 && !loading && (
        <View style={styles.countdownOverlay}>
          <Animated.Text
            style={[
              styles.countdownNumber,
              cdStyle,
              countdown === 0 && { color: GameColors.accentGreen },
            ]}
          >
            {countdown === 0 ? 'GO!' : String(countdown)}
          </Animated.Text>
          <Text style={styles.countdownSub}>
            {countdown === 0 ? 'Have fun!' : 'Get ready…'}
          </Text>
        </View>
      )}

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
  segmentWrong: { backgroundColor: GameColors.accentRed },
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
  offlineBanner: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(167,139,250,0.35)', backgroundColor: 'rgba(167,139,250,0.10)' },
  offlineBannerText: { color: '#A78BFA', fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 0.4 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { ...Typography.caption, color: GameColors.textSecondary },
  // ── Countdown ─────────────────────────────────────────────────────────────
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13,2,33,0.82)',
    zIndex: 100,
  },
  countdownNumber: {
    fontSize: 96,
    fontFamily: 'Inter_700Bold',
    color: GameColors.textWhite,
    textShadowColor: GameColors.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 32,
    lineHeight: 110,
  },
  countdownSub: {
    ...Typography.caption,
    color: GameColors.textSecondary,
    marginTop: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
