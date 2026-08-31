import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
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
import { useAudio } from '@/hooks/useAudio';
import { DIFFICULTY_CONFIG, calculateAnswerScore, getAvatarAbility, getTimerColor } from '@/gameEngine';
import { STAMINA_PER_GAME } from '@/constants/economy';
import { ROUTES } from '@/navigation/routes';
import {
  SPEED_CARD_COUNT,
  SPEED_CARD_FLASH_MS,
  fetchSpeedCardRound,
  layoutCardPositions,
  revealDurationMs,
  type SpeedCardColor,
} from '@/games/speed-card/engine';

type Phase = 'countdown' | 'ready' | 'loading' | 'reveal' | 'question' | 'flash' | 'error';

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
  const insets = useSafeAreaInsets();
  const difficulty = useGameStore((s) => s.selectedDifficulty);
  const category = useGameStore((s) => s.selectedCategory);
  const timer = useGameStore((s) => s.timer);
  const score = useGameStore((s) => s.score);
  const gameSession = useGameStore((s) => s.gameSession);
  const recordAnswer = useGameStore((s) => s.recordAnswer);
  const advanceQuestion = useGameStore((s) => s.advanceQuestion);
  const startSession = useGameStore((s) => s.startSession);
  const endSession = useGameStore((s) => s.endSession);
  const resetGame = useGameStore((s) => s.resetGame);
  const selectedAvatarId = useUserStore((s) => s.selectedAvatarId);
  const spendEnergy = useUserStore((s) => s.spendEnergy);
  const { playEffect } = useAudio();

  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [paused, setPaused] = useState(false);
  const [cards, setCards] = useState<PlacedCard[]>([]);
  const [faceUp, setFaceUp] = useState(true);
  const [questions, setQuestions] = useState<SpeedCardColor[]>([]);
  const [localQuestionIndex, setLocalQuestionIndex] = useState(0);
  const [flashKind, setFlashKind] = useState<'correct' | 'wrong' | null>(null);
  const [board, setBoard] = useState({ width: 0, height: 0 });
  const [loadError, setLoadError] = useState<string | null>(null);

  const endedRef = useRef(false);
  const countdownStarted = useRef(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchLock = useRef(false);
  const cdScale = useSharedValue(1.5);

  const config = DIFFICULTY_CONFIG[difficulty];
  const currentAsk = questions[localQuestionIndex];
  const topPad = Platform.OS === 'web' ? 54 : insets.top + 8;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 12;

  const clearTimers = () => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    revealTimer.current = null;
    flashTimer.current = null;
  };

  const finishRound = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    clearTimers();
    setPaused(false);
    endSession();
    setTimeout(() => {
      router.replace(ROUTES.RESULT);
    }, 50);
  }, [endSession, router]);

  const exitToLobby = useCallback(() => {
    clearTimers();
    setPaused(false);
    setTimeout(() => {
      resetGame();
      router.replace(ROUTES.LOBBY);
    }, 50);
  }, [resetGame, router]);

  const dealRound = useCallback(async () => {
    if (fetchLock.current) return;
    if (board.width < 80 || board.height < 80) {
      setPhase('loading');
      return;
    }
    fetchLock.current = true;
    setLoadError(null);
    setPhase('loading');
    try {
      const round = await fetchSpeedCardRound();
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
      setQuestions(round.questions);
      setLocalQuestionIndex(0);
      setFaceUp(true);
      setFlashKind(null);
      setPhase('reveal');
      if (revealTimer.current) clearTimeout(revealTimer.current);
      revealTimer.current = setTimeout(() => {
        setFaceUp(false);
        setPhase('question');
      }, revealDurationMs(difficulty));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Speed Card API failed';
      setLoadError(msg);
      setCards([]);
      setQuestions([]);
      setPhase('error');
    } finally {
      fetchLock.current = false;
    }
  }, [board.height, board.width, difficulty]);

  useEffect(() => {
    if (phase === 'loading' && cards.length === 0 && board.width >= 80 && board.height >= 80) {
      void dealRound();
    }
  }, [board.height, board.width, cards.length, dealRound, phase]);

  useEffect(() => {
    return () => clearTimers();
  }, []);

  useEffect(() => {
    if (gameSession) return;
    const t = setTimeout(() => {
      if (!useGameStore.getState().gameSession) router.replace(ROUTES.LOBBY);
    }, 50);
    return () => clearTimeout(t);
  }, [gameSession, router]);

  useEffect(() => {
    if (countdownStarted.current) return;
    countdownStarted.current = true;
    setCountdown(3);
    setPhase('countdown');
  }, []);

  useEffect(() => {
    if (phase !== 'countdown' || paused) return;
    if (countdown === 0) {
      const t = setTimeout(() => setPhase('ready'), 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, paused, phase]);

  useEffect(() => {
    if (phase === 'countdown' && countdown > -1) {
      cdScale.value = 1.5;
      cdScale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    }
  }, [countdown, cdScale, phase]);

  const onBoardLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBoard({ width, height });
  };

  const handleReadyYes = () => {
    void dealRound();
  };

  const handleReadyNo = () => {
    setPhase('loading');
    exitToLobby();
  };

  const goNextAfterFlash = useCallback((wasLast: boolean) => {
    setFlashKind(null);
    if (wasLast) {
      finishRound();
      return;
    }
    setLocalQuestionIndex((i) => i + 1);
    advanceQuestion();
    setPhase('question');
  }, [advanceQuestion, finishRound]);

  const handleCardPress = (card: PlacedCard) => {
    if (phase !== 'question' || !currentAsk || flashKind) return;
    const correct = card.id === currentAsk.id;
    const points = correct
      ? calculateAnswerScore(difficulty, timer, getAvatarAbility(selectedAvatarId), useGameStore.getState().streak)
      : 0;
    recordAnswer(correct, points);
    hapticsService.notification(correct ? 1 : 0);
    playEffect(correct ? 'correct' : 'wrong');
    setFlashKind(correct ? 'correct' : 'wrong');
    setPhase('flash');
    const wasLast = localQuestionIndex >= SPEED_CARD_COUNT - 1;
    flashTimer.current = setTimeout(() => {
      goNextAfterFlash(wasLast);
    }, SPEED_CARD_FLASH_MS);
  };

  const restart = useCallback(() => {
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
    clearTimers();
    endedRef.current = false;
    setPaused(false);
    setCards([]);
    setQuestions([]);
    setLocalQuestionIndex(0);
    setFaceUp(true);
    setFlashKind(null);
    countdownStarted.current = true;
    setCountdown(3);
    setPhase('countdown');
    startSession(difficulty, category);
  }, [category, difficulty, exitToLobby, spendEnergy, startSession]);

  const cdStyle = useAnimatedStyle(() => ({ transform: [{ scale: cdScale.value }] }));

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
        <View style={styles.topBar}>
          <BackButton onPress={() => setPaused(true)} />
          <View style={styles.topCenter}>
            <Text style={styles.mode}>{config?.label ? config.label.toUpperCase() : 'MODE'} • SPEED CARD</Text>
            <Text style={[styles.timer, { color: getTimerColor(timer) }]}>
              {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
            </Text>
          </View>
          <TouchableOpacity style={styles.pauseButton} onPress={() => setPaused(true)}>
            <Ionicons name="pause" size={20} color={GameColors.textWhite} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.counter}>{Math.min(localQuestionIndex + 1, SPEED_CARD_COUNT)} / {SPEED_CARD_COUNT}</Text>
          <View style={styles.segmentTrack}>
            {Array.from({ length: SPEED_CARD_COUNT }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.segment,
                  index < localQuestionIndex && styles.segmentDone,
                  index === localQuestionIndex && phase === 'question' && { backgroundColor: config?.color ?? '#8B5CF6' },
                ]}
              />
            ))}
          </View>
          <Text style={styles.score}>+{score}</Text>
        </View>

        <View
          style={styles.imageWrap}
          onLayout={onBoardLayout}
          pointerEvents="box-none"
          collapsable={false}
        >
          {phase === 'loading' ? (
            <View style={styles.boardStatus} pointerEvents="auto">
              <Text style={styles.boardStatusText}>Connecting to OpenAI…</Text>
            </View>
          ) : null}
          {phase === 'error' ? (
            <View style={styles.boardStatus} pointerEvents="auto">
              <Text style={styles.boardStatusText}>{loadError ?? 'Online round failed'}</Text>
              <GradientButton title="Try Again" onPress={() => { void dealRound(); }} style={styles.retryBtn} />
            </View>
          ) : null}
          {cards.map((card) => (
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
              <Pressable
                disabled={phase !== 'question' || Boolean(flashKind)}
                onPress={() => handleCardPress(card)}
                style={styles.cardHit}
              >
                <View
                  style={[
                    styles.cardFace,
                    {
                      backgroundColor: faceUp ? card.hex : '#1B0F33',
                      borderColor: faceUp && (card.id === 'white' || card.id === 'yellow' || card.id === 'gold')
                        ? 'rgba(13,2,33,0.45)'
                        : faceUp
                          ? 'rgba(255,255,255,0.35)'
                          : GameColors.cardBorder,
                    },
                  ]}
                />
              </Pressable>
            </View>
          ))}
        </View>

        <GlassCard style={styles.questionCard}>
          <Text style={styles.questionLabel}>
            {phase === 'reveal' ? 'MEMORIZE' : phase === 'question' || phase === 'flash' ? 'WHAT COLOR?' : 'SPEED CARD'}
          </Text>
          <Text style={styles.questionText} numberOfLines={2}>
            {currentAsk && (phase === 'question' || phase === 'flash')
              ? `${currentAsk.name}?`
              : phase === 'loading'
                ? 'Loading colors…'
                : phase === 'error'
                  ? 'Online round required'
                  : 'Watch the cards'}
          </Text>
        </GlassCard>
      </View>

      {phase === 'countdown' && (
        <View style={styles.countdownOverlay}>
          <Animated.Text style={[styles.countdownNumber, cdStyle, countdown === 0 && { color: GameColors.accentGreen }]}>
            {countdown === 0 ? 'GO!' : String(countdown)}
          </Animated.Text>
          <Text style={styles.countdownSub}>{countdown === 0 ? 'Have fun!' : 'Get ready…'}</Text>
        </View>
      )}

      <Modal visible={phase === 'ready'} transparent animationType="fade" onRequestClose={handleReadyNo}>
        <View style={styles.readyBackdrop}>
          <View style={styles.readyCard}>
            <Text style={styles.readyTitle}>Are you Ready?</Text>
            <View style={styles.readyActions}>
              <TouchableOpacity style={styles.readyNo} onPress={handleReadyNo}>
                <Text style={styles.readyNoText}>no</Text>
              </TouchableOpacity>
              <GradientButton title="yes" onPress={handleReadyYes} style={styles.readyYes} />
            </View>
          </View>
        </View>
      </Modal>

      {flashKind ? (
        <View
          pointerEvents="none"
          style={[
            styles.flashOverlay,
            { backgroundColor: flashKind === 'correct' ? 'rgba(0,230,118,0.55)' : 'rgba(255,23,68,0.55)' },
          ]}
        >
          <Ionicons
            name={flashKind === 'correct' ? 'checkmark-circle' : 'close'}
            size={96}
            color={flashKind === 'correct' ? GameColors.accentGreen : GameColors.accentRed}
          />
        </View>
      ) : null}

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
  boardStatus: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, gap: 14, zIndex: 4 },
  boardStatusText: { ...Typography.caption, color: GameColors.textSecondary, textAlign: 'center' },
  retryBtn: { width: '80%' },
  cardSlot: { position: 'absolute', zIndex: 2, elevation: 4 },
  cardHit: { flex: 1 },
  cardFace: { flex: 1, borderRadius: 12, borderWidth: 2 },
  questionCard: { padding: 14, gap: 4 },
  questionLabel: { ...Typography.small, color: GameColors.accentGold, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  questionText: { ...Typography.semibold, color: GameColors.textWhite, textAlign: 'right' },
  countdownOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(13,2,33,0.82)', zIndex: 100 },
  countdownNumber: { fontSize: 96, fontFamily: 'Inter_700Bold', color: GameColors.textWhite, textShadowColor: GameColors.glow, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 32, lineHeight: 110 },
  countdownSub: { ...Typography.caption, color: GameColors.textSecondary, marginTop: 8, letterSpacing: 2, textTransform: 'uppercase' },
  readyBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  readyCard: { width: '100%', borderRadius: 24, padding: 24, alignItems: 'center', backgroundColor: GameColors.card, borderWidth: 1, borderColor: GameColors.cardBorder, gap: 18 },
  readyTitle: { ...Typography.header, color: GameColors.textWhite, fontSize: 28, textAlign: 'center' },
  readyActions: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' },
  readyNo: { flex: 1, paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: GameColors.border, alignItems: 'center' },
  readyNoText: { ...Typography.small, color: GameColors.textWhite, fontFamily: 'Inter_600SemiBold' },
  readyYes: { flex: 1 },
  flashOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 120 },
});

export default SpeedCardScreen;
