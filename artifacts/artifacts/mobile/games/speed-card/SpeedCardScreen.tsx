import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  LayoutChangeEvent,
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
import { GradientButton } from '@/components/GradientButton';
import { PauseMenu } from '@/components/PauseMenu';
import { POPUP_PADDING, layoutStyles, usePopupChromeSize } from '@/theme/webLayout';
import { allowBlurFor, allowBurstFor, useVisualQuality } from '@/games/visualFoundation';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { useAdStore } from '@/store/adStore';
import { useAudio } from '@/hooks/useAudio';
import { DIFFICULTY_CONFIG, calculateAnswerScore, getAvatarAbility, getTimerColor } from '@/gameEngine';
import { STAMINA_AD_REWARD, STAMINA_PER_GAME, IN_GAME_RETRY_ADS_PER_DAY } from '@/constants/economy';
import { ROUTES } from '@/navigation/routes';
import { isDifficultyOpen } from '@/shared/difficulty';
import { speedCardContentLevelCap } from '@/games/speed-card/economy';
import {
  SPEED_CARD_COUNT,
  SPEED_CARD_FLASH_MS,
  fetchSpeedCardRound,
  layoutCardPositions,
  revealDurationMs,
  type SpeedCardColor,
} from '@/games/speed-card/engine';
import {
  SPEED_CARD_CONTINUE_LABEL,
  SPEED_CARD_CORRECT_LABEL,
  SPEED_CARD_COUNTDOWN,
  SPEED_CARD_EXIT_LABEL,
  SPEED_CARD_HOW_TO_BODY,
  SPEED_CARD_HOW_TO_TITLE,
  SPEED_CARD_READY_LABEL,
  SPEED_CARD_START_LABEL,
  SPEED_CARD_WRONG_TITLE,
  speedCardQuestionText,
  type SpeedCardPlayPhase,
} from '@/games/speed-card/flow';
import { SpeedCardWorld } from '@/games/speed-card/SpeedCardWorld';
import { SpeedCardHud } from '@/games/speed-card/SpeedCardHud';
import { MemoryCard } from '@/games/speed-card/MemoryCard';
import { SpeedPrompt } from '@/games/speed-card/SpeedPrompt';
import { SpeedTone } from '@/games/speed-card/speedTokens';

interface PlacedCard extends SpeedCardColor {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CARD_WIDTH = 72;
const CARD_HEIGHT = 96;

const SpeedCardScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const popupH = usePopupChromeSize();
  const quality = useVisualQuality();
  const difficulty = useGameStore((s) => s.selectedDifficulty);
  const category = useGameStore((s) => s.selectedCategory);
  const timer = useGameStore((s) => s.timer);
  const isTimerRunning = useGameStore((s) => s.isTimerRunning);
  const setTimer = useGameStore((s) => s.setTimer);
  const score = useGameStore((s) => s.score);
  const gameSession = useGameStore((s) => s.gameSession);
  const recordAnswer = useGameStore((s) => s.recordAnswer);
  const advanceQuestion = useGameStore((s) => s.advanceQuestion);
  const restartSession = useGameStore((s) => s.restartSession);
  const endSession = useGameStore((s) => s.endSession);
  const resetGame = useGameStore((s) => s.resetGame);
  const selectedAvatarId = useUserStore((s) => s.selectedAvatarId);
  const spendEnergy = useUserStore((s) => s.spendEnergy);
  const canInGameRetryAd = useUserStore((s) => s.canInGameRetryAd);
  const consumeInGameRetryAd = useUserStore((s) => s.consumeInGameRetryAd);
  const { showRewarded, isAdFreePassActive } = useAdStore();
  const { playEffect } = useAudio();

