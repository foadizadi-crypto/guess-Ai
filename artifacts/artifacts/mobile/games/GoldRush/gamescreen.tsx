import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useGoldRushFlow } from './flow';
import { SevenGameSessionShell } from '@/games/sessionShell';
import type { SevenGameScreenProps } from '@/games/sessionShell';
import { allowBlurFor, allowBurstFor, useVisualQuality } from '@/games/visualFoundation';
import { useRTL } from '@/hooks/useRTL';
import { ROUTES } from '@/navigation/routes';
import { GoldRushWorld } from './GoldRushWorld';
import { TreasureCard } from './TreasureCard';
import { StakesHud } from './StakesHud';
import { BankVaultButton } from './BankVaultButton';
import { GoldTone } from './goldTokens';
import {
  GOLD_RUSH_HOW_TO_BODY,
  GOLD_RUSH_HOW_TO_TITLE,
  GOLD_RUSH_TUNING,
} from './config';
import {
  grantGoldRushPackage,
  settleGoldRushCashOut,
  settleGoldRushCompletion,
  settleGoldRushZero,
} from './settle';

const COUNT_STEPS = ['3', '2', '1', 'GO!'] as const;

type Overlay =
  | { kind: 'none' }
  | { kind: 'hold' }
  | { kind: 'roundCountdown'; label: string }
  | { kind: 'detonator'; seconds: number }
  | { kind: 'deactivated' }
  | { kind: 'boom' };

