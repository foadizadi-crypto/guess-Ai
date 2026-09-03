/**
 * MineAtmosphere — Layer 2: Atmosphere
 * Dust motes, soft haze, thin fog band, volumetric light rays.
 * All elements have very low opacity and are purely decorative.
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
// Dust mote — slow floating circle
// ------------------------------------------------------------------
type MoteProps = {
  x: number;       // left position 0-1 (fraction of width)
  y: number;       // top  position 0-1 (fraction of height)
  size: number;
  color: string;
  opacity: number;
  duration: number; // ms for one float cycle
  delay: number;
};

function DustMote({ x, y, size, color, opacity, duration, delay }: MoteProps) {
  const translateY = useSharedValue(0);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-40, { duration, easing: Easing.inOut(Easing.sin) }),
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
          backgroundColor: color,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ------------------------------------------------------------------
// Fog band — slow horizontal drift
// ------------------------------------------------------------------
function FogBand({ height: screenH, width: screenW }: { height: number; width: number }) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(30, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: screenH * 0.39,
          left: -30,
          right: -30,
          height: 28,
          backgroundColor: 'rgba(230,220,200,0.05)',
          borderRadius: 14,
        },
        style,
      ]}
    />
  );
}

// ------------------------------------------------------------------
// Volumetric light ray — opacity pulse
// ------------------------------------------------------------------
type RayProps = { left?: number; right?: number; height: number; rotate: string; delay?: number };
function LightRay({ left, right, height, rotate, delay = 0 }: RayProps) {
  const opacity = useSharedValue(0.04);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.08, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: height * 0.05,
          left,
          right,
          width: 26,
          height: height * 0.62,
          backgroundColor: 'rgba(255,245,200,1)',
          borderRadius: 13,
          transform: [{ rotate }],
        },
        style,
      ]}
    />
  );
}

// ------------------------------------------------------------------
// Mote seed data (stable — not random per render)
// ------------------------------------------------------------------
const MOTES: Omit<MoteProps, 'x' | 'y'>[] & { x: number; y: number }[] = [
  { x: 0.08, y: 0.15, size: 3, color: 'rgba(244,215,138,1)', opacity: 0.22, duration: 5200, delay: 0 },
  { x: 0.18, y: 0.55, size: 2, color: 'rgba(255,255,255,1)',  opacity: 0.14, duration: 6800, delay: 400 },
  { x: 0.32, y: 0.28, size: 4, color: 'rgba(244,215,138,1)', opacity: 0.18, duration: 4600, delay: 800 },
  { x: 0.45, y: 0.72, size: 2, color: 'rgba(255,240,180,1)', opacity: 0.20, duration: 7200, delay: 200 },
  { x: 0.58, y: 0.12, size: 3, color: 'rgba(255,255,255,1)', opacity: 0.12, duration: 5800, delay: 1000 },
  { x: 0.70, y: 0.44, size: 4, color: 'rgba(244,215,138,1)', opacity: 0.16, duration: 6200, delay: 600 },
  { x: 0.82, y: 0.65, size: 2, color: 'rgba(255,255,255,1)', opacity: 0.13, duration: 4900, delay: 1400 },
  { x: 0.90, y: 0.22, size: 3, color: 'rgba(255,240,180,1)', opacity: 0.19, duration: 5500, delay: 300 },
  { x: 0.14, y: 0.80, size: 2, color: 'rgba(244,215,138,1)', opacity: 0.11, duration: 7600, delay: 700 },
  { x: 0.25, y: 0.47, size: 3, color: 'rgba(255,255,255,1)', opacity: 0.15, duration: 6100, delay: 1100 },
  { x: 0.53, y: 0.35, size: 2, color: 'rgba(255,240,180,1)', opacity: 0.17, duration: 4800, delay: 500 },
  { x: 0.76, y: 0.88, size: 4, color: 'rgba(244,215,138,1)', opacity: 0.10, duration: 8000, delay: 900 },
  { x: 0.62, y: 0.60, size: 3, color: 'rgba(255,255,255,1)', opacity: 0.13, duration: 5700, delay: 1600 },
  { x: 0.38, y: 0.90, size: 2, color: 'rgba(255,240,180,1)', opacity: 0.14, duration: 6500, delay: 250 },
];

// ------------------------------------------------------------------
// Main component
// ------------------------------------------------------------------
export function MineAtmosphere() {
  const { width, height } = useWindowDimensions();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* ── Dust motes ── */}
      {MOTES.map((m, i) => (
        <DustMote x={0} y={0} key={i} {...m} />
      ))}

      {/* ── Soft warm haze oval ── */}
      <LinearGradient
        colors={['rgba(180,120,30,0.09)', 'rgba(180,120,30,0.00)']}
        style={{
          position: 'absolute',
          alignSelf: 'center',
          left: width * 0.2,
          top: height * 0.22,
          width: width * 0.6,
          height: height * 0.35,
          borderRadius: width * 0.3,
        }}
      />

      {/* ── Thin fog band ── */}
      <FogBand height={height} width={width} />

      {/* ── Light ray left ── */}
      <LightRay left={width * 0.18} height={height} rotate="-15deg" delay={0} />

      {/* ── Light ray right ── */}
      <LightRay right={width * 0.18} height={height} rotate="15deg" delay={2500} />
    </View>
  );
}
