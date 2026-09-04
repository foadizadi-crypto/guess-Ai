import React from 'react';
import { StyleSheet, Text, View, type DimensionValue, type FlexStyle, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashTone } from './neonTokens';

type NeonFlashHudProps = {
  round: number;
  maxRounds: number;
  watching: boolean;
  roundRatio: number;
  rowStyle: ViewStyle;
  glow: boolean;
};

function CircuitNode({ size, style }: { size: number; style?: ViewStyle }) {
  const pit = Math.max(1.6, size * 0.34);
  return (
    <View pointerEvents="none" style={[styles.nodeSeat, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <LinearGradient
        colors={[FlashTone.metalHot, FlashTone.metal, FlashTone.metalDeep]}
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
        colors={fromLeft ? [FlashTone.cyan, FlashTone.metalDeep] : [FlashTone.metalDeep, FlashTone.cyan]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.tickBar, { height: thick, left: 0, right: 0 }, fromTop ? { top: 0 } : { bottom: 0 }]}
      />
      <LinearGradient
        colors={fromTop ? [FlashTone.magentaHot, FlashTone.metalDeep] : [FlashTone.metalDeep, FlashTone.magentaHot]}
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
        colors={['transparent', 'rgba(34,240,255,0.28)', 'rgba(255,43,214,0.8)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.splitArm}
      />
      <View style={styles.diamond}>
        <LinearGradient
          colors={[FlashTone.cyan, FlashTone.magenta, FlashTone.metalDeep]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.diamondFill}
        />
      </View>
      <LinearGradient
        colors={['rgba(255,43,214,0.8)', 'rgba(34,240,255,0.28)', 'transparent']}
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
  accent = FlashTone.metal,
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
        colors={[FlashTone.metalHot, accent, FlashTone.metalDeep, accent, FlashTone.metalHot]}
        locations={[0, 0.16, 0.5, 0.84, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bezel}
      >
        <LinearGradient
          colors={['rgba(243,232,255,0.5)', 'rgba(42,11,92,0.95)', 'rgba(34,240,255,0.28)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.lip}
        >
          <LinearGradient
            colors={['rgba(18,8,40,0.97)', 'rgba(6,2,16,0.98)', 'rgba(16,6,36,0.97)']}
            locations={[0, 0.42, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.well}
          >
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(243,232,255,0.55)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.hairTop}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(34,240,255,0.28)', 'transparent']}
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

function RoundChannel({ ratio, watching }: { ratio: number; watching: boolean }) {
  const fill: DimensionValue = `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`;
  return (
    <LinearGradient
      colors={[FlashTone.metalHot, FlashTone.metal, FlashTone.metalDeep, FlashTone.metal]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.channel}
    >
      <View style={styles.channelWell}>
        <LinearGradient
          colors={watching ? [FlashTone.watch, FlashTone.cyan] : [FlashTone.cyan, FlashTone.magenta]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.channelFill, { width: fill }]}
        />
      </View>
    </LinearGradient>
  );
}

export function NeonFlashHud({
  round,
  maxRounds,
  watching,
  roundRatio,
  rowStyle,
  glow,
}: NeonFlashHudProps) {
  const contentDir = rowStyle.flexDirection;

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
          label="Phase"
          glow={glow}
          contentDir={contentDir}
          style={styles.chip}
          accent={watching ? FlashTone.watch : FlashTone.play}
          value={
            <Text
              style={[styles.value, { color: watching ? FlashTone.watch : FlashTone.play }]}
              numberOfLines={1}
            >
              {watching ? 'Watch' : 'Repeat'}
            </Text>
          }
        />
      </View>
      <ChromePlate
        label="Stage"
        glow={glow}
        contentDir={contentDir}
        style={styles.stagePlate}
        accent={watching ? FlashTone.cyan : FlashTone.magenta}
        extra={<RoundChannel ratio={roundRatio} watching={watching} />}
        value={
          <Text style={styles.value} numberOfLines={1}>
            {Math.round(Math.min(1, Math.max(0, roundRatio)) * 100)}%
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
  stagePlate: { width: '100%' },
  plateWrap: {
    position: 'relative',
    shadowColor: FlashTone.magenta,
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
    backgroundColor: 'rgba(34,240,255,0.16)',
  },
  haloLit: {
    backgroundColor: 'rgba(255,43,214,0.28)',
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
    backgroundColor: 'rgba(6,2,16,0.84)',
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
    color: FlashTone.mute,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 0,
  },
  value: {
    color: FlashTone.ink,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    flexShrink: 1,
    textShadowColor: 'rgba(34,240,255,0.35)',
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
    backgroundColor: 'rgba(6,2,16,0.94)',
    overflow: 'hidden',
  },
  channelFill: {
    height: '100%',
    borderRadius: 2,
  },
});
