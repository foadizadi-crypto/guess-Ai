/**
 * TwinEnvironment — memory salon midground.
 * Twin columns, dual orbs, center link glow. pointerEvents none.
 */
import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { TwinTone } from './twinTokens';

function useBreath(lo: number, hi: number, duration: number, delay = 0) {
  const scale = useSharedValue(lo);
  useEffect(() => {
    const t = setTimeout(() => {
      scale.value = withRepeat(
        withTiming(hi, { duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    }, delay);
    return () => clearTimeout(t);
  }, [delay, duration, hi, lo, scale]);
  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}

function AmbientGlow({
  size,
  color,
  style,
  delay = 0,
}: {
  size: number;
  color: string;
  style: object;
  delay?: number;
}) {
  const anim = useBreath(0.9, 1.1, 3800, delay);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
        anim,
      ]}
    />
  );
}

type TwinEnvironmentProps = {
  warmth?: number;
  mismatch?: boolean;
};

export function TwinEnvironment({ warmth = 0, mismatch = false }: TwinEnvironmentProps) {
  const { width, height } = useWindowDimensions();
  const cyanA = mismatch ? 0.05 : 0.14 + warmth * 0.12;
  const roseA = mismatch ? 0.08 : 0.14 + warmth * 0.1;
  const linkA = mismatch ? 0.06 : 0.16 + warmth * 0.18;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={{
          position: 'absolute',
          alignSelf: 'center',
          top: height * 0.08,
          left: width * 0.22,
          width: width * 0.56,
          height: height * 0.28,
          borderRadius: width * 0.28,
          backgroundColor: `rgba(6,4,16,${0.55 + warmth * 0.12})`,
        }}
      />

      <LinearGradient
        colors={['#0C0820', TwinTone.cyanDeep, '#12102A', '#0C0820']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: width * 0.11,
          height: '100%',
          borderTopRightRadius: 22,
          borderBottomRightRadius: 22,
        }}
      />
      <LinearGradient
        colors={['#0C0820', TwinTone.roseDeep, '#1A0A22', '#0C0820']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0 }}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: width * 0.11,
          height: '100%',
          borderTopLeftRadius: 22,
          borderBottomLeftRadius: 22,
        }}
      />

      <View
        style={{
          position: 'absolute',
          left: width * 0.08,
          top: height * 0.16,
          width: 7,
          height: height * 0.42,
          borderRadius: 4,
          backgroundColor: 'rgba(94,234,212,0.28)',
          transform: [{ rotate: '-11deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: width * 0.08,
          top: height * 0.16,
          width: 7,
          height: height * 0.42,
          borderRadius: 4,
          backgroundColor: 'rgba(240,171,252,0.28)',
          transform: [{ rotate: '11deg' }],
        }}
      />

      <LinearGradient
        colors={[`rgba(94,234,212,${linkA})`, 'transparent', `rgba(240,171,252,${linkA})`]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{
          position: 'absolute',
          top: height * 0.34,
          left: width * 0.14,
          right: width * 0.14,
          height: 3,
          borderRadius: 2,
        }}
      />

      <AmbientGlow
        size={190}
        color={`rgba(94,234,212,${cyanA})`}
        style={{ top: -36, left: -40 }}
        delay={0}
      />
      <AmbientGlow
        size={180}
        color={`rgba(240,171,252,${roseA})`}
        style={{ top: -28, right: -36 }}
        delay={1100}
      />
      <AmbientGlow
        size={230}
        color={`rgba(233,213,255,${0.07 + warmth * 0.08})`}
        style={{ top: height * 0.32, left: width / 2 - 115 }}
        delay={700}
      />

      <LinearGradient
        colors={['transparent', 'rgba(4,2,12,0.55)']}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: height * 0.28,
        }}
      />
    </View>
  );
}