export default function FateGameScreen({
  difficulty,
  skipHowTo,
  onHowToFinished,
  onExitToCategory,
}: SevenGameScreenProps) {
  const router = useRouter();
  const [playing, setPlaying] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>({ kind: 'none' });
  const [timerSeconds, setTimerSeconds] = useState<number>(GOLD_RUSH_TUNING.sessionTimerSeconds);
  const [safeFlipReady, setSafeFlipReady] = useState(false);
  const overlayRef = useRef<Overlay>({ kind: 'none' });
  const playingRef = useRef(false);
  const settledRef = useRef(false);
  const packageSecuredRef = useRef(false);
  const bombTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSafeFlipsRef = useRef(0);
  overlayRef.current = overlay;
  playingRef.current = playing;

  const locked =
    overlay.kind === 'hold' ||
    overlay.kind === 'roundCountdown' ||
    overlay.kind === 'detonator' ||
    overlay.kind === 'boom';

  const {
    deck,
    currentPot,
    round,
    maxRounds,
    correct,
    wrong,
    selectCard,
    continueRound,
    advanceAfterBomb,
    cashOut,
    markPackageConsumed,
    forceEnd,
    snapshot,
    safesThisRound,
  } = useGoldRushFlow(difficulty, playing, locked);

  const insets = useSafeAreaInsets();
  const { flexDirection } = useRTL();
  const { width } = useWindowDimensions();
  const quality = useVisualQuality();
  const topPad = Platform.OS === 'web' ? 54 : insets.top + 10;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 14;
  const threat =
    overlay.kind === 'detonator' ||
    overlay.kind === 'boom' ||
    deck.some((card) => card.isRevealed && card.type === 'bomb');

  const { cardW, cardH } = useMemo(() => {
    const columns = 3;
    const gutter = 12;
    const side = 40;
    const w = Math.min(118, Math.floor((width - side - gutter * (columns - 1)) / columns));
    return { cardW: Math.max(88, w), cardH: Math.round(Math.max(88, w) * 1.38) };
  }, [width]);

  const goResult = useCallback(() => {
    router.replace(ROUTES.RESULT);
  }, [router]);

  const goCategory = useCallback(() => {
    router.replace(ROUTES.CATEGORY_SELECT);
  }, [router]);

  const finishZero = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    const snap = forceEnd(true);
    settleGoldRushZero(snap.correct, snap.wrong);
    goResult();
  }, [forceEnd, goResult]);

  const finishCashOut = useCallback(() => {
    if (settledRef.current) return;
    const snap = cashOut();
    if (!snap) return;
    settledRef.current = true;
    settleGoldRushCashOut(snap.pot, snap.pendingXP, snap.correct, snap.wrong);
    goCategory();
  }, [cashOut, goCategory]);

  const finishComplete = useCallback(() => {
    if (settledRef.current) return;
    const snap = snapshot();
    settledRef.current = true;
    forceEnd(false);
    settleGoldRushCompletion(snap.pot, snap.pendingXP, snap.correct, snap.wrong);
    goCategory();
  }, [forceEnd, goCategory, snapshot]);

  const boom = useCallback(() => {
    if (settledRef.current || overlayRef.current.kind === 'boom') return;
    setOverlay({ kind: 'boom' });
  }, []);

  const startRoundCountdown = useCallback(() => {
    setOverlay({ kind: 'roundCountdown', label: COUNT_STEPS[0] });
  }, []);

  const handleCashOut = useCallback(() => {
    if (overlayRef.current.kind === 'detonator') {
      boom();
      return;
    }
    if (
      overlayRef.current.kind !== 'none' &&
      overlayRef.current.kind !== 'deactivated'
    ) {
      return;
    }
    if (settledRef.current) return;
    finishCashOut();
  }, [boom, finishCashOut]);

  const handleContinue = useCallback(() => {
    if (overlayRef.current.kind === 'detonator') {
      boom();
      return;
    }
    if (
      overlayRef.current.kind !== 'none' &&
      overlayRef.current.kind !== 'deactivated'
    ) {
      return;
    }
    if (settledRef.current || timerSeconds <= 0) return;
    const next = continueRound();
    if (!next) return;
    pendingSafeFlipsRef.current = 0;
    setSafeFlipReady(false);
    if (next.kind === 'complete') {
      finishComplete();
      return;
    }
    startRoundCountdown();
  }, [boom, continueRound, finishComplete, startRoundCountdown, timerSeconds]);

  const handleSelectCard = useCallback(
    (index: number) => {
      if (overlayRef.current.kind === 'detonator') {
        boom();
        return;
      }
      if (
        overlayRef.current.kind !== 'none' &&
        overlayRef.current.kind !== 'deactivated'
      ) {
        return;
      }
      if (settledRef.current) return;
      const result = selectCard(index);
      if (result.kind === 'bomb') {
        pendingSafeFlipsRef.current = 0;
        setSafeFlipReady(false);
        if (result.hardGameOver) {
          boom();
          return;
        }
        setOverlay({ kind: 'hold' });
        if (bombTimerRef.current) clearTimeout(bombTimerRef.current);
        bombTimerRef.current = setTimeout(() => {
          if (settledRef.current) return;
          const next = advanceAfterBomb();
          if (!next) return;
          if (next.kind === 'hard-game-over') {
            boom();
            return;
          }
          if (next.kind === 'complete') {
            finishComplete();
            return;
          }
          startRoundCountdown();
        }, 700);
        return;
      }
      if (result.kind === 'safe') {
        pendingSafeFlipsRef.current += 1;
        setSafeFlipReady(false);
        if (result.foundPackage) {
          markPackageConsumed();
          setOverlay({ kind: 'detonator', seconds: GOLD_RUSH_TUNING.detonatorSeconds });
        }
      }
    },
    [advanceAfterBomb, boom, finishComplete, markPackageConsumed, selectCard, startRoundCountdown],
  );

  const handleCollect = useCallback(() => {
    if (overlayRef.current.kind !== 'detonator' || settledRef.current) return;
    markPackageConsumed();
    packageSecuredRef.current = true;
    grantGoldRushPackage();
    setOverlay({ kind: 'deactivated' });
  }, [markPackageConsumed]);

  useEffect(() => {
    if (safesThisRound <= 0) {
      pendingSafeFlipsRef.current = 0;
      setSafeFlipReady(false);
      return;
    }
    const id = setTimeout(() => {
      pendingSafeFlipsRef.current = 0;
      setSafeFlipReady(true);
    }, 600);
    return () => clearTimeout(id);
  }, [round, safesThisRound]);

  useEffect(() => {
    if (overlay.kind !== 'deactivated') return;
    const id = setTimeout(() => setOverlay({ kind: 'none' }), 1400);
    return () => clearTimeout(id);
  }, [overlay.kind]);

  useEffect(() => {
    if (overlay.kind !== 'boom') return;
    const id = setTimeout(() => finishZero(), 900);
    return () => clearTimeout(id);
  }, [finishZero, overlay.kind]);

  useEffect(() => {
    if (overlay.kind !== 'roundCountdown') return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      if (i >= COUNT_STEPS.length) {
        clearInterval(id);
        setOverlay({ kind: 'none' });
        return;
      }
      const label = COUNT_STEPS[i];
      if (!label) {
        clearInterval(id);
        setOverlay({ kind: 'none' });
        return;
      }
      setOverlay({ kind: 'roundCountdown', label });
    }, 700);
    return () => clearInterval(id);
  }, [overlay.kind]);

  useEffect(() => {
    if (overlay.kind !== 'detonator') return;
    const id = setInterval(() => {
      setOverlay((current) => {
        if (current.kind !== 'detonator') return current;
        if (current.seconds <= 1) return { kind: 'boom' };
        return { kind: 'detonator', seconds: current.seconds - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [overlay.kind]);

  const timerPaused =
    !playing ||
    overlay.kind === 'hold' ||
    overlay.kind === 'roundCountdown' ||
    overlay.kind === 'detonator' ||
    overlay.kind === 'boom';

  useEffect(() => {
    if (timerPaused || settledRef.current) return;
    const id = setInterval(() => {
      setTimerSeconds((left) => {
        if (left <= 1) {
          clearInterval(id);
          return 0;
        }
        return left - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerPaused]);

  useEffect(() => {
    if (playing && timerSeconds <= 0 && !settledRef.current) finishZero();
  }, [finishZero, playing, timerSeconds]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (!playingRef.current || settledRef.current) return;
      if (next === 'background' || next === 'inactive') finishZero();
    });
    return () => sub.remove();
  }, [finishZero]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (settledRef.current) return false;
      if (overlayRef.current.kind === 'detonator') {
        boom();
        return true;
      }
      if (playingRef.current) {
        finishZero();
        return true;
      }
      onExitToCategory();
      return true;
    });
    return () => sub.remove();
  }, [boom, finishZero, onExitToCategory]);

  const bombShowing = deck.some((card) => card.isRevealed && card.type === 'bomb');
  const showContinue =
    playing &&
    safesThisRound > 0 &&
    safeFlipReady &&
    timerSeconds > 0 &&
    !bombShowing &&
    overlay.kind !== 'hold' &&
    overlay.kind !== 'roundCountdown' &&
    overlay.kind !== 'boom';

  const detonatorActive = overlay.kind === 'detonator';

  return (
    <SevenGameSessionShell
      howToTitle={GOLD_RUSH_HOW_TO_TITLE}
      howToBody={GOLD_RUSH_HOW_TO_BODY}
      skipHowTo={skipHowTo}
      wrongOpen={false}
      onHowToFinished={onHowToFinished}
      onPlayStart={() => setPlaying(true)}
      onContinue={() => {}}
      onExitToCategory={onExitToCategory}
      onRestart={() => {}}
      atmosphere="treasure"
    >
      <GoldRushWorld quality={quality} threat={threat}>
        <View style={[styles.play, { paddingTop: topPad, paddingBottom: botPad }]}>
          <StakesHud
            round={round}
            maxRounds={maxRounds}
            correct={correct}
            wrong={wrong}
            currentPot={currentPot}
            timerSeconds={timerSeconds}
            rowStyle={{ flexDirection }}
            blur={allowBlurFor(quality)}
          />

          <View style={styles.table}>
            {deck.length === 0 ? (
              <View style={styles.sealing} />
            ) : (
              deck.map((card, idx) => (
                <TreasureCard
                  key={card.id}
                  card={card}
                  width={cardW}
                  height={cardH}
                  index={idx}
                  burst={allowBurstFor(quality) && card.isRevealed}
                  onPress={() => handleSelectCard(idx)}
                  onRevealComplete={() => {
                    if (card.type === 'bomb' || !card.isRevealed) {
                      pendingSafeFlipsRef.current = 0;
                      setSafeFlipReady(false);
                      return;
                    }
                    pendingSafeFlipsRef.current = Math.max(0, pendingSafeFlipsRef.current - 1);
                    if (pendingSafeFlipsRef.current === 0) setSafeFlipReady(true);
                  }}
                />
              ))
            )}
          </View>

          <View style={styles.bankSlot}>
            {showContinue ? (
              <View style={[styles.bankRow, { flexDirection }]}>
                <View style={styles.bankBtn}>
                  <BankVaultButton
                    label="Continue"
                    onPress={handleContinue}
                    colors={[GoldTone.bank, GoldTone.metal]}
                  />
                </View>
                <View style={styles.bankBtn}>
                  <BankVaultButton label="Cash Out" onPress={handleCashOut} />
                </View>
              </View>
            ) : (
              <BankVaultButton label="Cash Out" onPress={handleCashOut} />
            )}
          </View>
        </View>

        {overlay.kind === 'roundCountdown' ? (
          <LinearGradient colors={['rgba(7,4,13,0.9)', 'rgba(20,10,8,0.86)']} style={styles.cover}>
            <Text style={styles.countText}>{overlay.label}</Text>
          </LinearGradient>
        ) : null}

        {detonatorActive ? (
          <View style={styles.detonatorWrap} pointerEvents="box-none">
            <View style={styles.detonatorCard}>
              <Text style={styles.detonatorTitle}>THE DETONATOR WAS ACTIVATED.</Text>
              <Text style={styles.detonatorTime}>{overlay.seconds}</Text>
              <TouchableOpacity style={styles.collectBtn} onPress={handleCollect} activeOpacity={0.85}>
                <Text style={styles.collectText}>COLLECT</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {overlay.kind === 'deactivated' ? (
          <View style={styles.detonatorWrap} pointerEvents="none">
            <View style={[styles.detonatorCard, styles.deactivatedCard]}>
              <Text style={styles.deactivated}>THE DETONATOR WAS DEACTIVATED.</Text>
            </View>
          </View>
        ) : null}

        {overlay.kind === 'boom' ? (
          <LinearGradient colors={['rgba(40,8,8,0.94)', 'rgba(12,4,8,0.9)']} style={styles.cover}>
            <Text style={styles.boom}>BOOOOM</Text>
          </LinearGradient>
        ) : null}
      </GoldRushWorld>
    </SevenGameSessionShell>
  );
}

const styles = StyleSheet.create({
  play: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 16,
  },
  table: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    gap: 12,
  },
  bankSlot: {
    minHeight: 58,
    justifyContent: 'flex-end',
    gap: 10,
  },
  bankRow: {
    width: '100%',
    gap: 10,
  },
  bankBtn: {
    flex: 1,
  },
  sealing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(201,162,74,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244,215,138,0.22)',
  },
  cover: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    zIndex: 8,
  },
  countText: {
    color: '#F4D78A',
    fontSize: 72,
    fontWeight: '800',
  },
  detonatorWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    paddingTop: 88,
    paddingHorizontal: 18,
    zIndex: 6,
  },
  detonatorCard: {
    backgroundColor: 'rgba(72,12,12,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,90,70,0.7)',
    borderRadius: 18,
    padding: 18,
    gap: 10,
    alignItems: 'center',
  },
  detonatorTitle: {
    color: '#FFD0C8',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  detonatorTime: {
    color: '#FFE08A',
    fontSize: 40,
    fontWeight: '800',
  },
  collectBtn: {
    backgroundColor: '#F4D78A',
    minWidth: 200,
    paddingVertical: 14,
    borderRadius: 14,
  },
  collectText: {
    color: '#1A1004',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
  },
  deactivated: {
    color: '#F4D78A',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  deactivatedCard: {
    backgroundColor: 'rgba(18,12,8,0.92)',
    borderColor: 'rgba(244,215,138,0.55)',
  },
  boom: {
    color: '#FF6B4A',
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
