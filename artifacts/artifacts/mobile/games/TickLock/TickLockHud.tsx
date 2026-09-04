import React from 'react';
import { StyleSheet, Text, View, type DimensionValue, type FlexStyle, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TickTone } from './tickTokens';

type TickLockHudProps = {
  round: number;
  maxRounds: number;
  score: number;
  targetTime: number;
  rowStyle: ViewStyle;
  glow: boolean;
};

function Rivet({ size, style }: { size: number; style?: ViewStyle }) {
  const pit = Math.max(1.6, size * 0.34);
  return (
    <View pointerEvents="none" style={[styles.rivetSeat, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <LinearGradient
        colors={[TickTone.steelHot, TickTone.steel, TickTone.steelDeep]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.rivetFill}
      >
        <View style={[styles.rivetPit, { width: pit, height: pit, borderRadius: pit / 2 }]} />
      </LinearGradient>
    </View>
  );
}

function CornerTick({
  size,
  thick,
  corner,
}: {
  size: number;
  thick: number;
  corner: 'tl' | 'tr' | 'bl' | 'br';
}) {
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
    <View pointerEvents="none" style={[styles.tickSeat, { width: size, height: size }, pos]}>
      <LinearGradient
        colors={fromLeft ? [TickTone.tick, TickTone.steelDeep] : [TickTone.steelDeep, TickTone.tick]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.tickBar, { height: thick, left: 0, right: 0 }, fromTop ? { top: 0 } : { bottom: 0 }]}
      />
      <LinearGradient
        colors={fromTop ? [TickTone.steelHot, TickTone.steelDeep] : [TickTone.steelDeep, TickTone.steelHot]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.tickBar, { width: thick, top: 0, bottom: 0 }, fromLeft ? { left: 0 } : { right: 0 }]}
      />
    </View>
  );
}

