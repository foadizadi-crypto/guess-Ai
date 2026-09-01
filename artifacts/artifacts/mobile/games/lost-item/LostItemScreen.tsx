import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { hapticsService } from '@/services/HapticsService';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { PauseMenu } from '@/components/PauseMenu';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { useAdStore } from '@/store/adStore';
import { useAudio } from '@/hooks/useAudio';
import { STAMINA_PER_GAME } from '@/constants/economy';
import { ROUTES } from '@/navigation/routes';
import { isDifficultyOpen } from '@/shared/difficulty';
import {
  LOST_ITEM_DARK_MS,
  LOST_ITEM_GAME_OVER_WRONGS,
  LOST_ITEM_QUESTIONS,
  LOST_ITEM_SCORE_CORRECT,
  LOST_ITEM_SCORE_WRONG,
} from '@/games/lost-item/config';
import {
  buildLostItemQuestion,
  phaseMsForDifficulty,
  type LostItemQuestion,
} from '@/games/lost-item/engine';

type Phase = 'loading' | 'look' | 'dark' | 'answer' | 'feedback';

const emptyRound = (): Array<LostItemQuestion | null> => Array.from({ length: LOST_ITEM_QUESTIONS }, () => null);

const LostItemScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const difficulty = useGameStore((s) => s.selectedDifficulty);
  const category = useGameStore((s) => s.selectedCategory);
  const score = useGameStore((s) => s.score);
  const gameSession = useGameStore((s) => s.gameSession);
  const recordAnswer = useGameStore((s) => s.recordAnswer);
  const advanceQuestion = useGameStore((s) => s.advanceQuestion);
  const restartSession = useGameStore((s) => s.restartSession);
  const resetRoundProgress = useGameStore((s) => s.resetRoundProgress);
  const endSession = useGameStore((s) => s.endSession);
  const resetGame = useGameStore((s) => s.resetGame);
  const spendEnergy = useUserStore((s) => s.spendEnergy);
  const canInGameRetryAd = useUserStore((s) => s.canInGameRetryAd);
  const consumeInGameRetryAd = useUserStore((s) => s.consumeInGameRetryAd);
  const { showRewarded, isAdFreePassActive } = useAdStore();
  const { playEffect } = useAudio();

  const [questions, setQuestions] = useState<Array<LostItemQuestion | null>>(emptyRound);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const [remainingMs, setRemainingMs] = useState(phaseMsForDifficulty(difficulty));
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const endedRef = useRef(false);
  const genRef = useRef(0);
  const questionsRef = useRef(questions);
  questionsRef.current = questions;

  const current = questions[index];
  const lookMs = phaseMsForDifficulty(difficulty);
  const topPad = Platform.OS === 'web' ? 54 : insets.top + 8;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 12;

  const finish = useCallback((outcome: 'perfect' | 'win' | 'lose') => {
    if (endedRef.current) return;
    endedRef.current = true;
    setPaused(false);
    endSession({
      applyFinish: outcome !== 'lose',
      sessionOutcome: outcome,
    });
    setTimeout(() => {
      router.replace(ROUTES.RESULT);
    }, 50);
  }, [endSession, router]);

  const exitToLobby = useCallback(() => {
    setPaused(false);
    setTimeout(() => {
      resetGame();
      router.replace(ROUTES.LOBBY);
    }, 50);
  }, [resetGame, router]);

  const fillRest = useCallback(async (generation: number, startAt: number) => {
    try {
      for (let i = startAt; i < LOST_ITEM_QUESTIONS; i += 1) {
        if (generation !== genRef.current || endedRef.current) return;
        const question = await buildLostItemQuestion(difficulty);
        if (generation !== genRef.current || endedRef.current) return;
        setQuestions((prev) => {
          if (generation !== genRef.current) return prev;
          const next = [...prev];
          next[i] = question;
          return next;
        });
      }
    } catch (err) {
      if (generation !== genRef.current || endedRef.current) return;
      setLoadError(err instanceof Error ? err.message : 'Lost Item images failed');
    }
  }, [difficulty]);

  const deal = useCallback(async () => {
    const generation = genRef.current + 1;
    genRef.current = generation;
    endedRef.current = false;
    setLoadError(null);
    setQuestions(emptyRound());
    setIndex(0);
    setPhase('loading');
    setFeedback(null);
    setPicked(null);
    setPaused(false);
    try {
      const first = await buildLostItemQuestion(difficulty);
      if (generation !== genRef.current) return;
      setQuestions((prev) => {
        const next = [...prev];
        next[0] = first;
        return next;
      });
      setPhase('look');
      setRemainingMs(phaseMsForDifficulty(difficulty));
      void fillRest(generation, 1);
    } catch (err) {
      if (generation !== genRef.current) return;
      setLoadError(err instanceof Error ? err.message : 'Lost Item images failed');
    }
  }, [difficulty, fillRest]);

  const afterAnswer = useCallback(() => {
    const wrongs = useGameStore.getState().totalWrong;
    if (wrongs >= LOST_ITEM_GAME_OVER_WRONGS) {
      finish('lose');
      return;
    }
    const last = index >= LOST_ITEM_QUESTIONS - 1;
    if (last) {
      const corrects = useGameStore.getState().correctAnswers;
      finish(corrects === LOST_ITEM_QUESTIONS ? 'perfect' : 'win');
      return;
    }
    advanceQuestion();
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setFeedback(null);
    setPicked(null);
    if (questionsRef.current[nextIndex]) {
      setPhase('look');
      setRemainingMs(phaseMsForDifficulty(difficulty));
    } else {
      setPhase('loading');
    }
  }, [advanceQuestion, difficulty, finish, index]);

  const submit = useCallback((correct: boolean, choice: number | null) => {
    if (endedRef.current || phase !== 'answer') return;
    setPicked(choice);
    setFeedback(correct ? 'correct' : 'wrong');
    setPhase('feedback');
    recordAnswer(correct, correct ? LOST_ITEM_SCORE_CORRECT : LOST_ITEM_SCORE_WRONG);
    hapticsService.notification(correct ? 1 : 0);
    playEffect(correct ? 'correct' : 'wrong');
  }, [phase, playEffect, recordAnswer]);

  useEffect(() => {
    if (!isDifficultyOpen(difficulty)) {
      router.replace(ROUTES.LEVEL_SELECT);
    }
  }, [difficulty, router]);

  useEffect(() => {
    if (gameSession) return;
    const t = setTimeout(() => {
      if (!useGameStore.getState().gameSession) router.replace(ROUTES.LOBBY);
    }, 50);
    return () => clearTimeout(t);
  }, [gameSession, router]);

  useEffect(() => {
    if (!gameSession?.id) return;
    void deal();
    return () => {
      genRef.current += 1;
    };
  }, [deal, gameSession?.id]);

  useEffect(() => {
    if (phase !== 'loading' || loadError || !current) return;
    setPhase('look');
    setRemainingMs(lookMs);
  }, [current, loadError, lookMs, phase]);

  useEffect(() => {
    if (phase !== 'feedback' || endedRef.current) return;
    const t = setTimeout(() => {
      afterAnswer();
    }, 1000);
    return () => clearTimeout(t);
  }, [afterAnswer, phase]);

  useEffect(() => {
    if (paused || endedRef.current) return;
    if (phase !== 'look' && phase !== 'dark' && phase !== 'answer') return;
    const id = setInterval(() => {
      setRemainingMs((ms) => (ms <= 100 ? 0 : ms - 100));
    }, 100);
    return () => clearInterval(id);
  }, [index, paused, phase]);

  useEffect(() => {
    if (paused || endedRef.current || remainingMs > 0) return;
    if (phase === 'look') {
      setPhase('dark');
      setRemainingMs(LOST_ITEM_DARK_MS);
      return;
    }
    if (phase === 'dark') {
      setPhase('answer');
      setRemainingMs(lookMs);
      return;
    }
    if (phase === 'answer') {
      submit(false, null);
    }
  }, [lookMs, paused, phase, remainingMs, submit]);

  const restart = useCallback(() => {
    const begin = () => {
      endedRef.current = false;
      restartSession(difficulty, category);
    };
    if (spendEnergy()) {
      begin();
      return;
    }
    if (isAdFreePassActive()) {
      begin();
      return;
    }
    if (Platform.OS === 'web') {
      Alert.alert(
        'Ads unavailable',
        'Rewarded ads are not available in the browser. Refill stamina from the lobby.',
        [
          { text: 'Keep playing', style: 'cancel' },
          { text: 'Exit to lobby', onPress: exitToLobby },
        ],
      );
      return;
    }
    if (canInGameRetryAd()) {
      Alert.alert(
        'Retry this game',
        'Watch an ad to retry without spending stamina.',
        [
          { text: 'Keep playing', style: 'cancel' },
          {
            text: 'Watch ad',
            onPress: () => {
              void (async () => {
                const granted = isAdFreePassActive() || (await showRewarded());
                if (!granted) return;
                if (!consumeInGameRetryAd()) return;
                begin();
              })();
            },
          },
        ],
      );
      return;
    }
    Alert.alert(
      'Not enough stamina',
      `Restarting starts a new round and costs ${STAMINA_PER_GAME} stamina. Refill from the lobby first.`,
      [
        { text: 'Keep playing', style: 'cancel' },
        { text: 'Exit to lobby', onPress: exitToLobby },
      ],
    );
  }, [
    canInGameRetryAd,
    category,
    consumeInGameRetryAd,
    difficulty,
    exitToLobby,
    isAdFreePassActive,
    showRewarded,
    spendEnergy,
    restartSession,
  ]);

  const timerLabel = `${(remainingMs / 1000).toFixed(1)}s`;
  const sceneUri = phase === 'answer' || phase === 'feedback' ? current?.missingUrl : current?.sceneUrl;

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
        <View style={styles.topBar}>
          <BackButton onPress={() => setPaused(true)} />
          <View style={styles.topCenter}>
            <Text style={styles.mode}>LOST ITEM</Text>
            <Text style={[styles.timer, { color: remainingMs <= 1000 ? GameColors.accentRed : GameColors.textWhite }]}>
              {phase === 'loading' ? '—' : timerLabel}
            </Text>
          </View>
          <TouchableOpacity style={styles.pauseButton} onPress={() => setPaused(true)}>
            <Ionicons name="pause" size={20} color={GameColors.textWhite} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.counter}>{index + 1} / {LOST_ITEM_QUESTIONS}</Text>
          <View style={styles.segmentTrack}>
            {Array.from({ length: LOST_ITEM_QUESTIONS }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.segment,
                  i < index && styles.segmentDone,
                  i === index && styles.segmentNow,
                ]}
              />
            ))}
          </View>
          <Text style={styles.score}>{score}</Text>
        </View>

        {phase === 'loading' || !current ? (
          <View style={styles.loadingBox}>
            <Text style={styles.loading}>{loadError ?? 'Lost Item'}</Text>
            {loadError ? (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  hapticsService.impact(0);
                  resetRoundProgress();
                  void deal();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.retryLabel}>Retry</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <>
            <View style={styles.stage}>
              {phase === 'dark' ? (
                <View style={styles.blackout} />
              ) : (
                <Image source={{ uri: sceneUri }} style={styles.scene} resizeMode="cover" />
              )}
            </View>

            <Text style={styles.prompt}>
              {phase === 'answer' || phase === 'feedback' ? 'WHICH OBJECT IS MISSING?' : ''}
            </Text>

            {(phase === 'answer' || phase === 'feedback') && (
              <View style={styles.answers}>
                {current.options.map((option, optionIndex) => {
                  const selected = picked === optionIndex;
                  const showCorrect = phase === 'feedback' && optionIndex === current.correctIndex;
                  const showWrong = phase === 'feedback' && selected && optionIndex !== current.correctIndex;
                  const thumb = current.optionUrls[optionIndex];
                  return (
                    <TouchableOpacity
                      key={`${option.id}-${optionIndex}`}
                      style={[
                        styles.answer,
                        showCorrect && styles.answerCorrect,
                        showWrong && styles.answerWrong,
                      ]}
                      disabled={phase !== 'answer'}
                      onPress={() => submit(optionIndex === current.correctIndex, optionIndex)}
                      activeOpacity={0.85}
                    >
                      {thumb ? (
                        <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {feedback ? (
              <Text style={[styles.feedback, { color: feedback === 'correct' ? GameColors.accentGreen : GameColors.accentRed }]}>
                {feedback === 'correct' ? 'Correct' : 'Wrong'}
              </Text>
            ) : (
              <View style={styles.feedbackSpacer} />
            )}
          </>
        )}
      </View>

      <PauseMenu
        visible={paused}
        onResume={() => setPaused(false)}
        onRestart={restart}
        onExit={exitToLobby}
      />
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, gap: 10 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loading: { ...Typography.semibold, color: GameColors.textWhite, textAlign: 'center' },
  retryButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: GameColors.border,
  },
  retryLabel: { ...Typography.semibold, color: GameColors.textWhite },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topCenter: { alignItems: 'center' },
  mode: { ...Typography.small, color: GameColors.textSecondary, letterSpacing: 1 },
  timer: { fontSize: 30, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  pauseButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: GameColors.border,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counter: { ...Typography.small, color: GameColors.textSecondary, width: 42 },
  score: { ...Typography.small, color: GameColors.accentGold, width: 48, textAlign: 'right', fontFamily: 'Inter_700Bold' },
  segmentTrack: { flex: 1, flexDirection: 'row', gap: 3 },
  segment: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)' },
  segmentDone: { backgroundColor: GameColors.accentGreen },
  segmentNow: { backgroundColor: GameColors.accentGold },
  stage: {
    flex: 1,
    minHeight: 220,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GameColors.cardBorder,
    backgroundColor: GameColors.backgroundSecondary,
  },
  scene: { width: '100%', height: '100%' },
  blackout: { flex: 1, backgroundColor: '#000000' },
  prompt: {
    ...Typography.semibold,
    color: GameColors.accentGold,
    textAlign: 'center',
    letterSpacing: 1,
    minHeight: 24,
  },
  answers: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  answer: {
    width: '47%',
    flexGrow: 1,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: GameColors.border,
  },
  answerCorrect: { borderColor: GameColors.accentGreen, borderWidth: 2 },
  answerWrong: { borderColor: GameColors.accentRed, borderWidth: 2 },
  thumb: { width: '100%', height: '100%' },
  feedback: { ...Typography.semibold, textAlign: 'center', minHeight: 28 },
  feedbackSpacer: { minHeight: 28 },
});

export default LostItemScreen;
