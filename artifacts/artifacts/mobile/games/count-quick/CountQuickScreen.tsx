import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Modal,
  Platform,
  ScrollView,
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
import { layoutStyles, usePopupChromeSize } from '@/theme/webLayout';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { useAdStore } from '@/store/adStore';
import { useAudio } from '@/hooks/useAudio';
import { STAMINA_AD_REWARD, STAMINA_PER_GAME, IN_GAME_RETRY_ADS_PER_DAY } from '@/constants/economy';
import { ROUTES } from '@/navigation/routes';
import { isDifficultyOpen } from '@/shared/difficulty';
import { allowBlurFor, useVisualQuality } from '@/games/visualFoundation';
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
import { CountAskStage, CountBoard } from '@/games/count-quick/CountBoard';
import { CountPlate } from '@/games/count-quick/CountPlate';
import { CountQuickHud } from '@/games/count-quick/CountQuickHud';
import { CountQuickWorld } from '@/games/count-quick/CountQuickWorld';
import { CountTone, chipTone } from '@/games/count-quick/countTokens';
import { SnapButton } from '@/games/count-quick/SnapButton';
import { TallyKey } from '@/games/count-quick/TallyKey';

const CountQuickScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const popupH = usePopupChromeSize();
  const quality = useVisualQuality();
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

  const showCards = phase === 'memorize';
  const showAsk = phase === 'ask' || phase === 'feedback';
  const showTimer = phase === 'memorize';
  const lookCap = secondsForDifficulty(difficulty);
  const timeRatio = lookCap > 0 ? Math.min(1, Math.max(0, secondsLeft / lookCap)) : 0;
  const urgency = showTimer && secondsLeft <= 1;
  const worldFlash = phase === 'feedback' ? feedback : null;
  const glow = allowBlurFor(quality);

  if (!current) {
    return (
      <CountQuickWorld quality={quality}>
        <View style={[styles.container, { paddingTop: topPad }]}>
          <Text style={styles.loading}>Count Quick</Text>
        </View>
      </CountQuickWorld>
    );
  }

  const swatch = chipTone(current.targetColor);

  return (
    <CountQuickWorld quality={quality} urgency={urgency} flash={worldFlash}>
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
        <View style={styles.topBar}>
          <BackButton onPress={() => setPaused(true)} iconColor={CountTone.ink} />
          <Text style={styles.mode}>COUNT QUICK</Text>
          <TouchableOpacity style={styles.pauseButton} onPress={() => setPaused(true)}>
            <LinearGradient
              colors={[CountTone.tallyHot, CountTone.tallyDeep]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.pauseBezel}
            >
              <View style={styles.pauseWell}>
                <Ionicons name="pause" size={18} color={CountTone.ink} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <CountQuickHud
          round={index + 1}
          maxRounds={COUNT_QUICK_QUESTIONS}
          score={score}
          secondsLeft={secondsLeft}
          timeRatio={timeRatio}
          showTimer={showTimer}
          glow={glow}
        />

        {showCards ? (
          <CountBoard items={current.items} />
        ) : showAsk ? (
          <CountAskStage>
            <CountPlate glow={glow} accent={CountTone.flash} style={styles.targetPlate}>
              <Text style={styles.targetLabel}>COUNT THIS COLOR</Text>
              <View style={styles.targetRow}>
                <View style={styles.swatchSeat}>
                  <LinearGradient
                    colors={[swatch.hot, swatch.fill, swatch.deep]}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 0.85, y: 1 }}
                    style={styles.swatch}
                  />
                </View>
                <Text style={styles.targetName}>{countQuickQuestionText(current.targetColorName)}</Text>
              </View>
            </CountPlate>

            <View style={styles.answers}>
              {current.options.map((option) => {
                const selected = picked === option;
                const keyState =
                  phase === 'feedback' && selected && option === current.correctCount
                    ? 'correct'
                    : phase === 'feedback' && selected && option !== current.correctCount
                      ? 'wrong'
                      : 'idle';
                return (
                  <TallyKey
                    key={option}
                    label={option}
                    disabled={phase !== 'ask'}
                    state={keyState}
                    onPress={() => submit(option === current.correctCount, option)}
                  />
                );
              })}
            </View>
          </CountAskStage>
        ) : (
          <CountBoard items={[]} />
        )}

        {feedback === 'correct' ? (
          <View style={styles.stampWrap}>
            <LinearGradient
              colors={[CountTone.greenHot, CountTone.green, CountTone.greenDeep]}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.stamp}
            >
              <Text style={styles.stampText}>Correct</Text>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.feedbackSpacer} />
        )}
      </View>

      {phase === 'howto' && (
        <View style={styles.howtoOverlay}>
          <CountPlate glow fill style={[layoutStyles.popupFrame, styles.howtoCard, { height: popupH }]} accent={CountTone.flash}>
            <Text style={[layoutStyles.popupTitle, styles.howtoTitle]}>{COUNT_QUICK_HOW_TO_TITLE}</Text>
            <ScrollView style={layoutStyles.popupScroller} contentContainerStyle={layoutStyles.popupScrollContent}>
              <Text style={[layoutStyles.popupBody, styles.howtoBody]}>{COUNT_QUICK_HOW_TO_BODY}</Text>
            </ScrollView>
            <SnapButton
              label={COUNT_QUICK_READY_LABEL}
              testID="count-quick-im-ready"
              onPress={() => {
                hapticsService.impact(0);
                playEffect('button_click');
                beginCountdown();
              }}
            />
          </CountPlate>
        </View>
      )}

      {phase === 'countdown' && (
        <View style={styles.countdownOverlay} pointerEvents="none">
          <LinearGradient
            colors={[CountTone.tallyHot, CountTone.tally, CountTone.flash, CountTone.tallyDeep]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={styles.countRing}
          >
            <LinearGradient colors={['rgba(7,20,30,0.94)', 'rgba(6,16,24,0.98)']} style={styles.countWell}>
              <Text style={styles.countdownNumber}>{countdown}</Text>
            </LinearGradient>
          </LinearGradient>
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
        <View style={layoutStyles.popupBackdrop}>
          <CountPlate glow fill accent={CountTone.flash} style={[layoutStyles.popupFrame, styles.wrongCard, { height: popupH }]}>
            <Text style={[layoutStyles.popupTitle, styles.wrongTitle]}>Wrong</Text>
            <ScrollView style={layoutStyles.popupScroller} contentContainerStyle={layoutStyles.popupScrollContent}>
              <Text style={[layoutStyles.popupBody, styles.wrongCopy]}>
                Watch an ad to restore {STAMINA_AD_REWARD} stamina and retry this round, or exit to category.
              </Text>
              <SnapButton
                label={
                  continueLoading
                    ? 'Loading ad…'
                    : isAdFreePassActive()
                      ? 'Continue (Ad-Free)'
                      : 'Continue AdMob'
                }
                onPress={handleContinueAd}
                disabled={continueLoading}
              />
              <TouchableOpacity style={styles.wrongSkip} onPress={handleExitWrong} disabled={continueLoading}>
                <Text style={styles.wrongSkipText}>Exit to category</Text>
              </TouchableOpacity>
            </ScrollView>
          </CountPlate>
        </View>
      </Modal>
    </CountQuickWorld>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, gap: 10 },
  loading: {
    color: CountTone.ink,
    textAlign: 'center',
    marginTop: 48,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.4,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mode: {
    color: CountTone.mute,
    fontSize: 11,
    letterSpacing: 2.2,
    fontFamily: 'Inter_700Bold',
  },
  pauseButton: {
    width: 44,
    height: 44,
  },
  pauseBezel: {
    flex: 1,
    borderRadius: 14,
    padding: 1.5,
  },
  pauseWell: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6,16,24,0.92)',
  },
  targetPlate: { width: '100%' },
  targetLabel: {
    color: CountTone.flashHot,
    fontSize: 11,
    letterSpacing: 1.6,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  swatchSeat: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 2,
    backgroundColor: 'rgba(244,251,255,0.2)',
  },
  swatch: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(6,16,24,0.45)',
  },
  targetName: {
    color: CountTone.ink,
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Inter_700Bold',
  },
  answers: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stampWrap: { minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  stamp: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(110,231,183,0.55)',
  },
  stampText: {
    color: CountTone.void,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2.4,
    fontSize: 13,
  },
  feedbackSpacer: { minHeight: 36 },
  howtoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(6,16,24,0.78)',
    zIndex: 80,
  },
  howtoCard: { alignSelf: 'center' },
  howtoTitle: {
    color: CountTone.ink,
    marginBottom: 4,
  },
  howtoBody: {
    color: CountTone.mute,
    fontFamily: 'Inter_600SemiBold',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6,16,24,0.82)',
    zIndex: 100,
  },
  countRing: {
    width: 148,
    height: 148,
    borderRadius: 74,
    padding: 3,
    overflow: 'hidden',
    shadowColor: CountTone.tally,
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  countWell: {
    flex: 1,
    borderRadius: 71,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    fontSize: 88,
    fontFamily: 'Inter_700Bold',
    color: CountTone.ink,
    lineHeight: 100,
    textShadowColor: 'rgba(45,212,191,0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  countdownSub: {
    color: CountTone.mute,
    marginTop: 14,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  wrongCard: { alignSelf: 'center' },
  wrongTitle: {
    color: CountTone.flashHot,
  },
  wrongCopy: {
    color: CountTone.mute,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  wrongSkip: { paddingVertical: 12, alignItems: 'center' },
  wrongSkipText: { color: CountTone.mute, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});

export default CountQuickScreen;
