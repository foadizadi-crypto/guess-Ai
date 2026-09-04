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
import { MindTone } from './flipTokens';

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

function Hemisphere({
  side,
  color,
  size,
}: {
  side: 'left' | 'right';
  color: string;
  size: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: '28%',
        [side]: -size * 0.28,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
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
  const pulse = usePulse(0.86, 1.12, 2800 + delay, delay);
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

type MindEnvironmentProps = {
  urgency?: boolean;
};

export function MindEnvironment({ urgency = false }: MindEnvironmentProps) {
  const { width, height } = useWindowDimensions();
  const well = Math.min(width, height) * 0.72;
  const breathe = usePulse(0.96, 1.05, 4200);
  const core = urgency ? 'rgba(244,63,94,0.22)' : 'rgba(124,77,255,0.2)';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Hemisphere side="left" color={urgency ? 'rgba(52,211,153,0.08)' : 'rgba(52,211,153,0.16)'} size={width * 0.7} />
      <Hemisphere side="right" color={urgency ? 'rgba(244,63,94,0.18)' : 'rgba(244,63,94,0.14)'} size={width * 0.7} />

      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            alignSelf: 'center',
            top: height * 0.22,
            width: well,
            height: well,
            borderRadius: well / 2,
            backgroundColor: core,
          },
          breathe,
        ]}
      />

      <Ring size={well * 0.42} color="rgba(34,211,238,0.22)" thickness={1.5} />
      <Ring size={well * 0.62} color="rgba(167,139,250,0.28)" thickness={2} />
      <Ring size={well * 0.84} color="rgba(124,77,255,0.2)" thickness={1.25} />

      <LinearGradient
        colors={['rgba(7,4,20,0)', 'rgba(7,4,20,0.55)']}
        style={styles.floor}
        pointerEvents="none"
      />

      <Node x={12} y={22} size={7} color={MindTone.cyan} delay={0} />
      <Node x={82} y={18} size={6} color={MindTone.metal} delay={400} />
      <Node x={18} y={68} size={8} color={MindTone.greenHot} delay={800} />
      <Node x={78} y={72} size={7} color={MindTone.redHot} delay={1200} />
      <Node x={48} y={12} size={5} color={MindTone.metalHot} delay={600} />
    </View>
  );
}

const styles = StyleSheet.create({
  floor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '28%',
  },
});
