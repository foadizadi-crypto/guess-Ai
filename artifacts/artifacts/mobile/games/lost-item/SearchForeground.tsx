/**
 * SearchForeground — corner vignettes, lantern motes, dark frame.
 * pointerEvents="none" — must never block scene or chip taps.
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

function CornerVignette({
  position,
  size,
}: {
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  size: number;
}) {
  const isTop = position === 'topLeft' || position === 'topRight';
  const isLeft = position === 'topLeft' || position === 'bottomLeft';
  const start = { x: isLeft ? 0 : 1, y: isTop ? 0 : 1 };
  const end = { x: isLeft ? 1 : 0, y: isTop ? 1 : 0 };

  return (
    <LinearGradient
      colors={['rgba(6,3,2,0.62)', 'rgba(6,3,2,0.00)']}
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
  warm: boolean;
};

function EdgeMote({ x, y, size, opacity, duration, delay, warm }: BlobProps) {
  const { width, height } = useWindowDimensions();
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(withTiming(-26, { duration, easing: Easing.inOut(Easing.sin) }), -1, true),
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
          backgroundColor: warm ? 'rgba(240,192,120,1)' : 'rgba(255,176,136,1)',
        },
        style,
      ]}
    />
  );
}

const BLOBS: BlobProps[] = [
  { x: 0.03, y: 0.26, size: 15, opacity: 0.36, duration: 8400, delay: 0, warm: true },
  { x: 0.07, y: 0.68, size: 17, opacity: 0.3, duration: 9200, delay: 600, warm: true },
  { x: 0.02, y: 0.46, size: 12, opacity: 0.28, duration: 7800, delay: 1200, warm: false },
  { x: 0.88, y: 0.74, size: 16, opacity: 0.32, duration: 10000, delay: 300, warm: false },
  { x: 0.9, y: 0.16, size: 15, opacity: 0.3, duration: 8800, delay: 900, warm: true },
  { x: 0.93, y: 0.4, size: 18, opacity: 0.28, duration: 9600, delay: 1500, warm: false },
  { x: 0.05, y: 0.12, size: 12, opacity: 0.26, duration: 11000, delay: 700, warm: true },
];

export function SearchForeground() {
  const { width, height } = useWindowDimensions();
  const vigSize = Math.round(Math.min(width, height) * 0.46);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <CornerVignette position="topLeft" size={vigSize} />
      <CornerVignette position="topRight" size={vigSize} />
      <CornerVignette position="bottomLeft" size={vigSize} />
      <CornerVignette position="bottomRight" size={vigSize} />

      {BLOBS.map((b, i) => (
        <EdgeMote key={i} {...b} />
      ))}

      <View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFillObject,
          borderWidth: 4,
          borderColor: 'rgba(0,0,0,0.42)',
        }}
      />
    </View>
  );
}
