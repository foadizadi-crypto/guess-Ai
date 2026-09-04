/**
 * MineAtmosphere — dust motes, haze, fog band, volumetric light rays.
 * Opacities are high enough to read on native Android (near-invisible strips get dropped).
 * pointerEvents="none" throughout so cards stay tappable.
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

function DustMote({ x, y, size, color, opacity, duration, delay }: MoteProps) {
  const translateY = useSharedValue(0);
  const pulse = useSharedValue(opacity);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(withTiming(-40, { duration, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
    pulse.value = withDelay(
      delay,
      withRepeat(
        withTiming(Math.min(0.72, opacity + 0.12), { duration: duration * 0.85, easing: Easing.inOut(Easing.sin) }),
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

function FogBand({ height: screenH, width: screenW }: { height: number; width: number }) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(36, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
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
          top: screenH * 0.36,
          left: -40,
          height: screenH * 0.18,
          width: screenW + 80,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={['rgba(230,220,200,0.00)', 'rgba(230,220,200,0.18)', 'rgba(230,220,200,0.00)']}
        style={{ width: '100%', height: '100%' }}
      />
    </Animated.View>
  );
}

type RayProps = { left?: number; right?: number; height: number; rotate: string; delay?: number };
function LightRay({ left, right, height, rotate, delay = 0 }: RayProps) {
  const opacity = useSharedValue(0.1);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(0.16, { duration: 5000, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [delay, opacity]);

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
          width: 38,
          height: height * 0.62,
          transform: [{ rotate }],
        },
        style,
      ]}
    >
      <LinearGradient
        colors={['rgba(255,245,200,0.0)', 'rgba(255,245,200,0.85)', 'rgba(255,245,200,0.0)']}
        style={{ flex: 1, borderRadius: 19 }}
      />
    </Animated.View>
  );
}

const MOTES: MoteProps[] = [
  { x: 0.08, y: 0.15, size: 7, color: 'rgba(244,215,138,1)', opacity: 0.58, duration: 5200, delay: 0 },
  { x: 0.18, y: 0.55, size: 6, color: 'rgba(255,255,255,1)', opacity: 0.42, duration: 6800, delay: 400 },
  { x: 0.32, y: 0.28, size: 9, color: 'rgba(244,215,138,1)', opacity: 0.52, duration: 4600, delay: 800 },
  { x: 0.45, y: 0.72, size: 6, color: 'rgba(255,240,180,1)', opacity: 0.5, duration: 7200, delay: 200 },
  { x: 0.58, y: 0.12, size: 8, color: 'rgba(255,255,255,1)', opacity: 0.4, duration: 5800, delay: 1000 },
  { x: 0.7, y: 0.44, size: 9, color: 'rgba(244,215,138,1)', opacity: 0.55, duration: 6200, delay: 600 },
  { x: 0.82, y: 0.65, size: 6, color: 'rgba(255,255,255,1)', opacity: 0.38, duration: 4900, delay: 1400 },
  { x: 0.9, y: 0.22, size: 8, color: 'rgba(255,240,180,1)', opacity: 0.5, duration: 5500, delay: 300 },
  { x: 0.14, y: 0.8, size: 7, color: 'rgba(244,215,138,1)', opacity: 0.36, duration: 7600, delay: 700 },
  { x: 0.25, y: 0.47, size: 8, color: 'rgba(255,255,255,1)', opacity: 0.44, duration: 6100, delay: 1100 },
  { x: 0.53, y: 0.35, size: 6, color: 'rgba(255,240,180,1)', opacity: 0.48, duration: 4800, delay: 500 },
  { x: 0.76, y: 0.88, size: 9, color: 'rgba(244,215,138,1)', opacity: 0.4, duration: 8000, delay: 900 },
  { x: 0.62, y: 0.6, size: 8, color: 'rgba(255,255,255,1)', opacity: 0.42, duration: 5700, delay: 1600 },
  { x: 0.38, y: 0.9, size: 6, color: 'rgba(255,240,180,1)', opacity: 0.46, duration: 6500, delay: 250 },
  { x: 0.04, y: 0.33, size: 5, color: 'rgba(244,215,138,1)', opacity: 0.4, duration: 7000, delay: 1800 },
  { x: 0.94, y: 0.5, size: 7, color: 'rgba(255,240,180,1)', opacity: 0.45, duration: 5400, delay: 220 },
];

type MineAtmosphereProps = {
  quality?: VisualQuality;
  threat?: boolean;
  warmth?: number;
};

export function MineAtmosphere({ quality = 'high', threat = false, warmth = 0 }: MineAtmosphereProps) {
  const { width, height } = useWindowDimensions();
  const motes = quality === 'low' ? MOTES.slice(0, 8) : MOTES;
  const hazeGold = threat ? 0.06 : 0.14 + warmth * 0.08;
  const hazeEmber = threat ? 0.16 : 0.02;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {motes.map((m, i) => (
        <DustMote key={i} {...m} />
      ))}

      <LinearGradient
        colors={[
          `rgba(180,120,30,${hazeGold})`,
          `rgba(180,40,30,${hazeEmber})`,
          'rgba(180,120,30,0.00)',
        ]}
        style={{
          position: 'absolute',
          left: width * 0.16,
          top: height * 0.2,
          width: width * 0.68,
          height: height * 0.38,
          borderRadius: width * 0.34,
        }}
      />

      <FogBand height={height} width={width} />
      <LightRay left={width * 0.18} height={height} rotate="-15deg" delay={0} />
      <LightRay right={width * 0.18} height={height} rotate="15deg" delay={2500} />
    </View>
  );
}