  const roundCap = speedCardContentLevelCap();
  const [phase, setPhase] = useState<SpeedCardPlayPhase>('howto');
  const [countdown, setCountdown] = useState<number>(SPEED_CARD_COUNTDOWN[0]);
  const [paused, setPaused] = useState(false);
  const [cards, setCards] = useState<PlacedCard[]>([]);
  const [ask, setAsk] = useState<SpeedCardColor | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [board, setBoard] = useState({ width: 0, height: 0 });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [wrongOpen, setWrongOpen] = useState(false);
  const [continueLoading, setContinueLoading] = useState(false);
  const [faceUp, setFaceUp] = useState(true);
  const [timeCap, setTimeCap] = useState(() => Math.max(timer, 1));

  const endedRef = useRef(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealEndsAt = useRef<number | null>(null);
  const revealRemaining = useRef<number | null>(null);
  const fetchLock = useRef(false);
  const genRef = useRef(0);

  const config = DIFFICULTY_CONFIG[difficulty];
  const topPad = Platform.OS === 'web' ? 54 : insets.top + 8;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 12;
  const timersFrozen = paused || wrongOpen || endedRef.current;

  const clearTimers = () => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    revealTimer.current = null;
  };

  const finishRound = useCallback((reason: 'complete' | 'timeout' = 'complete') => {
    if (endedRef.current) return;
    endedRef.current = true;
    clearTimers();
    setPaused(false);
    setWrongOpen(false);
    if (reason === 'timeout') {
      endSession({ applyFinish: false });
    } else {
      const corrects = useGameStore.getState().correctAnswers;
      if (corrects === roundCap) {
        endSession({ applyFinish: true, sessionOutcome: 'perfect' });
      } else if (corrects > 0) {
        endSession({ applyFinish: true, sessionOutcome: 'win' });
      } else {
        endSession({ applyFinish: false, sessionOutcome: 'lose' });
      }
    }
    setTimeout(() => {
      router.replace(ROUTES.RESULT);
    }, 50);
  }, [endSession, roundCap, router]);

