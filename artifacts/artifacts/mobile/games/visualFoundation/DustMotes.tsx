import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type DustMotesProps = {
  count: number;
  color?: string;
};

function frac(seed: number): number {
  const n = Math.sin(seed * 127.1) * 43758.5453;
  return n - Math.floor(n);
}

function Mote({ index, color }: { index: number; color: string }) {
  const x = frac(index + 1) * 100;
  const y = frac(index + 8) * 100;
  const size = 1.4 + frac(index + 3) * 2.4;
  const duration = 5200 + frac(index + 5) * 5200;
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withDelay(
      frac(index + 2) * 1800,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [drift, duration, index]);

  const style = useAnimatedStyle(() => ({
    top: `${y + drift.value * -8}%`,
    opacity: 0.12 + drift.value * 0.28,
    transform: [{ translateX: (drift.value - 0.5) * 10 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.mote,
        style,
        {
          left: `${x}%`,
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
        },
      ]}
    />
  );
}

export function DustMotes({ count, color = 'rgba(244,215,138,0.7)' }: DustMotesProps) {
  const motes = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);
  if (count <= 0) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {motes.map((i) => (
        <Mote key={i} index={i} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  mote: {
    position: 'absolute',
  },
});
