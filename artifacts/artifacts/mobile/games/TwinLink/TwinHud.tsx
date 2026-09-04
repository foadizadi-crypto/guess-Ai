import React, { useEffect } from 'react';
import { StyleSheet, Text, View, type FlexStyle, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { TwinTone } from './twinTokens';

function TwinStud({ size, cyan, style }: { size: number; cyan: boolean; style?: ViewStyle }) {
  const pit = Math.max(1.6, size * 0.34);
  return (
    <View pointerEvents="none" style={[styles.studSeat, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <LinearGradient
        colors={cyan ? [TwinTone.cyanHot, TwinTone.cyan, TwinTone.cyanDeep] : [TwinTone.roseHot, TwinTone.rose, TwinTone.roseDeep]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.studFill}
      >
        <View style={[styles.studPit, { width: pit, height: pit, borderRadius: pit / 2 }]} />
      </LinearGradient>
    </View>
  );
}

function CornerTick({ size, thick, corner }: { size: number; thick: number; corner: 'tl' | 'tr' | 'bl' | 'br' }) {
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
  const a = fromLeft ? TwinTone.cyanHot : TwinTone.roseHot;
  const b = fromLeft ? TwinTone.cyanDeep : TwinTone.roseDeep;
  return (
    <View pointerEvents="none" style={[styles.tickSeat, { width: size, height: size }, pos]}>
      <LinearGradient
        colors={[a, b]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.tickBar, { height: thick, left: 0, right: 0 }, fromTop ? { top: 0 } : { bottom: 0 }]}
      />
      <LinearGradient
        colors={fromTop ? [TwinTone.cyanHot, TwinTone.roseDeep] : [TwinTone.roseDeep, TwinTone.cyanHot]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.tickBar, { width: thick, top: 0, bottom: 0 }, fromLeft ? { left: 0 } : { right: 0 }]}
      />
    </View>
  );
}

function LinkGem({ compact }: { compact?: boolean }) {
  const gem = compact ? 5 : 7;
  return (
    <View style={[styles.linkRow, compact && styles.linkRowCompact]}>
      <LinearGradient
        colors={['transparent', 'rgba(94,234,212,0.22)', 'rgba(94,234,212,0.78)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.linkArm}
      />
      <View style={[styles.gemSeat, { width: gem + 4, height: gem + 4 }]}>
        <View style={[styles.gem, { width: gem, height: gem }]}>
          <LinearGradient
            colors={[TwinTone.cyanHot, TwinTone.link, TwinTone.rose]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.gemFill}
          />
        </View>
      </View>
      <LinearGradient
        colors={['rgba(240,171,252,0.78)', 'rgba(240,171,252,0.22)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.linkArm}
      />
    </View>
  );
}

function ChromeWell({
  label,
  value,
  compact,
  inline,
  contentDir,
  style,
}: {
  label: string;
  value: React.ReactNode;
  compact?: boolean;
  inline?: boolean;
  contentDir?: FlexStyle['flexDirection'];
  style?: ViewStyle;
}) {
  const stud = compact ? 4.5 : 6.5;
  const tick = compact ? 8 : 12;
  const tickThick = compact ? 1.75 : 2.2;
  const inset = compact ? 2.5 : 3.5;
  const kicker = compact ? styles.kickerCompact : styles.kicker;

  return (
    <View style={[styles.plateWrap, compact && styles.plateWrapCompact, style]}>
      <View pointerEvents="none" style={[styles.halo, compact && styles.haloCompact]} />
      <LinearGradient
        colors={[TwinTone.cyanHot, TwinTone.link, TwinTone.rose, TwinTone.link, TwinTone.cyanHot]}
        locations={[0, 0.22, 0.5, 0.78, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.bezel, compact && styles.bezelCompact]}
      >
        <LinearGradient
          colors={['rgba(167,243,208,0.5)', 'rgba(40,20,70,0.94)', 'rgba(240,171,252,0.32)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.lip, compact && styles.lipCompact]}
        >
          <LinearGradient
            colors={['rgba(28,16,52,0.97)', 'rgba(10,6,22,0.98)', 'rgba(18,10,32,0.97)']}
            locations={[0, 0.45, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.well, compact && styles.wellCompact]}
          >
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(167,243,208,0.5)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.hairTop}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(240,171,252,0.22)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.hairLeft}
            />
            {inline ? (
              <View style={[styles.inlineRow, contentDir ? { flexDirection: contentDir } : null]}>
                <Text style={kicker}>{label}</Text>
                <LinkGem compact={compact} />
                {value}
              </View>
            ) : (
              <View style={styles.stackInner}>
                <Text style={[kicker, styles.kickerCenter]}>{label}</Text>
                <LinkGem compact={compact} />
                {value}
              </View>
            )}
          </LinearGradient>
        </LinearGradient>
      </LinearGradient>
      <CornerTick size={tick} thick={tickThick} corner="tl" />
      <CornerTick size={tick} thick={tickThick} corner="tr" />
      <CornerTick size={tick} thick={tickThick} corner="bl" />
      <CornerTick size={tick} thick={tickThick} corner="br" />
      <TwinStud size={stud} cyan style={{ top: inset, left: inset }} />
      <TwinStud size={stud} cyan={false} style={{ top: inset, right: inset }} />
      <TwinStud size={stud} cyan style={{ bottom: inset, left: inset }} />
      <TwinStud size={stud} cyan={false} style={{ bottom: inset, right: inset }} />
    </View>
  );
}

function LinkChannel({ ratio, compact }: { ratio: number; compact?: boolean }) {
  const fill = useSharedValue(ratio);
  useEffect(() => {
    fill.value = withTiming(ratio, { duration: 220 });
  }, [fill, ratio]);
  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.round(Math.min(1, Math.max(0, fill.value)) * 100)}%` as `${number}%`,
  }));

  return (
    <LinearGradient
      colors={[TwinTone.cyanHot, TwinTone.link, TwinTone.rose]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.channel, compact && styles.channelCompact]}
    >
      <View style={styles.channelWell}>
        <Animated.View style={[styles.channelFillWrap, fillStyle]}>
          <LinearGradient
            colors={[TwinTone.cyan, TwinTone.link, TwinTone.roseHot]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.channelFill}
          />
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

function ChannelPlate({ ratio, compact }: { ratio: number; compact?: boolean }) {
  const stud = compact ? 4 : 5.5;
  return (
    <View style={[styles.plateWrap, compact && styles.plateWrapCompact]}>
      <View pointerEvents="none" style={[styles.halo, compact && styles.haloCompact]} />
      <LinearGradient
        colors={[TwinTone.cyanHot, TwinTone.link, TwinTone.rose]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.bezel, compact && styles.bezelCompact]}
      >
        <LinearGradient
          colors={['rgba(28,16,52,0.97)', 'rgba(10,6,22,0.98)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.channelPlateWell, compact && styles.channelPlateWellCompact]}
        >
          <LinkChannel ratio={ratio} compact={compact} />
        </LinearGradient>
      </LinearGradient>
      <TwinStud size={stud} cyan style={{ top: 3, left: 6 }} />
      <TwinStud size={stud} cyan={false} style={{ top: 3, right: 6 }} />
    </View>
  );
}

type TwinHudProps = {
  pairsFound: number;
  maxRounds: number;
  moves: number;
  pairRatio: number;
  rowStyle: ViewStyle;
  compact?: boolean;
};

export function TwinHud({
  pairsFound,
  maxRounds,
  moves,
  pairRatio,
  rowStyle,
  compact = false,
}: TwinHudProps) {
  const valueStyle = compact ? styles.valueCompact : styles.value;
  const contentDir = rowStyle.flexDirection;

  return (
    <View style={[styles.stack, compact && styles.stackCompact]}>
      <View style={[styles.row, compact && styles.rowCompact, rowStyle]}>
        <ChromeWell
          label="Pairs"
          compact={compact}
          inline={compact}
          contentDir={contentDir}
          style={styles.chip}
          value={
            <Text style={valueStyle} numberOfLines={1}>
              {pairsFound} of {maxRounds}
            </Text>
          }
        />
        <ChromeWell
          label="Moves"
          compact={compact}
          inline={compact}
          contentDir={contentDir}
          style={styles.chip}
          value={
            <Text style={[valueStyle, { color: TwinTone.roseHot }]} numberOfLines={1}>
              {moves}
            </Text>
          }
        />
      </View>
      <ChannelPlate ratio={pairRatio} compact={compact} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { width: '100%', gap: 8, flexShrink: 0 },
  stackCompact: { gap: 5 },
  row: { width: '100%', gap: 8 },
  rowCompact: { gap: 5 },
  chip: { flex: 1, minWidth: 0 },
  plateWrap: {
    position: 'relative',
    shadowColor: TwinTone.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 12,
    elevation: 9,
  },
  plateWrapCompact: {
    shadowRadius: 8,
    elevation: 7,
  },
  halo: {
    position: 'absolute',
    top: -5,
    right: -4,
    bottom: -5,
    left: -4,
    borderRadius: 18,
    backgroundColor: 'rgba(94,234,212,0.16)',
  },
  haloCompact: {
    top: -3,
    right: -2,
    bottom: -3,
    left: -2,
    borderRadius: 14,
    backgroundColor: 'rgba(240,171,252,0.14)',
  },
  bezel: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  bezelCompact: {
    borderRadius: 11,
  },
  lip: {
    margin: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  lipCompact: {
    margin: 1,
    borderRadius: 9,
  },
  well: {
    margin: 2.5,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  wellCompact: {
    margin: 2,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 7,
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
  stackInner: {
    alignItems: 'center',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  tickSeat: {
    position: 'absolute',
  },
  tickBar: {
    position: 'absolute',
  },
  studSeat: {
    position: 'absolute',
    overflow: 'hidden',
  },
  studFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studPit: {
    backgroundColor: 'rgba(10,6,18,0.82)',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    height: 10,
    marginVertical: 2,
    gap: 4,
  },
  linkRowCompact: {
    height: 8,
    marginVertical: 0,
    gap: 3,
    flex: 1,
    minWidth: 10,
    alignSelf: 'auto',
  },
  linkArm: {
    flex: 1,
    height: 1.5,
  },
  gemSeat: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gem: {
    transform: [{ rotate: '45deg' }],
    overflow: 'hidden',
  },
  gemFill: {
    flex: 1,
  },
  kicker: {
    color: TwinTone.mute,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: 'Inter_600SemiBold',
  },
  kickerCenter: {
    textAlign: 'center',
  },
  kickerCompact: {
    color: TwinTone.mute,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 0,
  },
  value: {
    color: TwinTone.ink,
    fontSize: 21,
    lineHeight: 26,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(94,234,212,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  valueCompact: {
    color: TwinTone.ink,
    fontSize: 13,
    lineHeight: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    flexShrink: 1,
    textShadowColor: 'rgba(240,171,252,0.28)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  channel: {
    height: 7,
    borderRadius: 4,
    padding: 1.5,
    overflow: 'hidden',
  },
  channelCompact: {
    height: 5,
    borderRadius: 3,
    padding: 1,
  },
  channelWell: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: 'rgba(8,5,16,0.94)',
    overflow: 'hidden',
  },
  channelFillWrap: {
    height: '100%',
  },
  channelFill: {
    height: '100%',
    borderRadius: 2,
  },
  channelPlateWell: {
    margin: 1.5,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  channelPlateWellCompact: {
    margin: 1,
    borderRadius: 9,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
});
