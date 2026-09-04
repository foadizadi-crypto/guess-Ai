/**
 * SpyEnvironment — dual CRT wells, lattice, scan rings.
 * Decorative only. Never targets a grid cell.
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
import { SpyTone } from './glitchTokens';

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

function MonitorGhost({ top, width, height }: { top: number; width: number; height: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        alignSelf: 'center',
        top,
        width,
        height,
        borderRadius: 18,
        borderWidth: 1.25,
        borderColor: 'rgba(52,245,197,0.16)',
        backgroundColor: 'rgba(6,24,32,0.28)',
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
        top: '50%',
        marginTop: -size / 2,
      }}
    />
  );
}

function Node({
  x,
  y,
  size,
  color,
  delay,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
}) {
  const pulse = usePulse(0.86, 1.14, 2600 + delay, delay);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        pulse,
      ]}
    />
  );
}

type SpyEnvironmentProps = {
  urgency?: boolean;
};

export function SpyEnvironment({ urgency = false }: SpyEnvironmentProps) {
  const { width, height } = useWindowDimensions();
  const well = Math.min(width, height) * 0.7;
  const breathe = usePulse(0.96, 1.04, 4800);
  const ghostW = Math.min(width * 0.72, 320);
  const ghostH = Math.min(height * 0.18, 148);
  const core = urgency ? 'rgba(251,113,133,0.16)' : 'rgba(34,211,238,0.14)';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: width * 0.08,
          top: height * 0.12,
          width: width * 0.84,
          height: height * 0.76,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: 'rgba(52,245,197,0.08)',
        }}
      />

      <MonitorGhost top={height * 0.28} width={ghostW} height={ghostH} />
      <MonitorGhost top={height * 0.52} width={ghostW} height={ghostH} />

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

      <Ring size={well * 0.4} color="rgba(52,245,197,0.2)" thickness={1.5} />
      <Ring size={well * 0.62} color="rgba(34,211,238,0.22)" thickness={1.75} />
      <Ring size={well * 0.86} color="rgba(14,116,144,0.2)" thickness={1.25} />

      <LinearGradient
        colors={['rgba(3,8,12,0)', 'rgba(3,8,12,0.62)']}
        style={styles.floor}
        pointerEvents="none"
      />

      <Node x={10} y={18} size={6} color={SpyTone.phosphor} delay={0} />
      <Node x={86} y={16} size={5} color={SpyTone.cyan} delay={400} />
      <Node x={12} y={74} size={7} color={SpyTone.cyanHot} delay={800} />
      <Node x={84} y={78} size={6} color={SpyTone.phosphorHot} delay={1200} />
      <Node x={48} y={10} size={5} color={SpyTone.steel} delay={600} />
    </View>
  );
}

const styles = StyleSheet.create({
  floor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '26%',
  },
});
