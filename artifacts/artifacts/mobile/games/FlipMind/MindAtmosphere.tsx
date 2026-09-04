/**
 * MindAtmosphere — motes, fog, violet shafts.
 * Opacities stay high enough to read on native Android.
 * pointerEvents="none" throughout so pads stay tappable.
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
      withRepeat(withTiming(-36, { duration, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
    pulse.value = withDelay(
      delay,
      withRepeat(
        withTiming(Math.min(0.74, opacity + 0.14), { duration: duration * 0.85, easing: Easing.inOut(Easing.sin) }),
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
      withTiming(40, { duration: 8600, easing: Easing.inOut(Easing.sin) }),
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
          top: screenH * 0.34,
          left: -48,
          height: screenH * 0.2,
          width: screenW + 96,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={['rgba(167,139,250,0.00)', 'rgba(167,139,250,0.22)', 'rgba(34,211,238,0.16)', 'rgba(167,139,250,0.00)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ width: '100%', height: '100%' }}
      />
    </Animated.View>
  );
}

type RayProps = { left?: number; right?: number; height: number; rotate: string; delay?: number };
function LightRay({ left, right, height, rotate, delay = 0 }: RayProps) {
  const opacity = useSharedValue(0.14);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(0.22, { duration: 4800, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: height * 0.04,
          left,
          right,
          width: 34,
          height: height * 0.58,
          transform: [{ rotate }],
        },
        style,
      ]}
    >
      <LinearGradient
        colors={['rgba(233,213,255,0.0)', 'rgba(167,139,250,0.9)', 'rgba(34,211,238,0.0)']}
        style={{ flex: 1, borderRadius: 17 }}
      />
    </Animated.View>
  );
}

const MOTES: MoteProps[] = [
  { x: 0.08, y: 0.16, size: 7, color: 'rgba(167,139,250,1)', opacity: 0.56, duration: 5200, delay: 0 },
  { x: 0.2, y: 0.52, size: 6, color: 'rgba(34,211,238,1)', opacity: 0.44, duration: 6800, delay: 400 },
  { x: 0.34, y: 0.26, size: 9, color: 'rgba(233,213,255,1)', opacity: 0.5, duration: 4600, delay: 800 },
  { x: 0.48, y: 0.7, size: 6, color: 'rgba(110,231,183,1)', opacity: 0.48, duration: 7200, delay: 200 },
  { x: 0.6, y: 0.14, size: 8, color: 'rgba(167,139,250,1)', opacity: 0.42, duration: 5800, delay: 1000 },
  { x: 0.72, y: 0.42, size: 9, color: 'rgba(251,113,133,1)', opacity: 0.4, duration: 6200, delay: 600 },
  { x: 0.84, y: 0.64, size: 6, color: 'rgba(34,211,238,1)', opacity: 0.4, duration: 4900, delay: 1400 },
  { x: 0.9, y: 0.22, size: 8, color: 'rgba(233,213,255,1)', opacity: 0.5, duration: 5500, delay: 300 },
  { x: 0.14, y: 0.8, size: 7, color: 'rgba(167,139,250,1)', opacity: 0.38, duration: 7600, delay: 700 },
  { x: 0.28, y: 0.46, size: 8, color: 'rgba(34,211,238,1)', opacity: 0.44, duration: 6100, delay: 1100 },
  { x: 0.54, y: 0.34, size: 6, color: 'rgba(233,213,255,1)', opacity: 0.48, duration: 4800, delay: 500 },
  { x: 0.76, y: 0.86, size: 9, color: 'rgba(167,139,250,1)', opacity: 0.4, duration: 8000, delay: 900 },
  { x: 0.62, y: 0.58, size: 8, color: 'rgba(110,231,183,1)', opacity: 0.36, duration: 5700, delay: 1600 },
  { x: 0.4, y: 0.88, size: 6, color: 'rgba(251,113,133,1)', opacity: 0.38, duration: 6500, delay: 250 },
  { x: 0.05, y: 0.34, size: 5, color: 'rgba(167,139,250,1)', opacity: 0.42, duration: 7000, delay: 1800 },
  { x: 0.94, y: 0.5, size: 7, color: 'rgba(34,211,238,1)', opacity: 0.46, duration: 5400, delay: 220 },
];

type MindAtmosphereProps = {
  quality?: VisualQuality;
  urgency?: boolean;
};

export function MindAtmosphere({ quality = 'high', urgency = false }: MindAtmosphereProps) {
  const { width, height } = useWindowDimensions();
  const motes = quality === 'low' ? MOTES.slice(0, 8) : MOTES;
  const hazeViolet = urgency ? 0.08 : 0.16;
  const hazeRose = urgency ? 0.18 : 0.04;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {motes.map((m, i) => (
        <DustMote key={i} {...m} />
      ))}

      <LinearGradient
        colors={[`rgba(124,77,255,${hazeViolet})`, `rgba(244,63,94,${hazeRose})`, 'rgba(124,77,255,0.00)']}
        style={{
          position: 'absolute',
          left: width * 0.14,
          top: height * 0.18,
          width: width * 0.72,
          height: height * 0.4,
          borderRadius: width * 0.36,
        }}
      />

      <FogBand height={height} width={width} />
      {quality !== 'low' ? (
        <>
          <LightRay left={width * 0.16} height={height} rotate="-14deg" delay={0} />
          <LightRay right={width * 0.16} height={height} rotate="14deg" delay={2400} />
        </>
      ) : null}
    </View>
  );
}
