/**
 * SearchAtmosphere — dust, haze, lantern shafts.
 * Opacities stay high enough to read on native Android.
 * pointerEvents="none" throughout so scene and chips stay tappable.
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
      withRepeat(withTiming(-34, { duration, easing: Easing.inOut(Easing.sin) }), -1, true),
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

function FogBand({ height: screenH, width: screenW, dim }: { height: number; width: number; dim: boolean }) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(38, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
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
          left: -48,
          height: screenH * 0.18,
          width: screenW + 96,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={
          dim
            ? ['rgba(255,176,136,0.00)', 'rgba(255,176,136,0.06)', 'rgba(255,176,136,0.00)']
            : ['rgba(255,176,136,0.00)', 'rgba(255,176,136,0.2)', 'rgba(196,132,58,0.14)', 'rgba(255,176,136,0.00)']
        }
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ width: '100%', height: '100%' }}
      />
    </Animated.View>
  );
}

type RayProps = { left?: number; right?: number; height: number; rotate: string; delay?: number; dim?: boolean };
function LightRay({ left, right, height, rotate, delay = 0, dim = false }: RayProps) {
  const opacity = useSharedValue(dim ? 0.05 : 0.14);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(dim ? 0.08 : 0.22, { duration: 5000, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [delay, dim, opacity]);

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
          height: height * 0.56,
          transform: [{ rotate }],
        },
        style,
      ]}
    >
      <LinearGradient
        colors={['rgba(255,176,136,0.0)', 'rgba(255,176,136,0.9)', 'rgba(196,132,58,0.0)']}
        style={{ flex: 1, borderRadius: 17 }}
      />
    </Animated.View>
  );
}

const MOTES: MoteProps[] = [
  { x: 0.08, y: 0.16, size: 7, color: 'rgba(240,192,120,1)', opacity: 0.54, duration: 5200, delay: 0 },
  { x: 0.2, y: 0.52, size: 6, color: 'rgba(255,176,136,1)', opacity: 0.42, duration: 6800, delay: 400 },
  { x: 0.34, y: 0.26, size: 9, color: 'rgba(248,240,230,1)', opacity: 0.48, duration: 4600, delay: 800 },
  { x: 0.48, y: 0.7, size: 6, color: 'rgba(196,132,58,1)', opacity: 0.46, duration: 7200, delay: 200 },
  { x: 0.6, y: 0.14, size: 8, color: 'rgba(240,192,120,1)', opacity: 0.4, duration: 5800, delay: 1000 },
  { x: 0.72, y: 0.42, size: 9, color: 'rgba(255,112,67,1)', opacity: 0.38, duration: 6200, delay: 600 },
  { x: 0.84, y: 0.64, size: 6, color: 'rgba(255,176,136,1)', opacity: 0.4, duration: 4900, delay: 1400 },
  { x: 0.9, y: 0.22, size: 8, color: 'rgba(248,240,230,1)', opacity: 0.48, duration: 5500, delay: 300 },
  { x: 0.14, y: 0.8, size: 7, color: 'rgba(240,192,120,1)', opacity: 0.36, duration: 7600, delay: 700 },
  { x: 0.28, y: 0.46, size: 8, color: 'rgba(255,176,136,1)', opacity: 0.42, duration: 6100, delay: 1100 },
  { x: 0.54, y: 0.34, size: 6, color: 'rgba(248,240,230,1)', opacity: 0.46, duration: 4800, delay: 500 },
  { x: 0.76, y: 0.86, size: 9, color: 'rgba(196,132,58,1)', opacity: 0.38, duration: 8000, delay: 900 },
  { x: 0.62, y: 0.58, size: 8, color: 'rgba(255,112,67,1)', opacity: 0.34, duration: 5700, delay: 1600 },
  { x: 0.4, y: 0.88, size: 6, color: 'rgba(240,192,120,1)', opacity: 0.36, duration: 6500, delay: 250 },
  { x: 0.05, y: 0.34, size: 5, color: 'rgba(255,176,136,1)', opacity: 0.4, duration: 7000, delay: 1800 },
  { x: 0.94, y: 0.5, size: 7, color: 'rgba(248,240,230,1)', opacity: 0.44, duration: 5400, delay: 220 },
];

type SearchAtmosphereProps = {
  quality?: VisualQuality;
  blackout?: boolean;
  urgency?: boolean;
};

export function SearchAtmosphere({
  quality = 'high',
  blackout = false,
  urgency = false,
}: SearchAtmosphereProps) {
  const { width, height } = useWindowDimensions();
  const motes = blackout ? MOTES.slice(0, 4) : quality === 'low' ? MOTES.slice(0, 8) : MOTES;
  const hazeWarm = blackout ? 0.04 : urgency ? 0.1 : 0.16;
  const hazeRose = blackout ? 0.02 : urgency ? 0.16 : 0.05;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {motes.map((m, i) => (
        <DustMote key={i} {...m} opacity={blackout ? m.opacity * 0.35 : m.opacity} />
      ))}

      <LinearGradient
        colors={[`rgba(255,112,67,${hazeWarm})`, `rgba(255,77,109,${hazeRose})`, 'rgba(255,112,67,0.00)']}
        style={{
          position: 'absolute',
          left: width * 0.14,
          top: height * 0.16,
          width: width * 0.72,
          height: height * 0.4,
          borderRadius: width * 0.36,
        }}
      />

      <FogBand height={height} width={width} dim={blackout} />
      {quality !== 'low' && !blackout ? (
        <>
          <LightRay left={width * 0.18} height={height} rotate="-13deg" delay={0} />
          <LightRay right={width * 0.18} height={height} rotate="13deg" delay={2400} />
        </>
      ) : null}
    </View>
  );
}
