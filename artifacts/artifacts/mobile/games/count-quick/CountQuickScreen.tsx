import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
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
import { GlassCard } from '@/components/GlassCard';
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
  COUNT_QUICK_GAME_OVER_WRONGS,
  COUNT_QUICK_QUESTIONS,
  COUNT_QUICK_SCORE_CORRECT,
  COUNT_QUICK_SCORE_WRONG,
} from '@/games/count-quick/config';
import {
  buildCountQuickRound,
  secondsForDifficulty,
  type CountQuickQuestion,
} from '@/games/count-quick/engine';
import { CountQuickShape } from '@/games/count-quick/shapes';

type Phase = 'question' | 'feedback';

const CountQuickScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const difficulty = useGameStore((s) => s.selectedDifficulty);
  const category = useGameStore((s) => s.selectedCategory);
  const score = useGameStore((s) => s.score);
  const gameSession = useGameStore((s) => s.gameSession);
  const recordAnswer = useGameStore((s) => s.recordAnswer);
  const advanceQuestion = useGameStore((s) => s.advanceQuestion);
  const restartSession = useGameStore((s) => s.restartSession);
  const endSession = useGameStore((s) => s.endSession);
  const resetGame = useGameStore((s) => s.resetGame);
  const spendEnergy = useUserStore((s) => s.spendEnergy);
  const canInGameRetryAd = useUserStore((s) => s.canInGameRetryAd);
  const consumeInGameRetryAd = useUserStore((s) => s.consumeInGameRetryAd);
  const { showRewarded, isAdFreePassActive } = useAdStore();
  const { playEffect } = useAudio();

  const [questions, setQuestions] = useState<CountQuickQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(secondsForDifficulty(difficulty));
  const [phase, setPhase] = useState<Phase>('question');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  const endedRef = useRef(false);
  const dealingRef = useRef(false);

  const current = questions[index];
  const topPad = Platform.OS === 'web' ? 54 : insets.top + 8;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 12;

  const deal = useCallback(() => {
    dealingRef.current = true;
    endedRef.current = false;
    setQuestions(buildCountQuickRound(difficulty));
    setIndex(0);
    setSecondsLeft(secondsForDifficulty(difficulty));
    setPhase('question');
    setFeedback(null);
    setPicked(null);
    setPaused(false);
    dealingRef.current = false;
  }, [difficulty]);

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

  const afterAnswer = useCallback(() => {
    const wrongs = useGameStore.getState().totalWrong;
    if (wrongs >= COUNT_QUICK_GAME_OVER_WRONGS) {
      finish('lose');
      return;
    }
    const last = index >= COUNT_QUICK_QUESTIONS - 1;
    if (last) {
      const corrects = useGameStore.getState().correctAnswers;
      finish(corrects === COUNT_QUICK_QUESTIONS ? 'perfect' : 'win');
      return;
    }
    advanceQuestion();
    setIndex((i) => i + 1);
    setSecondsLeft(secondsForDifficulty(difficulty));
    setPhase('question');
    setFeedback(null);
    setPicked(null);
  }, [advanceQuestion, difficulty, finish, index]);

  const submit = useCallback((correct: boolean, choice: number | null) => {
    if (endedRef.current || phase !== 'question') return;
    setPicked(choice);
    setFeedback(correct ? 'correct' : 'wrong');
    setPhase('feedback');
    recordAnswer(correct, correct ? COUNT_QUICK_SCORE_CORRECT : COUNT_QUICK_SCORE_WRONG);
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
    if (!gameSession || dealingRef.current) return;
    if (questions.length === 0) deal();
  }, [deal, gameSession, questions.length]);

  useEffect(() => {
    if (phase !== 'feedback' || endedRef.current) return;
    const t = setTimeout(() => {
      afterAnswer();
    }, 1000);
    return () => clearTimeout(t);
  }, [afterAnswer, phase]);

  useEffect(() => {
    if (phase !== 'question' || paused || endedRef.current || !current) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => (s <= 0 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [current, index, paused, phase]);

  useEffect(() => {
    if (phase !== 'question' || paused || endedRef.current || secondsLeft > 0) return;
    submit(false, null);
  }, [paused, phase, secondsLeft, submit]);

  const restart = useCallback(() => {
    const begin = () => {
      endedRef.current = false;
      restartSession(difficulty, category);
      deal();
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
    deal,
    difficulty,
    exitToLobby,
    isAdFreePassActive,
    showRewarded,
    spendEnergy,
    restartSession,
  ]);

  if (!current) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: topPad }]}>
          <Text style={styles.loading}>Count Quick</Text>
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
        <View style={styles.topBar}>
          <BackButton onPress={() => setPaused(true)} />
          <View style={styles.topCenter}>
            <Text style={styles.mode}>COUNT QUICK</Text>
            <Text style={[styles.timer, { color: secondsLeft <= 1 ? GameColors.accentRed : GameColors.textWhite }]}>
              {secondsLeft}s
            </Text>
          </View>
          <TouchableOpacity style={styles.pauseButton} onPress={() => setPaused(true)}>
            <Ionicons name="pause" size={20} color={GameColors.textWhite} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.counter}>{index + 1} / {COUNT_QUICK_QUESTIONS}</Text>
          <View style={styles.segmentTrack}>
            {Array.from({ length: COUNT_QUICK_QUESTIONS }, (_, i) => (
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

        <GlassCard style={styles.targetCard}>
          <Text style={styles.targetLabel}>COUNT THIS COLOR</Text>
          <View style={styles.targetRow}>
            <View style={[styles.targetSwatch, { backgroundColor: current.targetColor }]} />
            <Text style={styles.targetName}>This color</Text>
          </View>
        </GlassCard>

        <View style={styles.board}>
          {current.items.map((item, itemIndex) => (
            <View key={`${item.shape}-${item.color}-${itemIndex}`} style={styles.itemSlot}>
              <CountQuickShape shape={item.shape} color={item.color} size={44} />
            </View>
          ))}
        </View>

        <View style={styles.answers}>
          {current.options.map((option) => {
            const selected = picked === option;
            const showCorrect = phase === 'feedback' && option === current.correctCount;
            const showWrong = phase === 'feedback' && selected && option !== current.correctCount;
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.answer,
                  showCorrect && styles.answerCorrect,
                  showWrong && styles.answerWrong,
                ]}
                disabled={phase !== 'question'}
                onPress={() => submit(option === current.correctCount, option)}
                activeOpacity={0.85}
              >
                <Text style={styles.answerText}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {feedback ? (
          <Text style={[styles.feedback, { color: feedback === 'correct' ? GameColors.accentGreen : GameColors.accentRed }]}>
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
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, gap: 10 },
  loading: { ...Typography.semibold, color: GameColors.textWhite, textAlign: 'center', marginTop: 48 },
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
  targetCard: { padding: 12, gap: 8 },
  targetLabel: { ...Typography.small, color: GameColors.accentGold, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  targetSwatch: { width: 36, height: 36, borderRadius: 10, borderWidth: 2, borderColor: GameColors.textWhite },
  targetName: { ...Typography.semibold, color: GameColors.textWhite },
  board: {
    flex: 1,
    minHeight: 180,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: GameColors.cardBorder,
    backgroundColor: GameColors.backgroundSecondary,
  },
  itemSlot: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  answers: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  answer: {
    width: '47%',
    flexGrow: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: GameColors.border,
  },
  answerCorrect: { backgroundColor: 'rgba(0,230,118,0.18)', borderColor: GameColors.accentGreen },
  answerWrong: { backgroundColor: 'rgba(255,23,68,0.18)', borderColor: GameColors.accentRed },
  answerText: { ...Typography.header, color: GameColors.textWhite, fontSize: 28, lineHeight: 34 },
  feedback: { ...Typography.semibold, textAlign: 'center', minHeight: 28 },
  feedbackSpacer: { minHeight: 28 },
});

export default CountQuickScreen;
