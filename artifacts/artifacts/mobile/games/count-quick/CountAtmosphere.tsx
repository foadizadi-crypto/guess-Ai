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
      withRepeat(withTiming(-32, { duration, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
    pulse.value = withDelay(
      delay,
      withRepeat(
        withTiming(Math.min(0.72, opacity + 0.14), { duration: duration * 0.85, easing: Easing.inOut(Easing.sin) }),
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

function ScanBand({ height: screenH, width: screenW }: { height: number; width: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(screenH * 0.22, { duration: 7400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [screenH, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: screenH * 0.22,
          left: -36,
          height: 18,
          width: screenW + 72,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={['rgba(45,212,191,0.00)', 'rgba(45,212,191,0.28)', 'rgba(251,113,133,0.18)', 'rgba(45,212,191,0.00)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ width: '100%', height: '100%' }}
      />
    </Animated.View>
  );
}

function LightRay({
  left,
  right,
  height,
  rotate,
  delay = 0,
}: {
  left?: number;
  right?: number;
  height: number;
  rotate: string;
  delay?: number;
}) {
  const opacity = useSharedValue(0.12);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(0.2, { duration: 4600, easing: Easing.inOut(Easing.sin) }), -1, true),
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
          width: 32,
          height: height * 0.56,
          transform: [{ rotate }],
        },
        style,
      ]}
    >
      <LinearGradient
        colors={['rgba(244,251,255,0.0)', 'rgba(45,212,191,0.85)', 'rgba(251,113,133,0.0)']}
        style={{ flex: 1, borderRadius: 16 }}
      />
    </Animated.View>
  );
}

const MOTES: MoteProps[] = [
  { x: 0.08, y: 0.16, size: 7, color: 'rgba(45,212,191,1)', opacity: 0.54, duration: 5200, delay: 0 },
  { x: 0.2, y: 0.52, size: 6, color: 'rgba(251,113,133,1)', opacity: 0.42, duration: 6800, delay: 400 },
  { x: 0.34, y: 0.26, size: 9, color: 'rgba(244,251,255,1)', opacity: 0.48, duration: 4600, delay: 800 },
  { x: 0.48, y: 0.7, size: 6, color: 'rgba(45,212,191,1)', opacity: 0.46, duration: 7200, delay: 200 },
  { x: 0.6, y: 0.14, size: 8, color: 'rgba(253,224,71,1)', opacity: 0.4, duration: 5800, delay: 1000 },
  { x: 0.72, y: 0.42, size: 9, color: 'rgba(251,113,133,1)', opacity: 0.4, duration: 6200, delay: 600 },
  { x: 0.84, y: 0.64, size: 6, color: 'rgba(45,212,191,1)', opacity: 0.4, duration: 4900, delay: 1400 },
  { x: 0.9, y: 0.22, size: 8, color: 'rgba(244,251,255,1)', opacity: 0.48, duration: 5500, delay: 300 },
  { x: 0.14, y: 0.8, size: 7, color: 'rgba(251,113,133,1)', opacity: 0.36, duration: 7600, delay: 700 },
  { x: 0.28, y: 0.46, size: 8, color: 'rgba(45,212,191,1)', opacity: 0.44, duration: 6100, delay: 1100 },
  { x: 0.54, y: 0.34, size: 6, color: 'rgba(244,251,255,1)', opacity: 0.46, duration: 4800, delay: 500 },
  { x: 0.76, y: 0.86, size: 9, color: 'rgba(45,212,191,1)', opacity: 0.38, duration: 8000, delay: 900 },
  { x: 0.62, y: 0.58, size: 8, color: 'rgba(251,113,133,1)', opacity: 0.34, duration: 5700, delay: 1600 },
  { x: 0.4, y: 0.88, size: 6, color: 'rgba(253,224,71,1)', opacity: 0.36, duration: 6500, delay: 250 },
  { x: 0.05, y: 0.34, size: 5, color: 'rgba(45,212,191,1)', opacity: 0.4, duration: 7000, delay: 1800 },
  { x: 0.94, y: 0.5, size: 7, color: 'rgba(251,113,133,1)', opacity: 0.44, duration: 5400, delay: 220 },
];

type CountAtmosphereProps = {
  quality?: VisualQuality;
  urgency?: boolean;
};

export function CountAtmosphere({ quality = 'high', urgency = false }: CountAtmosphereProps) {
  const { width, height } = useWindowDimensions();
  const motes = quality === 'low' ? MOTES.slice(0, 8) : MOTES;
  const hazeTeal = urgency ? 0.06 : 0.16;
  const hazeCoral = urgency ? 0.18 : 0.05;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {motes.map((m, i) => (
        <DustMote key={i} {...m} />
      ))}

      <LinearGradient
        colors={[`rgba(45,212,191,${hazeTeal})`, `rgba(251,113,133,${hazeCoral})`, 'rgba(45,212,191,0.00)']}
        style={{
          position: 'absolute',
          left: width * 0.14,
          top: height * 0.18,
          width: width * 0.72,
          height: height * 0.4,
          borderRadius: width * 0.36,
        }}
      />

      {quality !== 'low' ? <ScanBand height={height} width={width} /> : null}
      {quality !== 'low' ? (
        <>
          <LightRay left={width * 0.16} height={height} rotate="-13deg" delay={0} />
          <LightRay right={width * 0.16} height={height} rotate="13deg" delay={2200} />
        </>
      ) : null}
    </View>
  );
}