function SplitLine() {
  return (
    <View style={styles.split}>
      <LinearGradient
        colors={['transparent', 'rgba(94,234,212,0.28)', 'rgba(139,164,184,0.8)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.splitArm}
      />
      <View style={styles.diamond}>
        <LinearGradient
          colors={[TickTone.tickHot, TickTone.steel, TickTone.steelDeep]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.diamondFill}
        />
      </View>
      <LinearGradient
        colors={['rgba(139,164,184,0.8)', 'rgba(94,234,212,0.28)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.splitArm}
      />
    </View>
  );
}

function GaugePlate({
  label,
  value,
  extra,
  style,
  accent = TickTone.steel,
  glow,
  contentDir,
}: {
  label: string;
  value: React.ReactNode;
  extra?: React.ReactNode;
  style?: ViewStyle;
  accent?: string;
  glow: boolean;
  contentDir?: FlexStyle['flexDirection'];
}) {
  return (
    <View style={[styles.plateWrap, style]}>
      <View pointerEvents="none" style={[styles.halo, glow && styles.haloLit]} />
      <LinearGradient
        colors={[TickTone.steelHot, accent, TickTone.steelDeep, accent, TickTone.steelHot]}
        locations={[0, 0.16, 0.5, 0.84, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bezel}
      >
        <LinearGradient
          colors={['rgba(232,242,248,0.5)', 'rgba(28,44,58,0.95)', 'rgba(94,234,212,0.26)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.lip}
        >
          <LinearGradient
            colors={['rgba(12,20,32,0.97)', 'rgba(5,8,15,0.98)', 'rgba(10,18,28,0.97)']}
            locations={[0, 0.42, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.well}
          >
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(232,242,248,0.5)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.hairTop}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(94,234,212,0.26)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.hairLeft}
            />
            <View style={[styles.inlineRow, contentDir ? { flexDirection: contentDir } : null]}>
              <Text style={styles.kicker}>{label}</Text>
              <View style={styles.splitFlex}>
                <SplitLine />
              </View>
              {value}
            </View>
            {extra}
          </LinearGradient>
        </LinearGradient>
      </LinearGradient>
      <CornerTick size={11} thick={2} corner="tl" />
      <CornerTick size={11} thick={2} corner="tr" />
      <CornerTick size={11} thick={2} corner="bl" />
      <CornerTick size={11} thick={2} corner="br" />
      <Rivet size={6} style={{ top: 3.5, left: 3.5 }} />
      <Rivet size={6} style={{ top: 3.5, right: 3.5 }} />
      <Rivet size={6} style={{ bottom: 3.5, left: 3.5 }} />
      <Rivet size={6} style={{ bottom: 3.5, right: 3.5 }} />
    </View>
  );
}

function RoundChannel({ ratio }: { ratio: number }) {
  const fill: DimensionValue = `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`;
  return (
    <LinearGradient
      colors={[TickTone.steelHot, TickTone.steel, TickTone.steelDeep, TickTone.steel]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.channel}
    >
      <View style={styles.channelWell}>
        <LinearGradient
          colors={[TickTone.tickDeep, TickTone.tick, TickTone.tickHot]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.channelFill, { width: fill }]}
        />
      </View>
    </LinearGradient>
  );
}

export function TickLockHud({ round, maxRounds, score, targetTime, rowStyle, glow }: TickLockHudProps) {
  const contentDir = rowStyle.flexDirection;
  const roundRatio = maxRounds > 0 ? Math.min(1, round / maxRounds) : 0;

  return (
    <View style={styles.stack}>
      <View style={[styles.row, rowStyle]}>
        <GaugePlate
          label="Round"
          glow={glow}
          contentDir={contentDir}
          style={styles.chip}
          extra={<RoundChannel ratio={roundRatio} />}
          value={
            <Text style={styles.value} numberOfLines={1}>
              {round} of {maxRounds}
            </Text>
          }
        />
        <GaugePlate
          label="Score"
          glow={glow}
          contentDir={contentDir}
          style={styles.chip}
          accent={TickTone.brass}
          value={
            <Text style={[styles.value, { color: TickTone.brassHot }]} numberOfLines={1}>
              {score}
            </Text>
          }
        />
      </View>
      <GaugePlate
        label="Target"
        glow={glow}
        contentDir={contentDir}
        style={styles.targetPlate}
        accent={TickTone.tick}
        value={
          <Text style={[styles.value, { color: TickTone.tickHot }]} numberOfLines={1}>
            {targetTime.toFixed(2)}s
          </Text>
        }
        extra={<Text style={styles.hint}>Stop the clock on that mark.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { width: '100%', gap: 8, flexShrink: 0 },
  row: { width: '100%', gap: 8 },
  chip: { flex: 1, minWidth: 0 },
  targetPlate: { width: '100%' },
  plateWrap: {
    position: 'relative',
    shadowColor: TickTone.tick,
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
    backgroundColor: 'rgba(94,234,212,0.16)',
  },
  haloLit: {
    backgroundColor: 'rgba(94,234,212,0.3)',
  },
  bezel: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  lip: {
    margin: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  well: {
    margin: 2.5,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  hairTop: {
    position: 'absolute',
    top: 2,
    left: 10,
    right: 10,
    height: 1.5,
  },
  hairLeft: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: 3,
    width: 1.25,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  splitFlex: {
    flex: 1,
    minWidth: 10,
  },
  tickSeat: {
    position: 'absolute',
  },
  tickBar: {
    position: 'absolute',
  },
  rivetSeat: {
    position: 'absolute',
    overflow: 'hidden',
  },
  rivetFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rivetPit: {
    backgroundColor: 'rgba(5,8,15,0.84)',
  },
  split: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 8,
    gap: 3,
  },
  splitArm: {
    flex: 1,
    height: 1.5,
  },
  diamond: {
    width: 7,
    height: 7,
    transform: [{ rotate: '45deg' }],
    overflow: 'hidden',
  },
  diamondFill: {
    flex: 1,
  },
  kicker: {
    color: TickTone.mute,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 0,
  },
  value: {
    color: TickTone.ink,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    flexShrink: 1,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(94,234,212,0.32)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  hint: {
    color: TickTone.mute,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 6,
    fontFamily: 'Inter_500Medium',
  },
  channel: {
    marginTop: 6,
    height: 6,
    borderRadius: 4,
    padding: 1.25,
    overflow: 'hidden',
  },
  channelWell: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: 'rgba(5,8,15,0.94)',
    overflow: 'hidden',
  },
  channelFill: {
    height: '100%',
    borderRadius: 2,
  },
});
