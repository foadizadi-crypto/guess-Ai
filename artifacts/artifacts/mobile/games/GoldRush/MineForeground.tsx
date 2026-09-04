/**
 * MineForeground — corner vignettes, edge dust, dark frame.
 * pointerEvents="none" throughout — must NEVER block card taps.
 * Dust stays near edges so it does not sit on card faces.
 */
import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type CornerProps = {
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  size: number;
};

function CornerVignette({ position, size }: CornerProps) {
  const isTop = position === 'topLeft' || position === 'topRight';
  const isLeft = position === 'topLeft' || position === 'bottomLeft';
  const start = { x: isLeft ? 0 : 1, y: isTop ? 0 : 1 };
  const end = { x: isLeft ? 1 : 0, y: isTop ? 1 : 0 };

  return (
    <LinearGradient
      colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.00)']}
      start={start}
      end={end}
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        ...(isTop ? { top: 0 } : { bottom: 0 }),
        ...(isLeft ? { left: 0 } : { right: 0 }),
      }}
    />
  );
}

type BlobProps = {
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
};

function DustBlob({ x, y, size, opacity, duration, delay }: BlobProps) {
  const { width, height } = useWindowDimensions();
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(withTiming(-28, { duration, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [delay, duration, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: x * width,
          top: y * height,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(201,162,74,1)',
        },
        style,
      ]}
    />
  );
}

const BLOBS: BlobProps[] = [
  { x: 0.03, y: 0.28, size: 16, opacity: 0.32, duration: 8400, delay: 0 },
  { x: 0.08, y: 0.7, size: 18, opacity: 0.28, duration: 9200, delay: 600 },
  { x: 0.02, y: 0.48, size: 13, opacity: 0.26, duration: 7800, delay: 1200 },
  { x: 0.88, y: 0.76, size: 17, opacity: 0.3, duration: 10000, delay: 300 },
  { x: 0.9, y: 0.18, size: 15, opacity: 0.28, duration: 8800, delay: 900 },
  { x: 0.93, y: 0.42, size: 19, opacity: 0.26, duration: 9600, delay: 1500 },
  { x: 0.06, y: 0.12, size: 12, opacity: 0.24, duration: 11000, delay: 700 },
];

export function MineForeground() {
  const { width, height } = useWindowDimensions();
  const vigSize = Math.round(Math.min(width, height) * 0.48);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <CornerVignette position="topLeft" size={vigSize} />
      <CornerVignette position="topRight" size={vigSize} />
      <CornerVignette position="bottomLeft" size={vigSize} />
      <CornerVignette position="bottomRight" size={vigSize} />

      {BLOBS.map((b, i) => (
        <DustBlob key={i} {...b} />
      ))}

      <View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFillObject,
          borderWidth: 4,
          borderColor: 'rgba(0,0,0,0.45)',
        }}
      />
    </View>
  );
}
