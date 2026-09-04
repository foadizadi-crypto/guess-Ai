import React from 'react';
import { StyleSheet, Text, View, type DimensionValue, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SpeedTone } from './speedTokens';

type SpeedCardHudProps = {
  modeLabel: string;
  round: number;
  maxRounds: number;
  score: number;
  timerLabel: string;
  timerColor: string;
  timeRatio: number;
  glow: boolean;
};

function Rivet({ style }: { style?: ViewStyle }) {
  return (
    <View pointerEvents="none" style={[styles.rivet, style]}>
      <LinearGradient
        colors={[SpeedTone.snapHot, SpeedTone.snap, SpeedTone.crimsonDeep]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.rivetFill}
      >
        <View style={styles.rivetPit} />
      </LinearGradient>
    </View>
  );
}

function CornerTick({ corner }: { corner: 'tl' | 'tr' | 'bl' | 'br' }) {
  const pos =
    corner === 'tl'
      ? { top: 1, left: 1 }
      : corner === 'tr'
        ? { top: 1, right: 1 }
        : corner === 'bl'
          ? { bottom: 1, left: 1 }
          : { bottom: 1, right: 1 };
  const fromLeft = corner === 'tl' || corner === 'bl';
  const fromTop = corner === 'tl' || corner === 'tr';
  return (
    <View pointerEvents="none" style={[styles.tickSeat, pos]}>
      <LinearGradient
        colors={fromLeft ? [SpeedTone.ice, SpeedTone.crimsonDeep] : [SpeedTone.crimsonDeep, SpeedTone.snap]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.tickBar, { height: 2, left: 0, right: 0 }, fromTop ? { top: 0 } : { bottom: 0 }]}
      />
      <LinearGradient
        colors={fromTop ? [SpeedTone.snapHot, SpeedTone.crimsonDeep] : [SpeedTone.crimsonDeep, SpeedTone.ice]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.tickBar, { width: 2, top: 0, bottom: 0 }, fromLeft ? { left: 0 } : { right: 0 }]}
      />
    </View>
  );
}

