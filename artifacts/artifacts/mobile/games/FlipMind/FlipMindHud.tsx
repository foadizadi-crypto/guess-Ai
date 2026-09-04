import React from 'react';
import { StyleSheet, Text, View, type DimensionValue, type FlexStyle, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MindTone } from './flipTokens';

type FlipMindHudProps = {
  round: number;
  maxRounds: number;
  score: number;
  timeLeft: number;
  timeRatio: number;
  rowStyle: ViewStyle;
  glow: boolean;
};

function CircuitNode({ size, style }: { size: number; style?: ViewStyle }) {
  const pit = Math.max(1.6, size * 0.34);
  return (
    <View pointerEvents="none" style={[styles.nodeSeat, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <LinearGradient
        colors={[MindTone.metalHot, MindTone.metal, MindTone.metalDeep]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.nodeFill}
      >
        <View style={[styles.nodePit, { width: pit, height: pit, borderRadius: pit / 2 }]} />
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
        colors={fromLeft ? [MindTone.cyan, MindTone.metalDeep] : [MindTone.metalDeep, MindTone.cyan]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.tickBar, { height: thick, left: 0, right: 0 }, fromTop ? { top: 0 } : { bottom: 0 }]}
      />
      <LinearGradient
        colors={fromTop ? [MindTone.metalHot, MindTone.metalDeep] : [MindTone.metalDeep, MindTone.metalHot]}
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
        colors={['transparent', 'rgba(34,211,238,0.28)', 'rgba(167,139,250,0.8)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.splitArm}
      />
      <View style={styles.diamond}>
        <LinearGradient
          colors={[MindTone.cyan, MindTone.metal, MindTone.metalDeep]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.diamondFill}
        />
      </View>
      <LinearGradient
        colors={['rgba(167,139,250,0.8)', 'rgba(34,211,238,0.28)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.splitArm}
      />
    </View>
  );
}

function ChromePlate({
  label,
  value,
  extra,
  style,
  accent = MindTone.metal,
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
        colors={[MindTone.metalHot, accent, MindTone.metalDeep, accent, MindTone.metalHot]}
        locations={[0, 0.16, 0.5, 0.84, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bezel}
      >
        <LinearGradient
          colors={['rgba(233,213,255,0.5)', 'rgba(42,18,78,0.95)', 'rgba(34,211,238,0.28)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.lip}
        >
          <LinearGradient
            colors={['rgba(22,12,42,0.97)', 'rgba(8,4,18,0.98)', 'rgba(14,8,32,0.97)']}
            locations={[0, 0.42, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.well}
          >
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(233,213,255,0.55)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.hairTop}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(34,211,238,0.28)', 'transparent']}
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
      <CircuitNode size={6} style={{ top: 3.5, left: 3.5 }} />
      <CircuitNode size={6} style={{ top: 3.5, right: 3.5 }} />
      <CircuitNode size={6} style={{ bottom: 3.5, left: 3.5 }} />
      <CircuitNode size={6} style={{ bottom: 3.5, right: 3.5 }} />
    </View>
  );
}

function TimeChannel({ ratio }: { ratio: number }) {
  const fill: DimensionValue = `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`;
  const hot = ratio <= 0.28;
  return (
    <LinearGradient
      colors={[MindTone.metalHot, MindTone.metal, MindTone.metalDeep, MindTone.metal]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.channel}
    >
      <View style={styles.channelWell}>
        <LinearGradient
          colors={hot ? [MindTone.redHot, MindTone.red] : [MindTone.cyan, MindTone.metal, MindTone.violet]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.channelFill, { width: fill }]}
        />
      </View>
    </LinearGradient>
  );
}

export function FlipMindHud({
  round,
  maxRounds,
  score,
  timeLeft,
  timeRatio,
  rowStyle,
  glow,
}: FlipMindHudProps) {
  const contentDir = rowStyle.flexDirection;
  const urgent = timeLeft <= 1;

  return (
    <View style={styles.stack}>
      <View style={[styles.row, rowStyle]}>
        <ChromePlate
          label="Round"
          glow={glow}
          contentDir={contentDir}
          style={styles.chip}
          value={
            <Text style={styles.value} numberOfLines={1}>
              {round} of {maxRounds}
            </Text>
          }
        />
        <ChromePlate
          label="Score"
          glow={glow}
          contentDir={contentDir}
          style={styles.chip}
          accent={MindTone.cyan}
          value={
            <Text style={[styles.value, { color: MindTone.cyan }]} numberOfLines={1}>
              {score}
            </Text>
          }
        />
      </View>
      <ChromePlate
        label="Time"
        glow={glow}
        contentDir={contentDir}
        style={styles.timePlate}
        accent={urgent ? MindTone.red : MindTone.metal}
        extra={<TimeChannel ratio={timeRatio} />}
        value={
          <Text
            style={[styles.value, { color: urgent ? MindTone.redHot : MindTone.ink }]}
            numberOfLines={1}
          >
            {timeLeft.toFixed(2)}s
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { width: '100%', gap: 8, flexShrink: 0 },
  row: { width: '100%', gap: 8 },
  chip: { flex: 1, minWidth: 0 },
  timePlate: { width: '100%' },
  plateWrap: {
    position: 'relative',
    shadowColor: MindTone.violet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.46,
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
    backgroundColor: 'rgba(124,77,255,0.2)',
  },
  haloLit: {
    backgroundColor: 'rgba(167,139,250,0.32)',
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
  nodeSeat: {
    position: 'absolute',
    overflow: 'hidden',
  },
  nodeFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodePit: {
    backgroundColor: 'rgba(8,4,18,0.84)',
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
    color: MindTone.mute,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 0,
  },
  value: {
    color: MindTone.ink,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    flexShrink: 1,
    textShadowColor: 'rgba(167,139,250,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
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
    backgroundColor: 'rgba(8,4,18,0.94)',
    overflow: 'hidden',
  },
  channelFill: {
    height: '100%',
    borderRadius: 2,
  },
});
