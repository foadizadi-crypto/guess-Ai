import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { hapticsService } from '@/services/HapticsService';
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
import { STAMINA_AD_REWARD, STAMINA_PER_GAME, IN_GAME_RETRY_ADS_PER_DAY } from '@/constants/economy';
import { ROUTES } from '@/navigation/routes';
import { isDifficultyOpen } from '@/shared/difficulty';
import {
  COUNT_QUICK_QUESTIONS,
  COUNT_QUICK_SCORE_CORRECT,
  COUNT_QUICK_SCORE_WRONG,
} from '@/games/count-quick/config';
import {
  buildCountQuickRound,
  secondsForDifficulty,
  type CountQuickQuestion,
} from '@/games/count-quick/engine';
import {
  COUNT_QUICK_COUNTDOWN,
  COUNT_QUICK_HOW_TO_BODY,
  COUNT_QUICK_HOW_TO_TITLE,
  COUNT_QUICK_READY_LABEL,
  countQuickQuestionText,
  type CountQuickPlayPhase,
} from '@/games/count-quick/flow';
import { CountQuickShape } from '@/games/count-quick/shapes';

const CountQuickScreen = () => {
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
  const [phase, setPhase] = useState<CountQuickPlayPhase>('howto');
  const [countdown, setCountdown] = useState(3);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [wrongOpen, setWrongOpen] = useState(false);
  const [continueLoading, setContinueLoading] = useState(false);

  const endedRef = useRef(false);
  const dealingRef = useRef(false);

  const current = questions[index];
  const topPad = Platform.OS === 'web' ? 54 : insets.top + 8;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 12;
  const timersFrozen = paused || wrongOpen || endedRef.current;

  const beginCountdown = useCallback(() => {
    setCountdown(COUNT_QUICK_COUNTDOWN[0]);
    setSecondsLeft(secondsForDifficulty(difficulty));
    setPhase('countdown');
    setFeedback(null);
    setPicked(null);
  }, [difficulty]);

  const deal = useCallback((start: 'howto' | 'countdown' = 'howto') => {
    dealingRef.current = true;
    endedRef.current = false;
    setQuestions(buildCountQuickRound(difficulty));
    setIndex(0);
    setSecondsLeft(secondsForDifficulty(difficulty));
    setCountdown(COUNT_QUICK_COUNTDOWN[0]);
    setPhase(start);
    setFeedback(null);
    setPicked(null);
    setPaused(false);
    setWrongOpen(false);
    setContinueLoading(false);
    dealingRef.current = false;
  }, [difficulty]);

  const finish = useCallback((outcome: 'perfect' | 'win' | 'lose') => {
    if (endedRef.current) return;
    endedRef.current = true;
    setPaused(false);
    setWrongOpen(false);
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
    setWrongOpen(false);
    endedRef.current = true;
    const session = useGameStore.getState().gameSession;
    if (session && !session.isComplete) {
      endSession({ applyFinish: false, sessionOutcome: 'lose' });
    }
    setTimeout(() => {
      resetGame();
      router.replace(ROUTES.LOBBY);
    }, 50);
  }, [endSession, resetGame, router]);

  const exitToCategory = useCallback(() => {
    setPaused(false);
    setWrongOpen(false);
    endedRef.current = true;
    const session = useGameStore.getState().gameSession;
    if (session && !session.isComplete) {
      endSession({ applyFinish: false, sessionOutcome: 'lose' });
    }
    setTimeout(() => {
      resetGame();
      router.replace(ROUTES.CATEGORY_SELECT);
    }, 50);
  }, [endSession, resetGame, router]);

  const afterCorrect = useCallback(() => {
    const last = index >= COUNT_QUICK_QUESTIONS - 1;
    if (last) {
      const corrects = useGameStore.getState().correctAnswers;
      finish(corrects === COUNT_QUICK_QUESTIONS ? 'perfect' : 'win');
      return;
    }
    advanceQuestion();
    setIndex((i) => i + 1);
    beginCountdown();
  }, [advanceQuestion, beginCountdown, finish, index]);

  const submit = useCallback((correct: boolean, choice: number | null) => {
    if (endedRef.current || phase !== 'ask') return;
    setPicked(choice);
    setFeedback(correct ? 'correct' : 'wrong');
    setPhase('feedback');
    hapticsService.notification(correct ? 1 : 0);
    playEffect(correct ? 'correct' : 'wrong');
    if (correct) {
      recordAnswer(true, COUNT_QUICK_SCORE_CORRECT);
      return;
    }
    setWrongOpen(true);
  }, [phase, playEffect, recordAnswer]);

  const retryThisQuestion = useCallback(() => {
    setWrongOpen(false);
    setContinueLoading(false);
    beginCountdown();
  }, [beginCountdown]);

  const handleContinueAd = useCallback(() => {
    if (continueLoading) return;
    const begin = () => {
      if (!consumeInGameRetryAd()) return;
      retryThisQuestion();
    };
    if (isAdFreePassActive()) {
      begin();
      return;
    }
    if (Platform.OS === 'web' && !__DEV__) {
      Alert.alert(
        'Ads unavailable',
        'Rewarded ads are not available in the browser. Exit to category or play on the app.',
      );
      return;
    }
    if (!canInGameRetryAd()) {
      Alert.alert(
        'No continues left',
        `You can watch up to ${IN_GAME_RETRY_ADS_PER_DAY} ads a day to continue. Exit to category, or come back tomorrow.`,
      );
      return;
    }
    setContinueLoading(true);
    void (async () => {
      const granted = await showRewarded();
      setContinueLoading(false);
      if (!granted) return;
      begin();
    })();
  }, [
    canInGameRetryAd,
    consumeInGameRetryAd,
    continueLoading,
    isAdFreePassActive,
    retryThisQuestion,
    showRewarded,
  ]);

  const handleExitWrong = useCallback(() => {
    recordAnswer(false, COUNT_QUICK_SCORE_WRONG);
    exitToCategory();
  }, [exitToCategory, recordAnswer]);

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
    if (questions.length === 0) deal('howto');
  }, [deal, gameSession, questions.length]);

  useEffect(() => {
    const onHardwareBack = () => {
      if (endedRef.current) return false;
      if (wrongOpen) return true;
      setPaused(true);
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [wrongOpen]);

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (event) => {
      if (endedRef.current) return;
      event.preventDefault();
      if (!wrongOpen) setPaused(true);
    });
    return unsub;
  }, [navigation, wrongOpen]);

  useEffect(() => {
    if (phase !== 'feedback' || feedback !== 'correct' || endedRef.current || wrongOpen) return;
    const t = setTimeout(() => afterCorrect(), 900);
    return () => clearTimeout(t);
  }, [afterCorrect, feedback, phase, wrongOpen]);

  useEffect(() => {
    if (phase !== 'countdown' || timersFrozen) return;
    const id = setTimeout(() => {
      if (countdown <= 1) {
        setPhase('memorize');
        setSecondsLeft(secondsForDifficulty(difficulty));
        return;
      }
      setCountdown((n) => n - 1);
    }, 1000);
    return () => clearTimeout(id);
  }, [countdown, difficulty, phase, timersFrozen]);

  useEffect(() => {
    if (phase !== 'memorize' || timersFrozen || !current) return;
    const id = setTimeout(() => {
      if (secondsLeft <= 1) {
        setPhase('ask');
        setSecondsLeft(0);
        return;
      }
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearTimeout(id);
  }, [current, index, phase, secondsLeft, timersFrozen]);

  const restart = useCallback(() => {
    const begin = () => {
      endedRef.current = false;
      restartSession(difficulty, category);
      deal('howto');
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

  const showCards = phase === 'memorize';
  const showAsk = phase === 'ask' || phase === 'feedback';
  const showTimer = phase === 'memorize';

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
        <View style={styles.topBar}>
          <BackButton onPress={() => setPaused(true)} />
          <View style={styles.topCenter}>
            <Text style={styles.mode}>COUNT QUICK</Text>
            {showTimer ? (
              <Text style={[styles.timer, { color: secondsLeft <= 1 ? GameColors.accentRed : GameColors.textWhite }]}>
                {secondsLeft}s
              </Text>
            ) : (
              <Text style={styles.timerHint}>
                {phase === 'ask' || phase === 'feedback' ? 'Your answer' : ' '}
              </Text>
            )}
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

        {showCards ? (
          <View style={styles.board}>
            {current.items.map((item, itemIndex) => (
              <View key={`${item.shape}-${item.color}-${itemIndex}`} style={styles.itemSlot}>
                <CountQuickShape shape={item.shape} color={item.color} size={44} />
              </View>
            ))}
          </View>
        ) : showAsk ? (
          <View style={styles.askBlock}>
            <GlassCard style={styles.targetCard}>
              <Text style={styles.targetLabel}>QUESTION</Text>
              <View style={styles.targetRow}>
                <View style={[styles.targetSwatch, { backgroundColor: current.targetColor }]} />
                <Text style={styles.targetName}>{countQuickQuestionText(current.targetColorName)}</Text>
              </View>
            </GlassCard>

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
                    disabled={phase !== 'ask'}
                    onPress={() => submit(option === current.correctCount, option)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.answerText}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.boardPlaceholder} />
        )}

        {feedback === 'correct' ? (
          <Text style={[styles.feedback, { color: GameColors.accentGreen }]}>Correct</Text>
        ) : (
          <View style={styles.feedbackSpacer} />
        )}
      </View>

      {phase === 'howto' && (
        <View style={styles.howtoOverlay}>
          <GlassCard style={styles.howtoCard}>
            <Text style={styles.howtoTitle}>{COUNT_QUICK_HOW_TO_TITLE}</Text>
            <Text style={styles.howtoBody}>{COUNT_QUICK_HOW_TO_BODY}</Text>
            <GradientButton
              title={COUNT_QUICK_READY_LABEL}
              onPress={() => {
                hapticsService.impact(0);
                playEffect('button_click');
                beginCountdown();
              }}
              testID="count-quick-im-ready"
            />
          </GlassCard>
        </View>
      )}

      {phase === 'countdown' && (
        <View style={styles.countdownOverlay} pointerEvents="none">
          <Text style={styles.countdownNumber}>{countdown}</Text>
          <Text style={styles.countdownSub}>Get ready</Text>
        </View>
      )}

      <PauseMenu
        visible={paused}
        onResume={() => setPaused(false)}
        onRestart={restart}
        onExit={exitToLobby}
      />

      <Modal visible={wrongOpen} transparent animationType="fade" onRequestClose={handleExitWrong}>
        <View style={styles.wrongBackdrop}>
          <View style={styles.wrongCard}>
            <Text style={styles.wrongTitle}>Wrong</Text>
            <Text style={styles.wrongCopy}>
              Watch an ad to restore {STAMINA_AD_REWARD} stamina and retry this round, or exit to category.
            </Text>
            <GradientButton
              title={
                continueLoading
                  ? 'Loading ad…'
                  : isAdFreePassActive()
                    ? 'Continue (Ad-Free)'
                    : 'Continue AdMob'
              }
              onPress={handleContinueAd}
              disabled={continueLoading}
              style={styles.wrongPrimary}
            />
            <TouchableOpacity style={styles.wrongSkip} onPress={handleExitWrong} disabled={continueLoading}>
              <Text style={styles.wrongSkipText}>Exit to category</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  timerHint: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: GameColors.textSecondary, minHeight: 30, lineHeight: 30 },
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
  targetName: { ...Typography.semibold, color: GameColors.textWhite, flex: 1 },
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
  boardPlaceholder: {
    flex: 1,
    minHeight: 180,
  },
  askBlock: {
    flex: 1,
    gap: 12,
    justifyContent: 'center',
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
  howtoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: 'rgba(13,2,33,0.78)',
    zIndex: 80,
  },
  howtoCard: { width: '100%', padding: 22, gap: 14 },
  howtoTitle: { ...Typography.header, color: GameColors.textWhite, fontSize: 28, textAlign: 'center' },
  howtoBody: { ...Typography.semibold, color: GameColors.textSecondary, textAlign: 'center', lineHeight: 22 },
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
    lineHeight: 110,
  },
  countdownSub: {
    ...Typography.small,
    color: GameColors.textSecondary,
    marginTop: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  wrongBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  wrongCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    backgroundColor: GameColors.card,
    borderWidth: 1,
    borderColor: GameColors.cardBorder,
    gap: 12,
  },
  wrongTitle: { ...Typography.header, color: GameColors.accentRed, fontSize: 28 },
  wrongCopy: { ...Typography.small, color: GameColors.textSecondary, textAlign: 'center' },
  wrongPrimary: { width: '100%' },
  wrongSkip: { paddingVertical: 10 },
  wrongSkipText: { color: GameColors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});

export default CountQuickScreen;
