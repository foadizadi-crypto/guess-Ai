/**
 * spin.tsx — Jackpot Spin Wheel (Phase 3)
 *
 * Spec §2-3:
 *  · Visual 8-segment wheel with Reanimated deceleration
 *  · Free spin: 1 per UTC calendar day
 *  · Paid extra spin (100 coins, max 5/day)
 *  · Countdown timer to next free spin
 *  · Persists spin history to Firestore
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
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
  runOnJS,
} from 'react-native-reanimated';
import { Svg, Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { hapticsService } from '@/services/HapticsService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { CoinDisplay } from '@/components/CoinDisplay';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import {
  SPIN_CONFIG,
  angleForSegment,
  type SpinReward,
} from '@/constants/spinConfig';
import { saveSpinHistory } from '@/services/firestoreService';
import { getPlayerId } from '@/services/authService';
import { getTodayUTCString, msUntilNextUtcMidnight } from '@/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const WHEEL_SIZE    = 300;
const WHEEL_RADIUS  = WHEEL_SIZE / 2 - 6;
const CX            = WHEEL_SIZE / 2;
const CY            = WHEEL_SIZE / 2;
const SEGMENT_COUNT = SPIN_CONFIG.rewards.length;
const SEG_DEG       = 360 / SEGMENT_COUNT;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** SVG arc path for one pie segment (clockwise) */
function segmentPath(startDeg: number, endDeg: number): string {
  const start      = polarToCartesian(CX, CY, WHEEL_RADIUS, startDeg);
  const end        = polarToCartesian(CX, CY, WHEEL_RADIUS, endDeg);
  const largeArc   = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${CX} ${CY}`,
    `L ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
    `A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

/** Format seconds as mm:ss */
function fmtCountdown(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Wheel SVG ────────────────────────────────────────────────────────────────

const WheelSvg: React.FC = () => (
  <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
    {/* Outer ring */}
    <Circle
      cx={CX} cy={CY} r={WHEEL_RADIUS + 5}
      fill="none" stroke="#FFD700" strokeWidth={4}
    />
    {/* Segments */}
    {SPIN_CONFIG.rewards.map((reward, i) => {
      const startDeg = i * SEG_DEG;
      const endDeg   = startDeg + SEG_DEG;
      const midDeg   = startDeg + SEG_DEG / 2;
      const textPos  = polarToCartesian(CX, CY, WHEEL_RADIUS * 0.62, midDeg);
      const iconPos  = polarToCartesian(CX, CY, WHEEL_RADIUS * 0.82, midDeg);

      return (
        <G key={reward.id}>
          {/* Segment fill */}
          <Path
            d={segmentPath(startDeg, endDeg)}
            fill={reward.color}
            stroke="#0D0D1A"
            strokeWidth={2}
          />
          {/* Segment label */}
          <G
            rotation={midDeg}
            origin={`${CX}, ${CY}`}
          >
            <SvgText
              x={CX}
              y={CY - WHEEL_RADIUS * 0.62}
              textAnchor="middle"
              fontSize={reward.label.length > 8 ? 8 : 9}
              fontWeight="700"
              fill="white"
              // slight shadow via stroke
              stroke="rgba(0,0,0,0.4)"
              strokeWidth={0.5}
              /* paintOrder removed: not supported in RN SVG Text */
            >
              {reward.label}
            </SvgText>
          </G>
          {/* Jackpot star highlight */}
          {reward.isJackpot && (
            <G rotation={midDeg} origin={`${CX}, ${CY}`}>
              <SvgText
                x={CX}
                y={CY - WHEEL_RADIUS * 0.82}
                textAnchor="middle"
                fontSize={14}
                fill="#FFD700"
              >
                ★
              </SvgText>
            </G>
          )}
        </G>
      );
    })}
    {/* Center hub */}
    <Circle cx={CX} cy={CY} r={22} fill="#0D0D1A" stroke="#FFD700" strokeWidth={3} />
    <Circle cx={CX} cy={CY} r={12} fill="#FFD700" />
  </Svg>
);

// ─── Pointer ──────────────────────────────────────────────────────────────────

const Pointer: React.FC = () => (
  <View style={styles.pointerWrap} pointerEvents="none">
    <View style={styles.pointer} />
  </View>
);

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SpinScreen() {
  const insets = useSafeAreaInsets();

  // Store
  const coins         = useUserStore((s) => s.coins);
  const extraSpinsToday = useUserStore((s) => s.extraSpinsToday);
  const lastExtraSpinDate = useUserStore((s) => s.lastExtraSpinDate);
  const performSpin   = useUserStore((s) => s.performSpin);
  const canFreeSpin   = useUserStore((s) => s.canFreeSpin);
  const canExtraSpin  = useUserStore((s) => s.canExtraSpin);

  // Animation
  const rotation  = useSharedValue(0);
  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // UI state
  const [spinning,   setSpinning]   = useState(false);
  const [result,     setResult]     = useState<SpinReward | null>(null);
  const [showModal,  setShowModal]  = useState(false);
  const [countdown,  setCountdown]  = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Countdown timer ────────────────────────────────────────────────────────
  const refreshCountdown = useCallback(() => {
    if (canFreeSpin()) { setCountdown(0); return; }
    setCountdown(Math.ceil(msUntilNextUtcMidnight() / 1000));
  }, [canFreeSpin]);

  useEffect(() => {
    refreshCountdown();
    tickRef.current = setInterval(refreshCountdown, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [refreshCountdown]);

  // ── Core spin logic ────────────────────────────────────────────────────────
  const triggerSpin = useCallback((isFree: boolean) => {
    if (spinning) return;

    const reward = performSpin(isFree);
    if (!reward) return;  // guard failed (no coins / daily limit etc.)

    setSpinning(true);
    hapticsService.impact(2);

    // Which segment index did we land on?
    const segIndex = SPIN_CONFIG.rewards.findIndex((r) => r.id === reward.id);
    const landAngle = angleForSegment(segIndex, SEGMENT_COUNT);
    // Full rotations (4-6) + landing offset, always going forward
    const fullRotations = (4 + Math.floor(Math.random() * 3)) * 360;
    const targetAngle   = rotation.value + fullRotations + landAngle;

    rotation.value = withTiming(targetAngle, {
      duration: 4500,
      easing:   Easing.out(Easing.cubic),
    }, (finished) => {
      if (finished) {
        runOnJS(onSpinFinished)(reward);
      }
    });

    // Persist to Firestore (fire & forget)
    const uid = getPlayerId();
    if (uid) {
      saveSpinHistory(uid, {
        rewardId:     reward.id,
        rewardType:   reward.type,
        rewardAmount: reward.amount,
        timestamp:    new Date().toISOString(),
      });
    }
  }, [spinning, performSpin, rotation]);

  const onSpinFinished = (reward: SpinReward) => {
    setResult(reward);
    setShowModal(true);
    setSpinning(false);
    hapticsService.notification(1);
    // Normalise rotation to avoid accumulation drift
    rotation.value = rotation.value % 360;
  };

  const dismissModal = () => {
    setShowModal(false);
    setResult(null);
  };

  const isFreeAvailable  = canFreeSpin();
  const isExtraAvailable = canExtraSpin() && coins >= SPIN_CONFIG.extraSpinCost;
  const extraUsed        = lastExtraSpinDate === getTodayUTCString() ? extraSpinsToday : 0;
  const extraMax         = SPIN_CONFIG.extraSpinsPerDay;

  return (
    <AnimatedBackground>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <BackButton />
        <Text style={styles.title}>Lucky Spin</Text>
        <CoinDisplay amount={coins} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Wheel container */}
        <View style={styles.wheelContainer}>
          <Pointer />
          <Animated.View style={[styles.wheelAnim, wheelStyle]}>
            <WheelSvg />
          </Animated.View>
          {/* Glow ring while spinning */}
          {spinning && <View style={styles.spinGlow} pointerEvents="none" />}
        </View>

        {/* Spin status */}
        {!isFreeAvailable && countdown > 0 && (
          <View style={styles.countdownCard}>
            <Ionicons name="time-outline" size={18} color={GameColors.textSecondary} />
            <Text style={styles.countdownLabel}>Next free spin in</Text>
            <Text style={styles.countdownValue}>{fmtCountdown(countdown)}</Text>
          </View>
        )}

        {/* Extra spins used today */}
        {extraUsed > 0 && (
          <View style={styles.extraInfo}>
            <Text style={styles.extraInfoText}>
              Extra spins today: {extraUsed}/{extraMax}
            </Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.btnRow}>
          {/* Free spin */}
          <TouchableOpacity
            style={[
              styles.spinBtn,
              styles.spinBtnFree,
              (!isFreeAvailable || spinning) && styles.spinBtnDisabled,
            ]}
            onPress={() => triggerSpin(true)}
            disabled={!isFreeAvailable || spinning}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isFreeAvailable ? 'gift-outline' : 'hourglass-outline'}
              size={22}
              color="white"
            />
            <View>
              <Text style={styles.spinBtnLabel}>Free Spin</Text>
              <Text style={styles.spinBtnSub}>
                {isFreeAvailable ? '1 free spin today' : `${fmtCountdown(countdown)}`}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Extra spin */}
          <TouchableOpacity
            style={[
              styles.spinBtn,
              styles.spinBtnExtra,
              (!isExtraAvailable || spinning) && styles.spinBtnDisabled,
            ]}
            onPress={() => triggerSpin(false)}
            disabled={!isExtraAvailable || spinning}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={22} color="white" />
            <View>
              <Text style={styles.spinBtnLabel}>Extra Spin</Text>
              <Text style={styles.spinBtnSub}>{SPIN_CONFIG.extraSpinCost} 🪙 · {extraMax - extraUsed} left</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Reward table — names only. Odds stay in spinConfig / performSpin. */}
        <View style={styles.rewardTable}>
          <Text style={styles.rewardTableTitle}>Possible rewards</Text>
          {SPIN_CONFIG.rewards.map((r) => (
            <View key={r.id} style={styles.rewardRow}>
              <View style={[styles.rewardDot, { backgroundColor: r.color }]} />
              <Text style={styles.rewardName}>{r.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── Result modal ──────────────────────────────────────────────────── */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={dismissModal}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            {result?.isJackpot && (
              <Text style={styles.jackpotBanner}>🎰 JACKPOT! 🎰</Text>
            )}
            <View style={[styles.modalIcon, { backgroundColor: result?.color ?? '#333' }]}>
              <Ionicons
                name={(result?.icon ?? 'gift-outline') as any}
                size={42}
                color="white"
              />
            </View>
            <Text style={styles.modalTitle}>
              {result?.isJackpot ? `${result.amount.toLocaleString()} Coins!` : result?.label ?? ''}
            </Text>
            <Text style={styles.modalDesc}>
              {result?.type === 'coins'      ? `+${result.amount} coins added to your wallet` :
               result?.type === 'gems'       ? `+${result.amount} gems added to your wallet` :
               result?.type === 'consumable' ? `${result.label} added to your inventory` :
               result?.type === 'cosmetic'   ? 'Cosmetic item unlocked in Collections!' :
               result?.type === 'jackpot'    ? `Jackpot! ${result.amount.toLocaleString()} coins!` :
               ''}
            </Text>
            <TouchableOpacity style={styles.modalBtn} onPress={dismissModal}>
              <Text style={styles.modalBtnText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AnimatedBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom:  12,
  },
  title: {
    ...Typography.header,
    color: GameColors.textWhite,
  },
  scroll: {
    alignItems:  'center',
    paddingTop:  12,
    paddingHorizontal: 20,
    gap: 20,
  },

  // ── Wheel ──────────────────────────────────────────────────────────────────
  wheelContainer: {
    width:          WHEEL_SIZE + 20,
    height:         WHEEL_SIZE + 20,
    alignItems:     'center',
    justifyContent: 'center',
  },
  wheelAnim: {
    width:  WHEEL_SIZE,
    height: WHEEL_SIZE,
  },
  spinGlow: {
    position:     'absolute',
    width:        WHEEL_SIZE + 20,
    height:       WHEEL_SIZE + 20,
    borderRadius: (WHEEL_SIZE + 20) / 2,
    borderWidth:  3,
    borderColor:  '#FFD700',
    opacity:      0.4,
    pointerEvents: 'none',
  },
  pointerWrap: {
    position:   'absolute',
    top:        -6,
    zIndex:     10,
    alignItems: 'center',
  },
  pointer: {
    width:       0,
    height:      0,
    borderLeftWidth:  10,
    borderRightWidth: 10,
    borderTopWidth:   22,
    borderLeftColor:  'transparent',
    borderRightColor: 'transparent',
    borderTopColor:   '#FFD700',
    // Drop shadow
    ...Platform.select({
      ios:     { shadowColor: '#FFD700', shadowOpacity: 0.8, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      default: {},
    }),
  },

  // ── Countdown ─────────────────────────────────────────────────────────────
  countdownCard: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius:   12,
    paddingVertical:   10,
    paddingHorizontal: 18,
  },
  countdownLabel: {
    ...Typography.body,
    color: GameColors.textSecondary,
  },
  countdownValue: {
    ...Typography.semibold,
    color:    GameColors.textWhite,
    fontSize: 16,
    minWidth: 60,
  },
  extraInfo: {
    alignItems: 'center',
  },
  extraInfoText: {
    ...Typography.caption,
    color: GameColors.textSecondary,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  btnRow: {
    flexDirection: 'row',
    gap:           12,
    width:         '100%',
  },
  spinBtn: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    gap:            10,
    paddingVertical:   16,
    paddingHorizontal: 18,
    borderRadius:   16,
  },
  spinBtnFree: {
    backgroundColor: GameColors.accentGreen,
  },
  spinBtnExtra: {
    backgroundColor: GameColors.accentOrange,
  },
  spinBtnDisabled: {
    opacity: 0.45,
  },
  spinBtnLabel: {
    ...Typography.semibold,
    color:    'white',
    fontSize: 15,
  },
  spinBtnSub: {
    ...Typography.caption,
    color:   'rgba(255,255,255,0.75)',
    marginTop: 2,
  },

  // ── Reward table ──────────────────────────────────────────────────────────
  rewardTable: {
    width:           '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius:    16,
    padding:         16,
    gap:             10,
  },
  rewardTableTitle: {
    ...Typography.semibold,
    color:        GameColors.textWhite,
    marginBottom: 4,
  },
  rewardRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            10,
  },
  rewardDot: {
    width:        10,
    height:       10,
    borderRadius: 5,
  },
  rewardName: {
    ...Typography.body,
    color:    GameColors.textWhite,
    flex:     1,
  },
  rewardPct: {
    ...Typography.caption,
    color:     GameColors.accentGold,
    minWidth:  36,
    textAlign: 'right',
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         24,
  },
  modalCard: {
    width:           '100%',
    maxWidth:        340,
    backgroundColor: GameColors.backgroundSecondary,
    borderRadius:    24,
    padding:         28,
    alignItems:      'center',
    gap:             14,
  },
  jackpotBanner: {
    fontSize: 20,
    fontWeight: '800',
    color:    '#FFD700',
    textAlign: 'center',
  },
  modalIcon: {
    width:        88,
    height:       88,
    borderRadius: 44,
    alignItems:     'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...Typography.header,
    color:     GameColors.textWhite,
    textAlign: 'center',
  },
  modalDesc: {
    ...Typography.body,
    color:     GameColors.textSecondary,
    textAlign: 'center',
  },
  modalBtn: {
    backgroundColor: GameColors.accentGold,
    paddingVertical:   14,
    paddingHorizontal: 48,
    borderRadius:    14,
    marginTop:       4,
  },
  modalBtnText: {
    ...Typography.semibold,
    color:    '#0D0D1A',
    fontSize: 16,
  },
});