  const exitToLobby = useCallback(() => {
    clearTimers();
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
    clearTimers();
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

  const beginCountdown = useCallback(() => {
    clearTimers();
    revealRemaining.current = null;
    revealEndsAt.current = null;
    setCountdown(SPEED_CARD_COUNTDOWN[0]);
    setPhase('countdown');
    setFeedback(null);
    setFaceUp(true);
  }, []);

  const fetchRound = useCallback(async () => {
    if (board.width < 80 || board.height < 80) return;
    if (fetchLock.current) return;
    const generation = genRef.current + 1;
    genRef.current = generation;
    fetchLock.current = true;
    setLoadError(null);
    try {
      const round = await fetchSpeedCardRound(difficulty);
      if (generation !== genRef.current) return;
      const positions = layoutCardPositions(
        SPEED_CARD_COUNT,
        board.width,
        board.height,
        CARD_WIDTH,
        CARD_HEIGHT,
      );
      setCards(round.colors.map((color, index) => ({
        ...color,
        x: positions[index]?.x ?? 12,
        y: positions[index]?.y ?? 12,
        width: positions[index]?.width ?? CARD_WIDTH,
        height: positions[index]?.height ?? CARD_HEIGHT,
      })));
      setAsk(round.questions[0] ?? round.colors[0] ?? null);
      setFaceUp(true);
      setFeedback(null);
      setPhase((current) => (
        current === 'start' || current === 'loading' || current === 'error' ? 'reveal' : current
      ));
    } catch (err) {
      if (generation !== genRef.current) return;
      const msg = err instanceof Error ? err.message : 'Speed Card API failed';
      setLoadError(msg);
      setCards([]);
      setAsk(null);
      setPhase((current) => (
        current === 'howto' || current === 'countdown' ? current : 'error'
      ));
    } finally {
      if (generation === genRef.current) fetchLock.current = false;
    }
  }, [board.height, board.width, difficulty]);

  const afterCorrect = useCallback(() => {
    if (endedRef.current) return;
    if (roundIndex >= roundCap - 1) {
      finishRound();
      return;
    }
    advanceQuestion();
    setRoundIndex((i) => i + 1);
    setCards([]);
    setAsk(null);
    beginCountdown();
  }, [advanceQuestion, beginCountdown, finishRound, roundCap, roundIndex]);

  const retryThisRound = useCallback(() => {
    setWrongOpen(false);
    setContinueLoading(false);
    setFeedback(null);
    beginCountdown();
  }, [beginCountdown]);

  const handleContinueAd = useCallback(() => {
    if (continueLoading) return;
    const begin = () => {
      if (!consumeInGameRetryAd()) return;
      retryThisRound();
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
    retryThisRound,
    showRewarded,
  ]);

  const handleExitWrong = useCallback(() => {
    recordAnswer(false, 0);
    exitToCategory();
  }, [exitToCategory, recordAnswer]);

  const handleCardPress = (card: PlacedCard) => {
    if (phase !== 'question' || !ask || feedback || endedRef.current || wrongOpen) return;
    const correct = card.id === ask.id;
    hapticsService.notification(correct ? 1 : 0);
    playEffect(correct ? 'correct' : 'wrong');
    setFeedback(correct ? 'correct' : 'wrong');
    setPhase('feedback');
    if (correct) {
      const points = calculateAnswerScore(
        difficulty,
        timer,
        getAvatarAbility(selectedAvatarId),
        useGameStore.getState().streak,
      );
      recordAnswer(true, points);
      return;
    }
    setWrongOpen(true);
  };

  useEffect(() => {
    if (timer > timeCap) setTimeCap(timer);
  }, [timer, timeCap]);

  useEffect(() => {
    if (isDifficultyOpen(difficulty)) return;
    router.replace(ROUTES.LEVEL_SELECT);
  }, [difficulty, router]);

  useEffect(() => {
    if (gameSession) return;
    const t = setTimeout(() => {
      if (!useGameStore.getState().gameSession) router.replace(ROUTES.LOBBY);
    }, 50);
    return () => clearTimeout(t);
  }, [gameSession, router]);

  useEffect(() => {
    if (phase !== 'reveal') {
      if (phase !== 'question') {
        revealRemaining.current = null;
        revealEndsAt.current = null;
      }
      return;
    }
    if (timersFrozen) {
      if (revealTimer.current) {
        clearTimeout(revealTimer.current);
        revealTimer.current = null;
      }
      if (revealEndsAt.current != null) {
        revealRemaining.current = Math.max(0, revealEndsAt.current - Date.now());
        revealEndsAt.current = null;
      }
      return;
    }
    const wait = revealRemaining.current ?? revealDurationMs(difficulty);
    revealRemaining.current = null;
    revealEndsAt.current = Date.now() + wait;
    revealTimer.current = setTimeout(() => {
      setFaceUp(false);
      setPhase('question');
      revealEndsAt.current = null;
    }, wait);
    return () => {
      if (revealTimer.current) {
        clearTimeout(revealTimer.current);
        revealTimer.current = null;
      }
    };
  }, [difficulty, phase, timersFrozen]);

  useEffect(() => {
    const playing = phase === 'reveal' || phase === 'question';
    if (!isTimerRunning || timersFrozen || !playing) return;
    const id = setInterval(() => {
      const next = Math.max(0, useGameStore.getState().timer - 1);
      setTimer(next);
      if (next === 0) finishRound('timeout');
    }, 1000);
    return () => clearInterval(id);
  }, [finishRound, isTimerRunning, phase, setTimer, timersFrozen]);

  useEffect(() => {
    if (phase !== 'countdown' && phase !== 'start' && phase !== 'loading') return;
    if (cards.length > 0 || board.width < 80 || board.height < 80) return;
    void fetchRound();
  }, [board.height, board.width, cards.length, fetchRound, phase]);

  useEffect(() => {
    return () => clearTimers();
  }, []);

  useEffect(() => {
    if (phase !== 'countdown' || timersFrozen) return;
    const id = setTimeout(() => {
      if (countdown <= 1) {
        setPhase('start');
        return;
      }
      setCountdown((n) => n - 1);
    }, 1000);
    return () => clearTimeout(id);
  }, [countdown, phase, timersFrozen]);

  useEffect(() => {
    if (phase !== 'start' || timersFrozen) return;
    const id = setTimeout(() => {
      if (cards.length > 0) {
        setFaceUp(true);
        setPhase('reveal');
        return;
      }
      setPhase('loading');
    }, SPEED_CARD_FLASH_MS);
    return () => clearTimeout(id);
  }, [cards.length, phase, timersFrozen]);

  useEffect(() => {
    if (phase !== 'feedback' || feedback !== 'correct' || endedRef.current || wrongOpen) return;
    const t = setTimeout(() => afterCorrect(), SPEED_CARD_FLASH_MS);
    return () => clearTimeout(t);
  }, [afterCorrect, feedback, phase, wrongOpen]);

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

  const onBoardLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBoard({ width, height });
  };

  const restart = useCallback(() => {
    const begin = () => {
      genRef.current += 1;
      fetchLock.current = false;
      clearTimers();
      endedRef.current = false;
      revealRemaining.current = null;
      revealEndsAt.current = null;
      setPaused(false);
      setWrongOpen(false);
      setContinueLoading(false);
      setCards([]);
      setAsk(null);
      setRoundIndex(0);
      setFaceUp(true);
      setFeedback(null);
      setCountdown(SPEED_CARD_COUNTDOWN[0]);
      setPhase('howto');
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

  const showAsk = phase === 'question' || phase === 'feedback';
  const playing = phase === 'reveal' || phase === 'question';
  const urgency = playing && !timersFrozen && timer < 30;
  const timeRatio = timeCap > 0 ? Math.min(1, Math.max(0, timer / timeCap)) : 0;
  const timerLabel = `${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, '0')}`;

  return (
    <SpeedCardWorld quality={quality} urgency={urgency} flash={feedback}>
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
        <View style={styles.topBar}>
          <BackButton onPress={() => setPaused(true)} />
          <TouchableOpacity style={styles.pauseButton} onPress={() => setPaused(true)}>
            <LinearGradient
              colors={[SpeedTone.snapHot, SpeedTone.ice, SpeedTone.crimsonDeep, SpeedTone.snapHot]}
              locations={[0, 0.28, 0.72, 1]}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.pauseBezel}
            >
              <LinearGradient colors={['rgba(22,10,20,0.96)', 'rgba(8,4,14,0.98)']} style={styles.pauseWell}>
                <Ionicons name="pause" size={20} color={SpeedTone.ink} />
              </LinearGradient>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <SpeedCardHud
          modeLabel={`${config?.label ? config.label.toUpperCase() : 'MODE'} • SPEED CARD`}
          round={roundIndex + 1}
          maxRounds={roundCap}
          score={score}
          timerLabel={timerLabel}
          timerColor={getTimerColor(timer)}
          timeRatio={timeRatio}
          glow={allowBlurFor(quality)}
        />

        <View style={styles.tableWrap}>
          <View pointerEvents="none" style={styles.tableHalo} />
          <LinearGradient
            colors={[SpeedTone.snapHot, SpeedTone.ice, SpeedTone.crimsonDeep, SpeedTone.ice, SpeedTone.snapHot]}
            locations={[0, 0.16, 0.5, 0.84, 1]}
            start={{ x: 0.08, y: 0 }}
            end={{ x: 0.92, y: 1 }}
            style={styles.tableBezel}
          >
            <LinearGradient
              colors={['#2A121C', SpeedTone.feltHot, SpeedTone.felt, '#14080E']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.imageWrap}
              onLayout={onBoardLayout}
              pointerEvents="box-none"
              collapsable={false}
            >
              <View pointerEvents="none" style={styles.tableRail} />
              {phase === 'loading' ? (
                <View style={styles.boardStatus} pointerEvents="auto">
                  <Text style={styles.boardStatusText}>Loading colors…</Text>
                </View>
              ) : null}
              {phase === 'error' ? (
                <View style={styles.boardStatus} pointerEvents="auto">
                  <Text style={styles.boardStatusText}>{loadError ?? 'Online round failed'}</Text>
                  <GradientButton title="Try Again" onPress={() => { void fetchRound(); }} style={styles.retryBtn} />
                </View>
              ) : null}
              {cards.map((card) => {
                const showFace =
                  faceUp
                  || (phase === 'feedback' && feedback === 'correct' && ask?.id === card.id);
                const isHit = phase === 'feedback' && feedback === 'correct' && ask?.id === card.id;
                return (
                  <View
                    key={card.id}
                    collapsable={false}
                    pointerEvents="auto"
                    style={[
                      styles.cardSlot,
                      {
                        left: card.x,
                        top: card.y,
                        width: card.width,
                        height: card.height,
                      },
                    ]}
                  >
                    <MemoryCard
                      hex={card.hex}
                      width={card.width}
                      height={card.height}
                      faceUp={showFace}
                      disabled={phase !== 'question' || Boolean(feedback)}
                      highlight={isHit ? 'correct' : null}
                      burst={allowBurstFor(quality) && isHit}
                      onPress={() => handleCardPress(card)}
                    />
                  </View>
                );
              })}
            </LinearGradient>
          </LinearGradient>
        </View>

        <SpeedPrompt
          label={phase === 'reveal' ? 'MEMORIZE' : showAsk ? 'QUESTION' : 'SPEED CARD'}
          text={
            ask && showAsk
              ? speedCardQuestionText(ask.name)
              : phase === 'loading'
                ? 'Loading colors…'
                : phase === 'error'
                  ? 'Could not deal cards'
                  : 'Watch the cards'
          }
          swatch={ask && showAsk ? ask.hex : null}
        />

        {feedback === 'correct' ? (
          <Text style={styles.correctFeedback}>{SPEED_CARD_CORRECT_LABEL}</Text>
        ) : (
          <View style={styles.feedbackSpacer} />
        )}
      </View>

      {phase === 'howto' && (
        <View style={styles.howtoOverlay}>
          <LinearGradient
            colors={[SpeedTone.snapHot, SpeedTone.ice, SpeedTone.crimsonDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[layoutStyles.popupFrame, styles.howtoBezel, { height: popupH }]}
          >
            <LinearGradient colors={['rgba(22,10,20,0.98)', 'rgba(8,4,14,0.98)']} style={styles.howtoCard}>
              <Text style={[layoutStyles.popupTitle, styles.howtoTitle]}>{SPEED_CARD_HOW_TO_TITLE}</Text>
              <ScrollView style={layoutStyles.popupScroller} contentContainerStyle={layoutStyles.popupScrollContent}>
                <Text style={[layoutStyles.popupBody, styles.howtoBody]}>{SPEED_CARD_HOW_TO_BODY}</Text>
              </ScrollView>
              <GradientButton
                title={SPEED_CARD_READY_LABEL}
                onPress={() => {
                  hapticsService.impact(0);
                  playEffect('button_click');
                  beginCountdown();
                }}
                testID="speed-card-im-ready"
              />
            </LinearGradient>
          </LinearGradient>
        </View>
      )}

      {phase === 'countdown' || phase === 'start' ? (
        <LinearGradient
          colors={['rgba(8,4,15,0.9)', 'rgba(22,8,16,0.86)']}
          style={styles.countdownOverlay}
          pointerEvents="none"
        >
          <Text style={[styles.countdownNumber, phase === 'start' && styles.countdownStart]}>
            {phase === 'start' ? SPEED_CARD_START_LABEL : String(countdown)}
          </Text>
        </LinearGradient>
      ) : null}

      <PauseMenu
        visible={paused}
        onResume={() => setPaused(false)}
        onRestart={restart}
        onExit={exitToLobby}
      />

      <Modal visible={wrongOpen} transparent animationType="fade" onRequestClose={handleExitWrong}>
        <View style={layoutStyles.popupBackdrop}>
          <LinearGradient
            colors={[SpeedTone.crimson, SpeedTone.crimsonDeep, '#2A0810']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[layoutStyles.popupFrame, styles.wrongBezel, { height: popupH }]}
          >
            <LinearGradient colors={['rgba(28,8,14,0.98)', 'rgba(10,4,10,0.98)']} style={styles.wrongCard}>
              <Text style={[layoutStyles.popupTitle, styles.wrongTitle]}>{SPEED_CARD_WRONG_TITLE}</Text>
              <ScrollView style={layoutStyles.popupScroller} contentContainerStyle={layoutStyles.popupScrollContent}>
                <GradientButton
                  title={
                    continueLoading
                      ? 'Loading ad…'
                      : isAdFreePassActive()
                        ? 'Continue (Ad-Free)'
                        : SPEED_CARD_CONTINUE_LABEL
                  }
                  onPress={handleContinueAd}
                  disabled={continueLoading}
                  style={styles.wrongPrimary}
                />
                <TouchableOpacity style={styles.wrongSkip} onPress={handleExitWrong} disabled={continueLoading}>
                  <Text style={styles.wrongSkipText}>{SPEED_CARD_EXIT_LABEL}</Text>
                </TouchableOpacity>
              </ScrollView>
            </LinearGradient>
          </LinearGradient>
        </View>
      </Modal>
    </SpeedCardWorld>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, gap: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pauseButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
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
  },
  tableWrap: {
    flex: 1,
    minHeight: 240,
    maxHeight: 330,
    position: 'relative',
  },
  tableHalo: {
    position: 'absolute',
    top: -4,
    right: -3,
    bottom: -4,
    left: -3,
    borderRadius: 26,
    backgroundColor: 'rgba(125,211,252,0.14)',
  },
  tableBezel: {
    flex: 1,
    borderRadius: 24,
    padding: 3,
    overflow: 'hidden',
  },
  imageWrap: {
    flex: 1,
    borderRadius: 21,
    overflow: 'hidden',
  },
  tableRail: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 6,
    borderColor: 'rgba(90,40,48,0.55)',
    borderRadius: 24,
  },
  boardStatus: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, gap: 14, zIndex: 4 },
  boardStatusText: { color: SpeedTone.mute, fontSize: 16, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  retryBtn: { width: '80%' },
  cardSlot: { position: 'absolute', zIndex: 2, elevation: 4 },
  correctFeedback: {
    color: SpeedTone.greenHot,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    minHeight: 28,
  },
  feedbackSpacer: { minHeight: 28 },
  howtoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(8,4,15,0.82)',
    zIndex: 80,
  },
  howtoBezel: { borderRadius: 22, padding: 1.5 },
  howtoCard: { flex: 1, width: '100%', padding: POPUP_PADDING, gap: 12, borderRadius: 20 },
  howtoTitle: { color: SpeedTone.ink },
  howtoBody: { color: SpeedTone.mute, fontFamily: 'Inter_600SemiBold' },
  countdownOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  countdownNumber: { fontSize: 96, fontFamily: 'Inter_700Bold', color: SpeedTone.ink, lineHeight: 110, textAlign: 'center' },
  countdownStart: { fontSize: 64, lineHeight: 72, color: SpeedTone.greenHot },
  wrongBezel: { borderRadius: 24, padding: 1.5 },
  wrongCard: {
    flex: 1,
    width: '100%',
    borderRadius: 22,
    padding: POPUP_PADDING,
    alignItems: 'center',
    gap: 12,
  },
  wrongTitle: { color: SpeedTone.crimson },
  wrongPrimary: { width: '100%' },
  wrongSkip: { paddingVertical: 10 },
  wrongSkipText: { color: SpeedTone.mute, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});

export default SpeedCardScreen;
