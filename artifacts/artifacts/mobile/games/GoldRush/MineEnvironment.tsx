/**
 * MineEnvironment — Layer 1: Midground
 * Static stone columns, wooden beams, tunnel depth, ambient glow, floor shadow.
 * All elements are purely decorative and behind gameplay cards.
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

// ------------------------------------------------------------------
// Breathe hook — scale oscillates between lo and hi over `duration` ms
// ------------------------------------------------------------------
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
  }, []);
  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}

// ------------------------------------------------------------------
// Single ambient glow orb
// ------------------------------------------------------------------
type GlowProps = { size: number; color: string; style: object; delay?: number };
function AmbientGlow({ size, color, style, delay = 0 }: GlowProps) {
  const anim = useBreath(0.92, 1.08, 3600, delay);
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

// ------------------------------------------------------------------
// Main component
// ------------------------------------------------------------------
export function MineEnvironment() {
  const { width, height } = useWindowDimensions();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* ── Distant tunnel mouth — dark ellipse in center-back ── */}
      <View
        style={{
          position: 'absolute',
          alignSelf: 'center',
          top: height * 0.05,
          width: width * 0.55,
          height: height * 0.32,
          borderRadius: (width * 0.55) / 2,
          backgroundColor: 'rgba(4,2,8,0.55)',
        }}
      />

      {/* ── Left stone column ── */}
      <LinearGradient
        colors={['#1a1208', '#2e1e0a', '#3a2510', '#1a1208']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: width * 0.12,
          height: '100%',
          borderTopRightRadius: 18,
          borderBottomRightRadius: 18,
        }}
      />

      {/* ── Right stone column ── */}
      <LinearGradient
        colors={['#1a1208', '#2e1e0a', '#3a2510', '#1a1208']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0 }}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: width * 0.12,
          height: '100%',
          borderTopLeftRadius: 18,
          borderBottomLeftRadius: 18,
        }}
      />

      {/* ── Left wooden beam (vertical) ── */}
      <LinearGradient
        colors={['#2b1a08', '#3d2410', '#2b1a08']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          position: 'absolute',
          left: width * 0.09,
          top: 0,
          width: 10,
          height: '75%',
          borderRadius: 4,
          opacity: 0.75,
        }}
      />

      {/* ── Right wooden beam (vertical) ── */}
      <LinearGradient
        colors={['#2b1a08', '#3d2410', '#2b1a08']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          position: 'absolute',
          right: width * 0.09,
          top: 0,
          width: 10,
          height: '75%',
          borderRadius: 4,
          opacity: 0.75,
        }}
      />

      {/* ── Left angled support beam ── */}
      <View
        style={{
          position: 'absolute',
          left: width * 0.05,
          top: height * 0.18,
          width: 8,
          height: height * 0.28,
          borderRadius: 3,
          backgroundColor: 'rgba(50,28,8,0.65)',
          transform: [{ rotate: '-12deg' }],
        }}
      />

      {/* ── Right angled support beam ── */}
      <View
        style={{
          position: 'absolute',
          right: width * 0.05,
          top: height * 0.18,
          width: 8,
          height: height * 0.28,
          borderRadius: 3,
          backgroundColor: 'rgba(50,28,8,0.65)',
          transform: [{ rotate: '12deg' }],
        }}
      />

      {/* ── Ambient glow — top-left corner ── */}
      <AmbientGlow
        size={180}
        color="rgba(220,160,40,0.13)"
        style={{ top: -40, left: -30 }}
        delay={0}
      />

      {/* ── Ambient glow — top-right corner ── */}
      <AmbientGlow
        size={160}
        color="rgba(200,140,30,0.12)"
        style={{ top: -30, right: -20 }}
        delay={1200}
      />

      {/* ── Ambient glow — mid-center ── */}
      <AmbientGlow
        size={220}
        color="rgba(201,162,74,0.10)"
        style={{ top: height * 0.3, alignSelf: 'center', left: width / 2 - 110 }}
        delay={600}
      />

      {/* ── Floor shadow gradient ── */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.40)']}
        locations={[0, 1]}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: height * 0.30,
        }}
      />
    </View>
  );
}
