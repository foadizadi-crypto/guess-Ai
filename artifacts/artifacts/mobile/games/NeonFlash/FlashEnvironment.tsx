/**
 * FlashEnvironment — midground neon stage: quadrant washes, rings, truss, floor.
 * Decorative only. pointerEvents="none" so pads stay tappable.
 */
import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { TILES } from './config';
import { FlashTone, hexAlpha } from './neonTokens';

function usePulse(lo: number, hi: number, duration: number, delay = 0) {
  const scale = useSharedValue(lo);
  useEffect(() => {
    const id = setTimeout(() => {
      scale.value = withRepeat(
        withTiming(hi, { duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    }, delay);
    return () => clearTimeout(id);
  }, [delay, duration, hi, lo, scale]);
  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}

function QuadrantWash({
  sideX,
  sideY,
  color,
  size,
}: {
  sideX: 'left' | 'right';
  sideY: 'top' | 'bottom';
  color: string;
  size: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        [sideY]: -size * 0.34,
        [sideX]: -size * 0.34,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  );
}

function Ring({ size, color, thickness }: { size: number; color: string; thickness: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: thickness,
        borderColor: color,
        alignSelf: 'center',
        top: '48%',
        marginTop: -size / 2,
      }}
    />
  );
}

function TrussLamp({ x, color, delay }: { x: number; color: string; delay: number }) {
  const pulse = usePulse(0.82, 1.16, 2400 + delay, delay);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: `${x}%`,
          top: 18,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color,
          marginLeft: -5,
        },
        pulse,
      ]}
    />
  );
}

type FlashEnvironmentProps = {
  watching?: boolean;
};

export function FlashEnvironment({ watching = false }: FlashEnvironmentProps) {
  const { width, height } = useWindowDimensions();
  const well = Math.min(width, height) * 0.78;
  const breathe = usePulse(0.96, watching ? 1.07 : 1.04, watching ? 2800 : 4200);
  const core = watching ? 'rgba(34,240,255,0.22)' : 'rgba(255,43,214,0.16)';
  const q = width * 0.72;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <QuadrantWash sideX="left" sideY="top" color={hexAlpha(TILES[0].color, 0.16)} size={q} />
      <QuadrantWash sideX="right" sideY="top" color={hexAlpha(TILES[1].color, 0.16)} size={q} />
      <QuadrantWash sideX="left" sideY="bottom" color={hexAlpha(TILES[2].color, 0.14)} size={q} />
      <QuadrantWash sideX="right" sideY="bottom" color={hexAlpha(TILES[3].color, 0.14)} size={q} />

      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            alignSelf: 'center',
            top: height * 0.24,
            width: well,
            height: well,
            borderRadius: well / 2,
            backgroundColor: core,
          },
          breathe,
        ]}
      />

      <Ring size={well * 0.38} color="rgba(34,240,255,0.28)" thickness={1.5} />
      <Ring size={well * 0.58} color="rgba(255,43,214,0.26)" thickness={2} />
      <Ring size={well * 0.8} color="rgba(196,181,253,0.18)" thickness={1.25} />

      <LinearGradient
        colors={['rgba(196,181,253,0.38)', 'rgba(42,11,92,0.85)', 'rgba(4,1,12,0.0)']}
        style={styles.truss}
        pointerEvents="none"
      />
      <View pointerEvents="none" style={styles.trussBar} />
      <TrussLamp x={18} color={TILES[0].light} delay={0} />
      <TrussLamp x={40} color={TILES[1].light} delay={350} />
      <TrussLamp x={60} color={TILES[2].light} delay={700} />
      <TrussLamp x={82} color={TILES[3].light} delay={1050} />

      <LinearGradient
        colors={['rgba(4,1,12,0)', 'rgba(4,1,12,0.62)']}
        style={styles.floor}
        pointerEvents="none"
      />

      <View pointerEvents="none" style={[styles.node, { left: '10%', top: '22%', backgroundColor: FlashTone.cyan }]} />
      <View pointerEvents="none" style={[styles.node, { right: '12%', top: '18%', backgroundColor: FlashTone.magenta }]} />
      <View pointerEvents="none" style={[styles.node, { left: '14%', bottom: '16%', backgroundColor: TILES[2].light }]} />
      <View pointerEvents="none" style={[styles.node, { right: '10%', bottom: '20%', backgroundColor: TILES[3].light }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  truss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 54,
  },
  trussBar: {
    position: 'absolute',
    top: 22,
    left: '8%',
    right: '8%',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(196,181,253,0.45)',
  },
  floor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
  },
  node: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
