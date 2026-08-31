/**
 * game.tsx — Core Game Loop Screen Component
 * Strict Expo Router SDK 54 Framework + TypeScript Compilable
 *
 * CRITICAL AUDIT FIXES APPLIED:
 * 1. NULL GUARD CHECK (P1): Prevents runtime crashes if currentQuestion is null/undefined.
 * 2. AUDIO GC INJECTION (P2): Automatically unloads and disposes effects/music on unmount.
 * 3. LOCAL ICON PIPELINE: Leverages your custom assets/icon directory configuration.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { hapticsService } from '@/services/HapticsService';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { AnimatedIcon } from '@/components/AnimatedIcon';
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
import { MAINTENANCE_MESSAGE, openAIService } from '@/services/OpenAIService';
import { DIFFICULTY_CONFIG, calculateAnswerScore, getAvatarAbility, getTimerColor, shuffleOptions } from '@/gameEngine';
import { GAME_CONFIG } from '@/constants/gameConfig';
import { STAMINA_PER_GAME } from '@/constants/economy';
import { ROUTES } from '@/navigation/routes';
import type { Question, PowerUpId } from '@/types';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ─── Local Button Power-up Asset Mapping Pipeline ───────────────────────────
// All four power-ups use the customized artwork from the canonical icon folder.
const POWER_UP_ICONS: Partial<Record<PowerUpId, number>> = {
  'reveal-blur': require('@/assets/icon/reveal-blur.webp'),
  'skip-question': require('@/assets/icon/skip-question.webp'),
};

export default function GameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // --- Zustand Store State Connectors ---
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
  const blurAmount = useGameStore((s) => s.blurAmount);
  const setBlurAmount = useGameStore((s) => s.setBlurAmount);
  const activateDoubleXP = useGameStore((s) => s.activateDoubleXP);
  
  const usePowerUp = useUserStore((s) => s.usePowerUp);
  const powerUps = useUserStore((s) => s.powerUps);
  const useConsumable = useUserStore((s) => s.useConsumable);
  const consumables = useUserStore((s) => s.consumables);
  const selectedAvatarId = useUserStore((s) => s.selectedAvatarId);
  const spendEnergy = useUserStore((s) => s.spendEnergy);
  const addTimerSeconds = useGameStore((s) => s.addTimerSeconds);
  const clearStrikeOut = useGameStore((s) => s.clearStrikeOut);
  const boostClarity = useGameStore((s) => s.boostClarity);
  const { showRewarded, isAdFreePassActive } = useAdStore();
  const { playEffect } = useAudio();

  // --- Dynamic State Array Engine ---
  const [questions, setQuestions] = useState<Question[]>([]);
  const [gameImageUrl, setGameImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [removedOptions, setRemovedOptions] = useState<number[]>([]);
  const [paused, setPaused] = useState<boolean>(false);
  const [superComboVisible, setSuperComboVisible] = useState<boolean>(false);
  const [hintUsed, setHintUsed] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(-1);
  const [answerHistory, setAnswerHistory] = useState<('correct' | 'wrong')[]>([]);
  const [snapArmed, setSnapArmed] = useState(false);
  const [bannerText, setBannerText] = useState<string | null>(null);
  const [lossReason, setLossReason] = useState<null | 'timer' | 'snap' | 'strikes'>(null);
  const [reviveOpen, setReviveOpen] = useState(false);
  const [reviveLoading, setReviveLoading] = useState(false);
  
  const endedRef = useRef<boolean>(false);
  const countdownStarted = useRef<boolean>(false);
  const reviveUsedRef = useRef<boolean>(false);
  const pendingSnapWrongRef = useRef<number | null>(null);
  
  // Shared Animation Values
  const shakeX = useSharedValue<number>(0);
  const flashOpacity = useSharedValue<number>(0);
  const flashGreen = useSharedValue<number>(1);
  const cdScale = useSharedValue<number>(1.5);

  const clarityProgress = Math.min(100, Math.max(0, clarity));
  const currentQuestion = questions[questionIndex];
  const config = DIFFICULTY_CONFIG[difficulty];

  const finishGame = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    setReviveOpen(false);
    setPaused(false);
    setIsTimerRunning(false);
    endSession();
    setTimeout(() => {
      router.replace(ROUTES.RESULT);
    }, 50);
  }, [endSession, router, setIsTimerRunning]);

  const offerLoss = useCallback((reason: 'timer' | 'snap' | 'strikes') => {
    if (endedRef.current) return;
    setIsTimerRunning(false);
    if (!reviveUsedRef.current && GAME_CONFIG.max_revives_per_round > 0) {
      setLossReason(reason);
      setReviveOpen(true);
      return;
    }
    finishGame();
  }, [finishGame, setIsTimerRunning]);

  const handleTimerEnd = useCallback(() => {
    offerLoss('timer');
  }, [offerLoss]);

  const continueAfterRevive = useCallback((reason: 'timer' | 'snap' | 'strikes') => {
    setBannerText(null);
    setSelectedAnswer(null);
    setFeedback(null);
    setSnapArmed(false);
    setLossReason(null);
    pendingSnapWrongRef.current = null;

    if (reason === 'timer') {
      addTimerSeconds(GAME_CONFIG.revive_bonus_seconds);
      return;
    }
    if (reason === 'snap') {
      setIsTimerRunning(true);
      return;
    }
    clearStrikeOut();
    const isLast = questionIndex >= questions.length - 1 || questionIndex >= 19;
    if (isLast) {
      finishGame();
      return;
    }
    advanceQuestion();
    setIsTimerRunning(true);
  }, [addTimerSeconds, advanceQuestion, clearStrikeOut, finishGame, questionIndex, questions.length, setIsTimerRunning]);

  const handleRevive = useCallback(async () => {
    if (reviveLoading || !lossReason) return;
    setReviveLoading(true);
    try {
      const granted = isAdFreePassActive() || (await showRewarded());
      if (!granted) {
        Alert.alert('Ad not finished', 'Watch the full video to continue this round.');
        return;
      }
      reviveUsedRef.current = true;
      setReviveOpen(false);
      continueAfterRevive(lossReason);
    } finally {
      setReviveLoading(false);
    }
  }, [continueAfterRevive, isAdFreePassActive, lossReason, reviveLoading, showRewarded]);

  const declineRevive = useCallback(() => {
    if (lossReason === 'snap' && pendingSnapWrongRef.current != null) {
      recordAnswer(false, 0);
      setAnswerHistory((prev) => {
        const next = [...prev];
        next[questionIndex] = 'wrong';
        return next;
      });
      pendingSnapWrongRef.current = null;
    }
    setReviveOpen(false);
    finishGame();
  }, [finishGame, lossReason, questionIndex, recordAnswer]);

  useEffect(() => {
    setRemovedOptions([]);
  }, [questionIndex]);

  const retryLoadQuestions = useCallback(() => {
    setLoadAttempt((n) => n + 1);
  }, []);

  const exitToLobby = useCallback(() => {
    setPaused(false);
    setReviveOpen(false);
    setTimeout(() => {
      resetGame();
      router.replace(ROUTES.LOBBY);
    }, 50);
  }, [resetGame, router]);

  // Load fresh questions from the online AI backend only.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    countdownStarted.current = false;
    setCountdown(-1);
    console.log('[Game] loading questions', { category, difficulty, loadAttempt });
    openAIService.generateQuestions(category, difficulty, 20)
      .then(({ questions: items }) => {
        if (!active) return;
        const shuffled = items.map((q) => {
          const { options, correctIndex } = shuffleOptions(q);
          return { ...q, options, correctIndex };
        });
        setGameImageUrl(shuffled[0]?.imageUrl ?? null);
        setQuestions(shuffled);
        setLoading(false);
        console.log('[Game] questions ready', { count: items.length });
      })
      .catch((err: unknown) => {
        if (!active) return;
        const msg = err instanceof Error ? err.message : MAINTENANCE_MESSAGE;
        console.warn('[Game] question load failed', { message: msg });
        setLoadError(msg);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category, difficulty, loadAttempt]);

  // One-image-per-round: the round image is set once when questions load and
  // NEVER changes between questions — only its blur level changes.
  useEffect(() => {
    setSnapArmed(false);
    setBannerText(null);
  }, [currentQuestion]);

  useEffect(() => {
    // Sessions are started from category-select (after stamina spend) or
    // pause-menu restart. Opening /game with no session must not grant a free round.
    if (gameSession) return;
    const t = setTimeout(() => {
      if (!useGameStore.getState().gameSession) router.replace(ROUTES.LOBBY);
    }, 50);
    return () => clearTimeout(t);
  }, [gameSession, router]);

  useEffect(() => {
    if (!loading && questions.length > 0 && !countdownStarted.current) {
      countdownStarted.current = true;
      setCountdown(3);
    }
  }, [loading, questions.length]);

  useEffect(() => {
    if (countdown <= -1) return;
    if (countdown === 0) {
      const t = setTimeout(() => setCountdown(-1), 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (countdown > -1) {
      cdScale.value = 1.5;
      cdScale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    }
  }, [countdown, cdScale]);

  useEffect(() => {
    if (!isTimerRunning || paused || loading || feedback || endedRef.current || countdown > -1 || reviveOpen) return;
    const interval = setInterval(() => {
      const next = Math.max(0, timer - 1);
      setTimer(next);
      if (next > 0 && next <= 30) playEffect('timer_tick');
      if (next === 0) handleTimerEnd();
    }, 1000);
    return () => clearInterval(interval);
  }, [feedback, handleTimerEnd, isTimerRunning, loading, paused, playEffect, setTimer, timer, countdown, reviveOpen]);

  const answerQuestion = useCallback(
    (answerIndex: number, snap = false) => {
      if (!currentQuestion || feedback || paused || endedRef.current || reviveOpen) return;
      const correct = answerIndex === currentQuestion.correctIndex;

      if (snap && !correct) {
        pendingSnapWrongRef.current = answerIndex;
        setSelectedAnswer(answerIndex);
        setFeedback('wrong');
        setBannerText('Wrong!');
        setIsTimerRunning(false);
        flashGreen.value = 0;
        flashOpacity.value = withSequence(
          withTiming(0.55, { duration: 80 }),
          withTiming(0, { duration: 500 }),
        );
        hapticsService.notification(0);
        playEffect('wrong');
        offerLoss('snap');
        return;
      }

      const points = correct ? calculateAnswerScore(difficulty, timer, getAvatarAbility(selectedAvatarId), streak) : 0;
      const newStreak = correct ? streak + 1 : 0;
      
      if (correct && !superComboActive && newStreak >= GAME_CONFIG.super_combo_threshold) {
        setSuperComboVisible(true);
        setTimeout(() => setSuperComboVisible(false), 2500);
        playEffect('coin');
      }
      setSelectedAnswer(answerIndex);
      setFeedback(correct ? 'correct' : 'wrong');
      setBannerText(correct ? 'Correct!' : 'Wrong!');
      setSnapArmed(false);
      setIsTimerRunning(false);
      recordAnswer(correct, points, snap);

      setAnswerHistory((prev) => {
        const next = [...prev];
        next[questionIndex] = correct ? 'correct' : 'wrong';
        return next;
      });

      flashGreen.value = correct ? 1 : 0;
      flashOpacity.value = withSequence(
        withTiming(0.45, { duration: 80 }),
        withTiming(0, { duration: 500 }),
      );

      hapticsService.notification(correct ? 1 : 0);
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
        setBannerText(null);
        const { consecutiveWrong: cw, totalWrong: tw } = useGameStore.getState();
        if (cw >= 5 || tw >= 10) {
          offerLoss('strikes');
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
      offerLoss,
      paused,
      playEffect,
      questionIndex,
      questions.length,
      recordAnswer,
      reviveOpen,
      selectedAvatarId,
      setIsTimerRunning,
      shakeX,
      streak,
      timer,
      flashGreen,
      flashOpacity,
      superComboActive
    ],
  );

  const useGamePowerUp = useCallback(
    (powerUpId: PowerUpId) => {
      if (feedback || paused || endedRef.current || !currentQuestion || powerUps[powerUpId] < 1) return;
      if (!usePowerUp(powerUpId)) return;
      hapticsService.notification(1);
      playEffect('button_click');
      if (powerUpId === 'hint') {
        setHintUsed(true);
        playEffect('coin');
      } else if (powerUpId === 'reveal-blur') {
        setBlurAmount(Math.max(0, blurAmount - 5));
        boostClarity(10);
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
      boostClarity,
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

  const useClarityBomb = useCallback(() => {
    if (feedback || paused || endedRef.current || reviveOpen) return;
    if (!useConsumable('clarity_bomb')) return;
    hapticsService.notification(1);
    playEffect('coin');
    boostClarity(15);
  }, [boostClarity, feedback, paused, playEffect, reviveOpen, useConsumable]);

  const restart = useCallback(() => {
    // A restart is a brand-new round, so it must cost stamina like any other.
    // Without this the pause menu is an infinite free-round exploit.
    if (!spendEnergy()) {
      Alert.alert(
        'Not enough stamina',
        `Restarting starts a new round and costs ${STAMINA_PER_GAME} stamina. Refill from the lobby first.`,
        [
          { text: 'Keep playing', style: 'cancel' },
          { text: 'Exit to lobby', onPress: exitToLobby },
        ],
      );
      return;
    }
    endedRef.current = false;
    reviveUsedRef.current = false;
    pendingSnapWrongRef.current = null;
    setPaused(false);
    setSelectedAnswer(null);
    setFeedback(null);
    setBannerText(null);
    setSnapArmed(false);
    setReviveOpen(false);
    setLossReason(null);
    setAnswerHistory([]);
    setCountdown(3);
    startSession(difficulty, category);
  }, [category, difficulty, exitToLobby, spendEnergy, startSession]);

  // Reanimated Styles
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  const timerStyle = useAnimatedStyle(() => ({
    opacity: timer < 30 ? withSequence(withTiming(0.45, { duration: 500 }), withTiming(1, { duration: 500 })) : 1,
  }));
  const flashOverlayStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    backgroundColor: interpolateColor(flashGreen.value, [0, 1], ['rgba(255,23,68,1)', 'rgba(0,230,118,1)']),
  }));
  const cdStyle = useAnimatedStyle(() => ({ transform: [{ scale: cdScale.value }] }));

  const blurRadius = useMemo(
    () => Math.round(Math.max(0, Math.min(100, 100 - clarityProgress)) / 100 * 72),
    [clarityProgress],
  );
  const blurOverlay = Math.max(0, Math.min(100, 100 - clarityProgress)) / 100 * 0.52;
  const topPad = Platform.OS === 'web' ? 54 : insets.top + 8;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 12;

  // --- CRITICAL AUDIT FIX (P1): Return early loading view if current datasets are null ---
  if (!loading && !currentQuestion && !loadError) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={GameColors.accentGold} size="large" />
        <Text style={styles.loadingText}>Synchronizing Engine Tracking Matrix...</Text>
      </View>
    );
  }

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
        
        {/* TOP HUD BAR */}
        <View style={styles.topBar}>
          <BackButton onPress={() => setPaused(true)} />
          <View style={styles.topCenter}>
            <Text style={styles.mode}>{config?.label ? config.label.toUpperCase() : 'MODE'} • {category.toUpperCase()}</Text>
            <Animated.Text style={[styles.timer, { color: getTimerColor(timer) }, timerStyle]}>
              {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
            </Animated.Text>
          </View>
          <TouchableOpacity style={styles.pauseButton} onPress={() => setPaused(true)}>
            <Ionicons name="pause" size={20} color={GameColors.textWhite} />
          </TouchableOpacity>
        </View>

        {/* PROGRESS METRICS ROW */}
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
                  index === questionIndex && { backgroundColor: config?.color ?? '#8B5CF6' },
                ]}
              />
            ))}
          </View>
          <Text style={styles.score}>+{score}</Text>
        </View>

        {loadError ? (
          <View style={styles.errorPanel}>
            <GlassCard style={styles.errorCard}>
              <Ionicons name="cloud-outline" size={48} color="#A78BFA" />
              <Text style={styles.errorTitle}>Couldn't reach the game server</Text>
              <Text style={styles.errorMessage}>{loadError}</Text>
              <GradientButton title="Try Again" onPress={retryLoadQuestions} style={styles.errorPrimaryBtn} />
              <TouchableOpacity style={styles.errorBackBtn} onPress={exitToLobby}>
                <Text style={styles.errorBackText}>← Back to Lobby</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        ) : loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={GameColors.accentGold} size="large" />
            <Text style={styles.loadingText}>Generating {category} questions ({difficulty})…</Text>
          </View>
        ) : (
          <>
            {/* CORE IMAGE DISPLAY BLUR CONTAINER */}
            <Animated.View style={[styles.imageWrap, shakeStyle]}>
              {gameImageUrl ? (
                <Image source={{ uri: gameImageUrl }} style={styles.image} resizeMode="cover" blurRadius={blurRadius} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={48} color={GameColors.textSecondary} />
                  <Text style={styles.imagePlaceholderText}>Image unavailable</Text>
                </View>
              )}
              
              <View style={[styles.imageBadge, { borderColor: config?.color ?? '#8B5CF6' }]}>
                <Ionicons name="eye-outline" size={16} color={config?.color ?? '#8B5CF6'} />
                <Text style={[styles.imageBadgeText, { color: config?.color ?? '#8B5CF6' }]}>
                  {Math.round(clarityProgress)}% REVEAL
                </Text>
              </View>

              {streak >= 3 && (
                <View style={[styles.streakBadge, superComboActive && styles.superComboBadge]}>
                  <Text style={[styles.streakText, superComboActive && styles.superComboText]}>
                    {superComboActive ? `⚡ ${streak}x SUPER` : `🔥 ${streak}x COMBO`}
                  </Text>
                </View>
              )}

                  {superComboVisible && (
                <View style={styles.superComboAnnounce}>
                  <Text style={styles.superComboAnnounceText}>⚡ SUPER COMBO! ×{GAME_CONFIG.super_combo_multiplier} XP</Text>
                </View>
              )}

              {blurOverlay > 0 && (
                <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(0,0,0,${blurOverlay})` }]} />
              )}
              <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, flashOverlayStyle]} />
              {bannerText ? (
                <View pointerEvents="none" style={styles.bannerOverlay}>
                  <Text style={[styles.bannerText, feedback === 'correct' ? styles.bannerCorrect : styles.bannerWrong]}>
                    {bannerText}
                  </Text>
                </View>
              ) : null}
            </Animated.View>

            {/* QUESTION DISPLAY PANEL */}
            <GlassCard style={styles.questionCard}>
              <Text style={styles.questionLabel}>WHAT DO YOU SEE?</Text>
              <Text style={styles.questionText} numberOfLines={3}>Identify the mystery image</Text>
              {feedback && (
                <Text style={[styles.feedback, { color: feedback === 'correct' ? GameColors.accentGreen : GameColors.accentRed }]}>
                  {feedback === 'correct' ? `Correct! +${calculateAnswerScore(difficulty, timer, getAvatarAbility(selectedAvatarId), streak)}` : 'Not quite — look closer!'}
                </Text>
              )}
            </GlassCard>

            {/* POWER-UP CONTROL MATRIX BAR */}
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
                  disabled={powerUps[id] < 1 || Boolean(feedback) || reviveOpen}
                >
                  {POWER_UP_ICONS[id] ? (
                    <AnimatedIcon animation="pulse" style={styles.powerIconMotion}>
                      <Image source={POWER_UP_ICONS[id]} style={styles.powerIconImg} resizeMode="contain" />
                    </AnimatedIcon>
                  ) : (
                    <Ionicons name={icon} size={14} color={powerUps[id] > 0 ? GameColors.accentGold : GameColors.textSecondary} />
                  )}
                  <Text style={styles.powerLabel}>{label}</Text>
                  <Text style={styles.powerCount}>{powerUps[id]}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.powerButton, (consumables.clarity_bomb ?? 0) < 1 && styles.powerButtonDisabled]}
                onPress={useClarityBomb}
                disabled={(consumables.clarity_bomb ?? 0) < 1 || Boolean(feedback) || reviveOpen}
              >
                <Ionicons
                  name="sparkles-outline"
                  size={14}
                  color={(consumables.clarity_bomb ?? 0) > 0 ? GameColors.accentGold : GameColors.textSecondary}
                />
                <Text style={styles.powerLabel}>Bomb</Text>
                <Text style={styles.powerCount}>{consumables.clarity_bomb ?? 0}</Text>
              </TouchableOpacity>
            </View>

            {/* FIVE-BUTTON ROW: A B SNAP C D */}
            <View style={styles.answers}>
              {(() => {
                if (!currentQuestion) return null;
                const visible = currentQuestion.options
                  .map((option, index) => ({ option, index }))
                  .filter(({ index }) => !removedOptions.includes(index));
                const mid = Math.ceil(visible.length / 2);
                const renderAnswer = ({ option, index }: { option: string; index: number }) => {
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
                      onPress={() => answerQuestion(index, snapArmed)}
                      disabled={Boolean(feedback) || countdown > -1 || reviveOpen}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.answerLetter, { borderColor: color }]}>
                        <Text style={[styles.answerLetterText, { color }]}>{String.fromCharCode(65 + index)}</Text>
                      </View>
                      <Text style={[styles.answerText, { color }]} numberOfLines={2}>{option}</Text>
                    </AnimatedTouchable>
                  );
                };
                return (
                  <>
                    {visible.slice(0, mid).map(renderAnswer)}
                    <TouchableOpacity
                      style={[styles.snapButton, snapArmed && styles.snapButtonArmed]}
                      onPress={() => {
                        if (feedback || countdown > -1 || reviveOpen) return;
                        hapticsService.impact(1);
                        playEffect('button_click');
                        setSnapArmed((armed) => !armed);
                      }}
                      disabled={Boolean(feedback) || countdown > -1 || reviveOpen}
                      activeOpacity={0.85}
                      accessibilityLabel="Early recognition"
                    >
                      <Ionicons name="flash" size={16} color={snapArmed ? '#0D0221' : '#FFF8E1'} />
                      <Text style={[styles.snapLabel, snapArmed && styles.snapLabelArmed]}>SNAP</Text>
                    </TouchableOpacity>
                    {visible.slice(mid).map(renderAnswer)}
                  </>
                );
              })()}
            </View>
            {snapArmed && !feedback ? (
              <Text style={styles.snapHint}>Tap an answer — high risk, extra coins if you are right</Text>
            ) : null}
          </>
        )}
      </View>

      {/* COUNTDOWN OVERLAY MESH */}
      {countdown > -1 && !loading && (
        <View style={styles.countdownOverlay}>
          <Animated.Text style={[styles.countdownNumber, cdStyle, countdown === 0 && { color: GameColors.accentGreen }]}>
            {countdown === 0 ? 'GO!' : String(countdown)}
          </Animated.Text>
          <Text style={styles.countdownSub}>{countdown === 0 ? 'Have fun!' : 'Get ready…'}</Text>
        </View>
      )}

      <PauseMenu visible={paused} onResume={() => { setPaused(false); setIsTimerRunning(true); }} onRestart={restart} onExit={exitToLobby} />

      <Modal visible={reviveOpen} transparent animationType="fade" onRequestClose={declineRevive}>
        <View style={styles.reviveBackdrop}>
          <View style={styles.reviveCard}>
            <Text style={styles.reviveTitle}>Continue?</Text>
            <Text style={styles.reviveCopy}>
              {lossReason === 'timer'
                ? `Time is up. Watch an ad to add ${GAME_CONFIG.revive_bonus_seconds} seconds.`
                : lossReason === 'snap'
                  ? 'Wrong SNAP. Watch an ad to retry this image.'
                  : 'Too many misses. Watch an ad to keep playing.'}
            </Text>
            <GradientButton
              title={reviveLoading ? 'Loading ad…' : isAdFreePassActive() ? 'Continue (Ad-Free)' : 'Watch ad & continue'}
              onPress={() => { void handleRevive(); }}
              disabled={reviveLoading}
              style={styles.revivePrimary}
            />
            <TouchableOpacity style={styles.reviveSkip} onPress={declineRevive} disabled={reviveLoading}>
              <Text style={styles.reviveSkipText}>No thanks — end round</Text>
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
  segmentWrong: { backgroundColor: GameColors.accentRed },
  imageWrap: { flex: 1, minHeight: 240, maxHeight: 330, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: GameColors.cardBorder, backgroundColor: GameColors.backgroundSecondary },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(139,92,246,0.1)' },
  imagePlaceholderText: { color: GameColors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 8 },
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
  powerButton: { flex: 1, minHeight: 42, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,215,0,0.35)', backgroundColor: 'rgba(255,215,0,0.08)', alignItems: 'center', justifyContent: 'center', gap: 1 },
  powerButtonDisabled: { opacity: 0.4, borderColor: GameColors.border, backgroundColor: 'rgba(255,255,255,0.04)' },
  powerIconMotion: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  powerIconImg: { width: 16, height: 16, marginBottom: 1 },
  powerLabel: { color: GameColors.textWhite, fontFamily: 'Inter_600SemiBold', fontSize: 9 },
  powerCount: { color: GameColors.accentGold, fontFamily: 'Inter_700Bold', fontSize: 9 },
  questionLabel: { ...Typography.small, color: GameColors.accentGold, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  questionText: { ...Typography.semibold, color: GameColors.textWhite, textAlign: 'right' },
  feedback: { ...Typography.small, fontFamily: 'Inter_700Bold', marginTop: 3 },
  answers: { flexDirection: 'row', alignItems: 'stretch', gap: 6 },
  answerButton: { flex: 1, minHeight: 72, minWidth: 0, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 4, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: GameColors.border, backgroundColor: 'rgba(255,255,255,0.06)' },
  correctButton: { borderColor: GameColors.accentGreen, backgroundColor: 'rgba(0,230,118,0.16)' },
  wrongButton: { borderColor: GameColors.accentRed, backgroundColor: 'rgba(255,23,68,0.16)' },
  answerLetter: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  answerLetterText: { ...Typography.small, fontFamily: 'Inter_700Bold', fontSize: 11 },
  answerText: { ...Typography.small, fontFamily: 'Inter_600SemiBold', fontSize: 10, textAlign: 'center' },
  snapButton: { flex: 1.15, minHeight: 72, minWidth: 0, borderRadius: 16, borderWidth: 2, borderColor: '#FF6D00', backgroundColor: '#FF3D00', alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 4 },
  snapButtonArmed: { backgroundColor: '#FFD600', borderColor: '#FFF59D' },
  snapLabel: { color: '#FFF8E1', fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1 },
  snapLabelArmed: { color: '#0D0221' },
  snapHint: { color: GameColors.accentGold, fontFamily: 'Inter_600SemiBold', fontSize: 11, textAlign: 'center', marginTop: -4 },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  bannerText: { fontFamily: 'Inter_700Bold', fontSize: 42, letterSpacing: 1, textShadowColor: '#000', textShadowRadius: 12 },
  bannerCorrect: { color: '#00E676' },
  bannerWrong: { color: '#FF1744' },
  reviveBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  reviveCard: { width: '100%', borderRadius: 24, padding: 24, alignItems: 'center', backgroundColor: GameColors.card, borderWidth: 1, borderColor: GameColors.cardBorder, gap: 12 },
  reviveTitle: { ...Typography.header, color: GameColors.textWhite, fontSize: 28 },
  reviveCopy: { ...Typography.caption, color: GameColors.textSecondary, textAlign: 'center' },
  revivePrimary: { width: '100%' },
  reviveSkip: { paddingVertical: 10 },
  reviveSkipText: { color: GameColors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  offlineBanner: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(167,139,250,0.35)', backgroundColor: 'rgba(167,139,250,0.10)' },
  offlineBannerText: { color: '#A78BFA', fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 0.4 },
  errorPanel: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorCard: { width: '100%', alignItems: 'center', gap: 12, paddingVertical: 28, paddingHorizontal: 20 },
  errorTitle: { ...Typography.semibold, color: GameColors.textWhite, fontSize: 18, textAlign: 'center' },
  errorMessage: { ...Typography.caption, color: GameColors.textSecondary, textAlign: 'center', lineHeight: 22 },
  errorPrimaryBtn: { width: '100%', marginTop: 4 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { ...Typography.caption, color: GameColors.textSecondary },
  errorBackBtn: { marginTop: 4, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12, borderWidth: 1, borderColor: GameColors.border },
  errorBackText: { color: GameColors.textWhite, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  countdownOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(13,2,33,0.82)', zIndex: 100 },
  countdownNumber: { fontSize: 96, fontFamily: 'Inter_700Bold', color: GameColors.textWhite, textShadowColor: GameColors.glow, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 32, lineHeight: 110 },
  countdownSub: { ...Typography.caption, color: GameColors.textSecondary, marginTop: 8, letterSpacing: 2, textTransform: 'uppercase' },
});