function SplitLine() {
  return (
    <View style={styles.split}>
      <LinearGradient
        colors={['transparent', 'rgba(125,211,252,0.28)', 'rgba(251,191,36,0.8)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.splitArm}
      />
      <View style={styles.diamond}>
        <LinearGradient
          colors={[SpeedTone.ice, SpeedTone.snap, SpeedTone.crimsonDeep]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.diamondFill}
        />
      </View>
      <LinearGradient
        colors={['rgba(251,191,36,0.8)', 'rgba(251,113,133,0.28)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.splitArm}
      />
    </View>
  );
}

function ChromePlate({
  children,
  style,
  glow,
  accent = SpeedTone.ice,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  glow: boolean;
  accent?: string;
}) {
  return (
    <View style={[styles.plateWrap, style]}>
      <View pointerEvents="none" style={[styles.halo, glow && styles.haloLit]} />
      <LinearGradient
        colors={[SpeedTone.snapHot, accent, SpeedTone.crimsonDeep, accent, SpeedTone.snapHot]}
        locations={[0, 0.16, 0.5, 0.84, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bezel}
      >
        <LinearGradient
          colors={['rgba(224,242,254,0.5)', 'rgba(28,10,22,0.95)', 'rgba(125,211,252,0.26)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.lip}
        >
          <LinearGradient
            colors={['rgba(22,10,20,0.97)', 'rgba(8,4,14,0.98)', 'rgba(16,8,18,0.97)']}
            locations={[0, 0.42, 1]}
            style={styles.well}
          >
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(224,242,254,0.5)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.hairTop}
            />
            {children}
          </LinearGradient>
        </LinearGradient>
      </LinearGradient>
      <CornerTick corner="tl" />
      <CornerTick corner="tr" />
      <CornerTick corner="bl" />
      <CornerTick corner="br" />
      <Rivet style={styles.rivetTL} />
      <Rivet style={styles.rivetTR} />
      <Rivet style={styles.rivetBL} />
      <Rivet style={styles.rivetBR} />
    </View>
  );
}

function TimeChannel({ ratio, hot }: { ratio: number; hot: boolean }) {
  const fill: DimensionValue = `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`;
  return (
    <LinearGradient
      colors={[SpeedTone.snapHot, SpeedTone.snap, SpeedTone.crimsonDeep, SpeedTone.snap]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.channel}
    >
      <View style={styles.channelWell}>
        <LinearGradient
          colors={hot ? [SpeedTone.crimson, SpeedTone.crimsonDeep] : [SpeedTone.ice, SpeedTone.snap, SpeedTone.crimson]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.channelFill, { width: fill }]}
        />
      </View>
    </LinearGradient>
  );
}

export function SpeedCardHud({
  modeLabel,
  round,
  maxRounds,
  score,
  timerLabel,
  timerColor,
  timeRatio,
  glow,
}: SpeedCardHudProps) {
  const remaining = Math.max(0, maxRounds - round);
  const hot = timeRatio <= 0.25;

  return (
    <ChromePlate glow={glow} style={styles.full} accent={hot ? SpeedTone.crimson : SpeedTone.ice}>
      <Text style={styles.mode}>{modeLabel}</Text>
      <View style={styles.row}>
        <Text style={[styles.timer, { color: timerColor }]}>{timerLabel}</Text>
        <View style={styles.splitFlex}>
          <SplitLine />
        </View>
        <Text style={styles.kicker}>Round</Text>
        <Text style={styles.value} numberOfLines={1}>
          {round}/{maxRounds}
        </Text>
        <Text style={[styles.value, { color: SpeedTone.snapHot }]} numberOfLines={1}>
          +{score}
        </Text>
      </View>
      <View style={styles.segRow}>
        <LinearGradient
          colors={[SpeedTone.snapHot, SpeedTone.snap]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.segNow, { flex: Math.max(1, round) }]}
        />
        {remaining > 0 ? <View style={[styles.seg, { flex: remaining }]} /> : null}
      </View>
      <TimeChannel ratio={timeRatio} hot={hot} />
    </ChromePlate>
  );
}

const styles = StyleSheet.create({
  full: { width: '100%', flexShrink: 0 },
  mode: {
    color: SpeedTone.mute,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  timer: {
    fontSize: 26,
    lineHeight: 30,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    textShadowColor: 'rgba(125,211,252,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  plateWrap: {
    position: 'relative',
    shadowColor: SpeedTone.ice,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 12,
    elevation: 9,
  },
  halo: {
    position: 'absolute',
    top: -4,
    right: -3,
    bottom: -4,
    left: -3,
    borderRadius: 16,
    backgroundColor: 'rgba(125,211,252,0.16)',
  },
  haloLit: { backgroundColor: 'rgba(125,211,252,0.28)' },
  bezel: { borderRadius: 14, overflow: 'hidden' },
  lip: { margin: 1.5, borderRadius: 12, overflow: 'hidden' },
  well: { margin: 2.5, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 10, overflow: 'hidden' },
  hairTop: {
    position: 'absolute',
    top: 2,
    left: 10,
    right: 10,
    height: 1.5,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  splitFlex: { flex: 1, minWidth: 10 },
  kicker: {
    color: SpeedTone.mute,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontFamily: 'Inter_600SemiBold',
  },
  value: {
    color: SpeedTone.ink,
    fontSize: 15,
    lineHeight: 18,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  split: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 8,
    gap: 3,
  },
  splitArm: { flex: 1, height: 1.5 },
  diamond: {
    width: 7,
    height: 7,
    transform: [{ rotate: '45deg' }],
    overflow: 'hidden',
  },
  diamondFill: { flex: 1 },
  segRow: { flexDirection: 'row', gap: 3, marginTop: 6 },
  seg: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)' },
  segNow: { height: 4, borderRadius: 2 },
  channel: { marginTop: 6, height: 6, borderRadius: 4, padding: 1.25, overflow: 'hidden' },
  channelWell: { flex: 1, borderRadius: 2, backgroundColor: 'rgba(8,4,14,0.94)', overflow: 'hidden' },
  channelFill: { height: '100%', borderRadius: 2 },
  tickSeat: { position: 'absolute', width: 11, height: 11 },
  tickBar: { position: 'absolute' },
  rivet: { position: 'absolute', width: 7, height: 7, borderRadius: 4, overflow: 'hidden' },
  rivetFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rivetPit: { width: 2.4, height: 2.4, borderRadius: 1.2, backgroundColor: 'rgba(8,4,14,0.84)' },
  rivetTL: { top: 3, left: 3 },
  rivetTR: { top: 3, right: 3 },
  rivetBL: { bottom: 3, left: 3 },
  rivetBR: { bottom: 3, right: 3 },
});
