import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import type { CountQuickShapeId } from './config';
import { CountQuickShape } from './shapes';

type CountChipProps = {
  shape: CountQuickShapeId;
  color: string;
  size: number;
  index: number;
};

export function CountChip({ shape, color, size, index }: CountChipProps) {
  const enter = useSharedValue(0);
  const tilt = ((index * 37) % 11) - 5;

  useEffect(() => {
    enter.value = 0;
    enter.value = withDelay(index * 38, withSpring(1, { damping: 14, stiffness: 240, mass: 0.7 }));
  }, [enter, index, shape, color]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.72 + enter.value * 0.28 }, { rotate: `${tilt}deg` }],
    opacity: 0.2 + enter.value * 0.8,
  }));

  return (
    <View style={[styles.slot, { width: size + 10, height: size + 10 }]}>
      <View pointerEvents="none" style={[styles.shadow, { width: size * 0.72, height: 8 }]} />
      <Animated.View style={[{ width: size, height: size }, style]}>
        <CountQuickShape shape={shape} color={color} size={size} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    position: 'absolute',
    bottom: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(4,10,16,0.45)',
  },
});
