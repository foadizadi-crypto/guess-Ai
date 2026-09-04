import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { hapticsService } from '@/services/HapticsService';
import { BackButton } from '@/components/BackButton';
import { PauseMenu } from '@/components/PauseMenu';
import { allowBlurFor, useVisualQuality } from '@/games/visualFoundation';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { useAdStore } from '@/store/adStore';
import { useAudio } from '@/hooks/useAudio';
import { useRTL } from '@/hooks/useRTL';
import { STAMINA_AD_REWARD, STAMINA_PER_GAME } from '@/constants/economy';
import { ROUTES } from '@/navigation/routes';
import { isDifficultyOpen } from '@/shared/difficulty';
import { LostItemWorld } from '@/games/lost-item/LostItemWorld';
import { LostItemHud, SearchPrompt } from '@/games/lost-item/LostItemHud';
import { SearchStage } from '@/games/lost-item/SearchStage';
import { EvidenceChip } from '@/games/lost-item/EvidenceChip';
import { FindTone } from '@/games/lost-item/searchTokens';
import {
  LOST_ITEM_ANSWER_OPTIONS,
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
  const navigation = useNavigation();
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
  const { flexDirection } = useRTL();
  const quality = useVisualQuality();

  const [questions, setQuestions] = useState<Array<LostItemQuestion | null>>(emptyRound);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const [remainingMs, setRemainingMs] = useState(phaseMsForDifficulty(difficulty));
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [thumbsLoaded, setThumbsLoaded] = useState(0);

  const endedRef = useRef(false);
  const genRef = useRef(0);
  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  const dealRef = useRef<() => Promise<void>>(async () => {});

  const current = questions[index];
  const lookMs = phaseMsForDifficulty(difficulty);
  const topPad = Platform.OS === 'web' ? 54 : insets.top + 8;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 12;
  const thumbNeed = current?.options.length ?? LOST_ITEM_ANSWER_OPTIONS;
  const clocksArmed =
    phase === 'dark' ||
    (phase === 'look' && sceneLoaded) ||
    (phase === 'answer' && sceneLoaded && thumbsLoaded >= thumbNeed);

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
    endedRef.current = true;
    genRef.current += 1;
    const session = useGameStore.getState().gameSession;
    if (session && !session.isComplete) {
      endSession({ applyFinish: false, sessionOutcome: 'lose' });
    }
    setTimeout(() => {
      resetGame();
      router.replace(ROUTES.LOBBY);
    }, 50);
  }, [endSession, resetGame, router]);

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
      setSceneLoaded(false);
      setThumbsLoaded(0);
      setPhase('look');
      setRemainingMs(phaseMsForDifficulty(difficulty));
      void fillRest(generation, 1);
    } catch (err) {
      if (generation !== genRef.current) return;
      setLoadError(err instanceof Error ? err.message : 'Lost Item images failed');
    }
  }, [difficulty, fillRest]);
  dealRef.current = deal;

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
      setSceneLoaded(false);
      setThumbsLoaded(0);
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
    void dealRef.current();
    return () => {
      genRef.current += 1;
    };
  }, [gameSession?.id]);

  useEffect(() => {
    const onHardwareBack = () => {
      if (endedRef.current) return false;
      setPaused(true);
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (event) => {
      if (endedRef.current) return;
      event.preventDefault();
      setPaused(true);
    });
    return unsub;
  }, [navigation]);

  useEffect(() => {
    if (phase !== 'loading' || loadError || !current) return;
    setSceneLoaded(false);
    setThumbsLoaded(0);
    setPhase('look');
    setRemainingMs(lookMs);
  }, [current, loadError, lookMs, phase]);

  useEffect(() => {
    if (phase !== 'feedback' || endedRef.current || paused) return;
    const t = setTimeout(() => {
      afterAnswer();
    }, 1000);
    return () => clearTimeout(t);
  }, [afterAnswer, paused, phase]);

  useEffect(() => {
    if (paused || endedRef.current || !clocksArmed) return;
    if (phase !== 'look' && phase !== 'dark' && phase !== 'answer') return;
    const id = setInterval(() => {
      setRemainingMs((ms) => (ms <= 100 ? 0 : ms - 100));
    }, 100);
    return () => clearInterval(id);
  }, [clocksArmed, index, paused, phase]);

  useEffect(() => {
    if (paused || endedRef.current || remainingMs > 0) return;
    if ((phase === 'look' || phase === 'answer') && !clocksArmed) return;
    if (phase === 'look') {
      setPhase('dark');
      setRemainingMs(LOST_ITEM_DARK_MS);
      return;
    }
    if (phase === 'dark') {
      setSceneLoaded(false);
      setThumbsLoaded(0);
      setPhase('answer');
      setRemainingMs(lookMs);
      return;
    }
    if (phase === 'answer') {
      submit(false, null);
    }
  }, [clocksArmed, lookMs, paused, phase, remainingMs, submit]);

  const restart = useCallback(() => {
    const begin = () => {
      endedRef.current = false;
      setPaused(false);
      setFeedback(null);
      restartSession(difficulty, category);
    };
    if (spendEnergy()) {
      begin();
      return;
    }
    if (isAdFreePassActive()) {
      if (consumeInGameRetryAd()) {
        begin();
        return;
      }
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
        `Watch an ad to restore ${STAMINA_AD_REWARD} stamina and retry this round without paying again.`,
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

  const timerLabel = phase === 'loading' ? '—' : `${(remainingMs / 1000).toFixed(1)}s`;
  const sceneUri = phase === 'answer' || phase === 'feedback' ? current?.missingUrl : current?.sceneUrl;
  const timeCap = phase === 'dark' ? LOST_ITEM_DARK_MS : lookMs;
  const timeRatio = timeCap > 0 ? Math.min(1, Math.max(0, remainingMs / timeCap)) : 0;
  const blackout = phase === 'dark';
  const urgency = clocksArmed && remainingMs <= 1000 && (phase === 'look' || phase === 'answer');
  const prompt =
    phase === 'answer' || phase === 'feedback'
      ? 'WHICH OBJECT IS MISSING?'
      : phase === 'look'
        ? 'STUDY THE SCENE'
        : phase === 'dark'
          ? 'LIGHTS OUT'
          : '';
  const waiting = phase === 'loading' || !current;

  const retryNode = (
    <TouchableOpacity
      style={styles.retryButton}
      onPress={() => {
        hapticsService.impact(0);
        resetRoundProgress();
        void deal();
      }}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={[FindTone.brassHot, FindTone.brass, FindTone.brassDeep]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.retryFill}
      >
        <Text style={styles.retryLabel}>Retry</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <LostItemWorld quality={quality} blackout={blackout} urgency={urgency} flash={feedback}>
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
        <LostItemHud
          question={index + 1}
          maxQuestions={LOST_ITEM_QUESTIONS}
          score={score}
          timerLabel={timerLabel}
          timeRatio={waiting ? 0 : timeRatio}
          rowStyle={{ flexDirection }}
          glow={allowBlurFor(quality)}
          urgent={urgency}
          left={
            <BackButton
              onPress={() => setPaused(true)}
              iconColor={FindTone.brassHot}
              style={styles.navBtn}
            />
          }
          right={
            <TouchableOpacity style={styles.navBtn} onPress={() => setPaused(true)}>
              <LinearGradient
                colors={[FindTone.brassHot, FindTone.brass, FindTone.brassDeep, FindTone.brassHot]}
                locations={[0, 0.28, 0.72, 1]}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={styles.navBezel}
              >
                <LinearGradient colors={['rgba(22,12,8,0.96)', 'rgba(8,4,4,0.98)']} style={styles.navFill}>
                  <Ionicons name="pause" size={20} color={FindTone.ink} />
                </LinearGradient>
              </LinearGradient>
            </TouchableOpacity>
          }
        />

        <SearchStage
          uri={waiting ? undefined : sceneUri}
          sceneKey={`scene-${index}-${phase}`}
          blackout={blackout}
          loading={waiting}
          loadError={loadError}
          onSceneLoad={() => setSceneLoaded(true)}
          retry={loadError ? retryNode : undefined}
        />

        <SearchPrompt text={prompt} glow={allowBlurFor(quality)} />

        {!waiting && (phase === 'answer' || phase === 'feedback') ? (
          <View style={styles.answers}>
            {current.options.map((option, optionIndex) => {
              const selected = picked === optionIndex;
              const showCorrect = phase === 'feedback' && optionIndex === current.correctIndex;
              const showWrong = phase === 'feedback' && selected && optionIndex !== current.correctIndex;
              const thumb = current.optionUrls[optionIndex];
              return (
                <EvidenceChip
                  key={`${option.id}-${optionIndex}`}
                  uri={thumb}
                  thumbKey={`thumb-${index}-${optionIndex}-${(thumb ?? '').slice(-24)}`}
                  disabled={phase !== 'answer'}
                  mark={showCorrect ? 'correct' : showWrong ? 'wrong' : 'idle'}
                  onPress={() => submit(optionIndex === current.correctIndex, optionIndex)}
                  onThumbLoad={() => setThumbsLoaded((n) => Math.min(thumbNeed, n + 1))}
                />
              );
            })}
          </View>
        ) : null}

        {feedback ? (
          <Text style={[styles.feedback, { color: feedback === 'correct' ? FindTone.found : FindTone.lost }]}>
            {feedback === 'correct' ? 'Correct' : 'Wrong'}
          </Text>
        ) : (
          <View style={styles.feedbackSpacer} />
        )}
      </View>

      <PauseMenu
        visible={paused}
        onResume={() => setPaused(false)}
        onRestart={restart}
        onExit={exitToLobby}
      />
    </LostItemWorld>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, gap: 10 },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
  },
  navBezel: {
    flex: 1,
    borderRadius: 14,
    padding: 1.5,
  },
  navFill: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answers: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  retryButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  retryFill: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    alignItems: 'center',
  },
  retryLabel: {
    color: FindTone.ink,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 16,
  },
  feedback: {
    textAlign: 'center',
    minHeight: 28,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  feedbackSpacer: { minHeight: 28 },
});

export default LostItemScreen;
