/**
 * MineForeground — Layer 3: Foreground overlay
 * Corner vignettes, slow large dust blobs, edge frame.
 * pointerEvents="none" throughout — must NEVER block card taps.
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

// ------------------------------------------------------------------
// Corner vignette — LinearGradient fades black → transparent inward
// ------------------------------------------------------------------
type CornerProps = {
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  size: number;
};

function CornerVignette({ position, size }: CornerProps) {
  const isTop    = position === 'topLeft'    || position === 'topRight';
  const isLeft   = position === 'topLeft'    || position === 'bottomLeft';

  // Gradient goes from corner outward
  const start = { x: isLeft ? 0 : 1, y: isTop ? 0 : 1 };
  const end   = { x: isLeft ? 1 : 0, y: isTop ? 1 : 0 };

  return (
    <LinearGradient
      colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.00)']}
      start={start}
      end={end}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        ...(isTop    ? { top:    0 } : { bottom: 0 }),
        ...(isLeft   ? { left:   0 } : { right:  0 }),
      }}
    />
  );
}

// ------------------------------------------------------------------
// Large slow dust blob
// ------------------------------------------------------------------
type BlobProps = {
  x: number;  // left fraction of width
  y: number;  // top  fraction of height
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
      withRepeat(
        withTiming(-28, { duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
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
          opacity,
        },
        style,
      ]}
    />
  );
}

// ------------------------------------------------------------------
// Blob seed data
// ------------------------------------------------------------------
const BLOBS: BlobProps[] = [
  { x: 0.05, y: 0.30, size: 11, opacity: 0.08, duration: 8400, delay: 0 },
  { x: 0.20, y: 0.65, size: 13, opacity: 0.07, duration: 9200, delay: 600 },
  { x: 0.40, y: 0.20, size:  9, opacity: 0.10, duration: 7800, delay: 1200 },
  { x: 0.60, y: 0.78, size: 12, opacity: 0.06, duration: 10000, delay: 300 },
  { x: 0.78, y: 0.42, size: 14, opacity: 0.09, duration: 8800, delay: 900 },
  { x: 0.88, y: 0.15, size: 10, opacity: 0.07, duration: 9600, delay: 1500 },
  { x: 0.50, y: 0.55, size: 11, opacity: 0.06, duration: 11000, delay: 700 },
];

// ------------------------------------------------------------------
// Main component
// ------------------------------------------------------------------
export function MineForeground() {
  const { width, height } = useWindowDimensions();
  const vigSize = Math.round(Math.min(width, height) * 0.48);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* ── Corner vignettes ── */}
      <CornerVignette position="topLeft"     size={vigSize} />
      <CornerVignette position="topRight"    size={vigSize} />
      <CornerVignette position="bottomLeft"  size={vigSize} />
      <CornerVignette position="bottomRight" size={vigSize} />

      {/* ── Large floating dust blobs ── */}
      {BLOBS.map((b, i) => (
        <DustBlob key={i} {...b} />
      ))}

      {/* ── Dark edge frame ── */}
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          borderWidth: 4,
          borderColor: 'rgba(0,0,0,0.45)',
          borderRadius: 0,
        }}
        pointerEvents="none"
      />
    </View>
  );
}
