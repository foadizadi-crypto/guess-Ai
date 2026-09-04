import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { GameColors } from '@/theme/colors';

const { width: SW, height: SH } = Dimensions.get('window');

interface Particle {
  id: number;
  startX: number;
  startY: number;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
  opacity: number;
}

// Seeded particles — deterministic so no layout thrash
const PARTICLES: Particle[] = Array.from({ length: 22 }, (_, i) => {
  const seed = (i + 1) * 137.508; // golden angle approximation
  return {
    id: i,
    startX: ((seed * 7) % 1) * SW,
    startY: SH * 0.2 + ((seed * 3) % 1) * SH * 0.7,
    size: 3 + ((seed * 5) % 1) * 5,
    delay: ((seed * 11) % 1) * 3000,
    duration: 3500 + ((seed * 13) % 1) * 3000,
    driftX: (((seed * 17) % 1) - 0.5) * 60,
    opacity: 0.3 + ((seed * 19) % 1) * 0.55,
  };
});

const SingleParticle: React.FC<{ p: Particle }> = ({ p }) => {
  const y = useSharedValue(p.startY);
  const x = useSharedValue(p.startX);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.4);

  useEffect(() => {
    y.value = withDelay(
      p.delay,
      withRepeat(
        withTiming(p.startY - 280, {
          duration: p.duration,
          easing: Easing.out(Easing.cubic),
        }),
        -1,
        false,
      ),
    );

    x.value = withDelay(
      p.delay,
      withRepeat(
        withTiming(p.startX + p.driftX, {
          duration: p.duration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );

    opacity.value = withDelay(
      p.delay,
      withRepeat(
        withSequence(
          withTiming(p.opacity, { duration: p.duration * 0.25, easing: Easing.out(Easing.cubic) }),
          withTiming(p.opacity * 0.9, { duration: p.duration * 0.5 }),
          withTiming(0, { duration: p.duration * 0.25, easing: Easing.in(Easing.cubic) }),
        ),
        -1,
        false,
      ),
    );

    scale.value = withDelay(
      p.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: p.duration * 0.2 }),
          withTiming(0.6, { duration: p.duration * 0.8 }),
        ),
        -1,
        false,
      ),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x.value,
    top: y.value,
    width: p.size,
    height: p.size,
    borderRadius: p.size / 2,
    backgroundColor: GameColors.accentGold,
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
    shadowColor: GameColors.accentGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  }));

  return <Animated.View style={style} />;
};

const VISIBLE_PARTICLES =
  Platform.OS === "android" ? PARTICLES.slice(0, 6) : PARTICLES;

export const GoldParticles: React.FC = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {VISIBLE_PARTICLES.map((p) => (
      <SingleParticle key={p.id} p={p} />
    ))}
  </View>
);
