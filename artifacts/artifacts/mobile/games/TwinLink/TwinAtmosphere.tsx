/**
 * TwinAtmosphere — pairing motes, haze, twin light rays.
 * Opacities and sizes are high enough to read on native Android.
 * pointerEvents="none" so tiles stay tappable.
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
import type { VisualQuality } from '@/games/visualFoundation';

type MoteProps = {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  duration: number;
  delay: number;
};

function PairMote({ x, y, size, color, opacity, duration, delay }: MoteProps) {
  const translateY = useSharedValue(0);
  const pulse = useSharedValue(opacity);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(withTiming(-38, { duration, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
    pulse.value = withDelay(
      delay,
      withRepeat(
        withTiming(Math.min(0.74, opacity + 0.14), {
          duration: duration * 0.82,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );
  }, [delay, duration, opacity, pulse, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: pulse.value,
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
        },
        style,
      ]}
    />
  );
}

function HazeBand({ height: screenH, width: screenW }: { height: number; width: number }) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(32, { duration: 8600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [translateX]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: screenH * 0.38,
          left: -40,
          height: screenH * 0.16,
          width: screenW + 80,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={['rgba(233,213,255,0.00)', 'rgba(233,213,255,0.20)', 'rgba(233,213,255,0.00)']}
        style={{ width: '100%', height: '100%' }}
      />
    </Animated.View>
  );
}

type RayProps = { left?: number; right?: number; height: number; rotate: string; delay?: number; cyan?: boolean };
function TwinRay({ left, right, height, rotate, delay = 0, cyan = true }: RayProps) {
  const opacity = useSharedValue(0.12);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(0.2, { duration: 4800, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const hot = cyan ? 'rgba(94,234,212,0.9)' : 'rgba(240,171,252,0.9)';

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: height * 0.04,
          left,
          right,
          width: 36,
          height: height * 0.58,
          transform: [{ rotate }],
        },
        style,
      ]}
    >
      <LinearGradient colors={['rgba(255,255,255,0.0)', hot, 'rgba(255,255,255,0.0)']} style={{ flex: 1, borderRadius: 18 }} />
    </Animated.View>
  );
}

const MOTES: MoteProps[] = [
  { x: 0.07, y: 0.16, size: 8, color: 'rgba(94,234,212,1)', opacity: 0.56, duration: 5400, delay: 0 },
  { x: 0.19, y: 0.52, size: 7, color: 'rgba(240,171,252,1)', opacity: 0.5, duration: 6600, delay: 380 },
  { x: 0.31, y: 0.26, size: 9, color: 'rgba(233,213,255,1)', opacity: 0.48, duration: 4700, delay: 820 },
  { x: 0.46, y: 0.7, size: 6, color: 'rgba(94,234,212,1)', opacity: 0.52, duration: 7200, delay: 180 },
  { x: 0.58, y: 0.14, size: 8, color: 'rgba(240,171,252,1)', opacity: 0.46, duration: 5800, delay: 960 },
  { x: 0.71, y: 0.42, size: 9, color: 'rgba(94,234,212,1)', opacity: 0.54, duration: 6100, delay: 540 },
  { x: 0.83, y: 0.64, size: 7, color: 'rgba(255,255,255,1)', opacity: 0.4, duration: 5000, delay: 1320 },
  { x: 0.91, y: 0.22, size: 8, color: 'rgba(240,171,252,1)', opacity: 0.5, duration: 5600, delay: 280 },
  { x: 0.13, y: 0.78, size: 7, color: 'rgba(94,234,212,1)', opacity: 0.38, duration: 7400, delay: 700 },
  { x: 0.26, y: 0.46, size: 8, color: 'rgba(233,213,255,1)', opacity: 0.44, duration: 6000, delay: 1080 },
  { x: 0.52, y: 0.34, size: 6, color: 'rgba(240,171,252,1)', opacity: 0.5, duration: 4900, delay: 460 },
  { x: 0.76, y: 0.86, size: 9, color: 'rgba(94,234,212,1)', opacity: 0.42, duration: 8000, delay: 880 },
  { x: 0.64, y: 0.58, size: 8, color: 'rgba(255,255,255,1)', opacity: 0.4, duration: 5700, delay: 1500 },
  { x: 0.39, y: 0.88, size: 6, color: 'rgba(240,171,252,1)', opacity: 0.46, duration: 6400, delay: 240 },
  { x: 0.05, y: 0.34, size: 6, color: 'rgba(94,234,212,1)', opacity: 0.42, duration: 6900, delay: 1700 },
  { x: 0.94, y: 0.48, size: 7, color: 'rgba(240,171,252,1)', opacity: 0.46, duration: 5300, delay: 220 },
];

type TwinAtmosphereProps = {
  quality?: VisualQuality;
  warmth?: number;
  mismatch?: boolean;
};

export function TwinAtmosphere({ quality = 'high', warmth = 0, mismatch = false }: TwinAtmosphereProps) {
  const { width, height } = useWindowDimensions();
  const motes = quality === 'low' ? MOTES.slice(0, 8) : MOTES;
  const hazeCyan = mismatch ? 0.05 : 0.12 + warmth * 0.08;
  const hazeRose = mismatch ? 0.1 : 0.1 + warmth * 0.06;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {motes.map((m, i) => (
        <PairMote key={i} {...m} />
      ))}

      <LinearGradient
        colors={[`rgba(94,234,212,${hazeCyan})`, `rgba(240,171,252,${hazeRose})`, 'rgba(94,234,212,0.00)']}
        style={{
          position: 'absolute',
          left: width * 0.16,
          top: height * 0.18,
          width: width * 0.68,
          height: height * 0.36,
          borderRadius: width * 0.34,
        }}
      />

      <HazeBand height={height} width={width} />
      <TwinRay left={width * 0.16} height={height} rotate="-14deg" delay={0} cyan />
      <TwinRay right={width * 0.16} height={height} rotate="14deg" delay={2400} cyan={false} />
    </View>
  );
}
