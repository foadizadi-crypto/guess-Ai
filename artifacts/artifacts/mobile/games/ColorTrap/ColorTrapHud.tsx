import React, { useEffect } from 'react';
import { StyleSheet, Text, View, type FlexStyle, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { TrapTone } from './trapTokens';

type ColorTrapHudProps = {
  round: number;
  maxRounds: number;
  score: number;
  timeLeft: number;
  timeRatio: number;
  rowStyle: ViewStyle;
  glow: boolean;
};

function HexPip({ size, style }: { size: number; style?: ViewStyle }) {
  const pit = Math.max(1.5, size * 0.32);
  return (
    <View pointerEvents="none" style={[styles.pipSeat, { width: size, height: size }, style]}>
      <LinearGradient
        colors={[TrapTone.chromeHot, TrapTone.cyan, TrapTone.magentaDeep]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.pipFill}
      >
        <View style={[styles.pipPit, { width: pit, height: pit, borderRadius: pit / 2 }]} />
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
  const bar = fromLeft ? TrapTone.magentaHot : TrapTone.cyanHot;
  return (
    <View pointerEvents="none" style={[styles.tickSeat, { width: size, height: size }, pos]}>
      <LinearGradient
        colors={fromLeft ? [bar, TrapTone.chromeDeep] : [TrapTone.chromeDeep, bar]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.tickBar, { height: thick, left: 0, right: 0 }, fromTop ? { top: 0 } : { bottom: 0 }]}
      />
      <LinearGradient
        colors={fromTop ? [TrapTone.chromeHot, TrapTone.chromeDeep] : [TrapTone.chromeDeep, TrapTone.chromeHot]}
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
        colors={['transparent', 'rgba(255,45,149,0.35)', 'rgba(255,122,195,0.85)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.splitArm}
      />
      <View style={styles.diamond}>
        <LinearGradient
          colors={[TrapTone.magentaHot, TrapTone.cyan, TrapTone.chromeDeep]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.diamondFill}
        />
      </View>
      <LinearGradient
        colors={['rgba(34,211,238,0.85)', 'rgba(34,211,238,0.3)', 'transparent']}
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
  accent = TrapTone.cyan,
  glow,
  contentDir,
  urgent = false,
}: {
  label: string;
  value: React.ReactNode;
  extra?: React.ReactNode;
  style?: ViewStyle;
  accent?: string;
  glow: boolean;
  contentDir?: FlexStyle['flexDirection'];
  urgent?: boolean;
}) {
  return (
    <View style={[styles.plateWrap, style]}>
      <View pointerEvents="none" style={[styles.halo, glow && styles.haloLit, urgent && styles.haloUrgent]} />
      <LinearGradient
        colors={[TrapTone.chromeHot, accent, TrapTone.chromeDeep, accent, TrapTone.chromeHot]}
        locations={[0, 0.16, 0.5, 0.84, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bezel}
      >
        <LinearGradient
          colors={['rgba(242,245,255,0.48)', 'rgba(28,12,42,0.95)', 'rgba(34,211,238,0.26)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.lip}
        >
          <LinearGradient
            colors={['rgba(18,10,32,0.97)', 'rgba(8,4,16,0.98)', 'rgba(14,8,28,0.97)']}
            locations={[0, 0.42, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.well}
          >
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(255,122,195,0.55)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.hairMag}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['transparent', 'rgba(34,211,238,0.5)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.hairCyan}
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
      <CornerTick size={12} thick={2} corner="tl" />
      <CornerTick size={12} thick={2} corner="tr" />
      <CornerTick size={12} thick={2} corner="bl" />
      <CornerTick size={12} thick={2} corner="br" />
      <HexPip size={6} style={{ top: 3.5, left: 3.5 }} />
      <HexPip size={6} style={{ top: 3.5, right: 3.5 }} />
      <HexPip size={6} style={{ bottom: 3.5, left: 3.5 }} />
      <HexPip size={6} style={{ bottom: 3.5, right: 3.5 }} />
    </View>
  );
}

function TimeChannel({ ratio }: { ratio: number }) {
  const fill = useSharedValue(ratio);

  useEffect(() => {
    fill.value = withTiming(ratio, { duration: 90, easing: Easing.linear });
  }, [fill, ratio]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${(fill.value * 100).toFixed(2)}%` as `${number}%`,
    backgroundColor: interpolateColor(
      fill.value,
      [0, 0.28, 1],
      [TrapTone.magenta, TrapTone.violet, TrapTone.cyan],
    ),
  }));

  return (
    <LinearGradient
      colors={[TrapTone.chromeHot, TrapTone.chrome, TrapTone.chromeDeep, TrapTone.chrome]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.channel}
    >
      <View style={styles.channelWell}>
        <Animated.View style={[styles.channelFill, barStyle]} />
      </View>
    </LinearGradient>
  );
}

export function ColorTrapHud({
  round,
  maxRounds,
  score,
  timeLeft,
  timeRatio,
  rowStyle,
  glow,
}: ColorTrapHudProps) {
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
          accent={TrapTone.cyan}
          value={
            <Text style={[styles.value, { color: TrapTone.cyanHot }]} numberOfLines={1}>
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
        accent={urgent ? TrapTone.magenta : TrapTone.cyan}
        urgent={urgent}
        extra={<TimeChannel ratio={timeRatio} />}
        value={
          <Text style={[styles.value, { color: urgent ? TrapTone.magentaHot : TrapTone.ink }]} numberOfLines={1}>
            {timeLeft.toFixed(1)}s
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
    shadowColor: TrapTone.magenta,
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
    backgroundColor: 'rgba(139,92,246,0.18)',
  },
  haloLit: {
    backgroundColor: 'rgba(34,211,238,0.28)',
  },
  haloUrgent: {
    backgroundColor: 'rgba(255,45,149,0.34)',
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
  hairMag: {
    position: 'absolute',
    top: 2,
    left: 10,
    width: '38%',
    height: 1.5,
  },
  hairCyan: {
    position: 'absolute',
    top: 2,
    right: 10,
    width: '38%',
    height: 1.5,
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
  pipSeat: {
    position: 'absolute',
    overflow: 'hidden',
    transform: [{ rotate: '45deg' }],
  },
  pipFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipPit: {
    backgroundColor: 'rgba(8,4,16,0.84)',
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
    color: TrapTone.mute,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 0,
  },
  value: {
    color: TrapTone.ink,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    flexShrink: 1,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(34,211,238,0.35)',
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
    backgroundColor: 'rgba(8,4,16,0.94)',
    overflow: 'hidden',
  },
  channelFill: {
    height: '100%',
    borderRadius: 2,
  },
});
