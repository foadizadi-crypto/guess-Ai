import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { GameColors } from '@/theme/colors';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Orb definitions ──────────────────────────────────────────────────────

interface OrbConfig {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

const ORBS: OrbConfig[] = [
  { x: SW * 0.08,  y: SH * 0.12, size: 220, delay: 0,    duration: 7000, color: 'rgba(255,215,0,0.05)' },
  { x: SW * 0.75,  y: SH * 0.25, size: 160, delay: 1200, duration: 9000, color: 'rgba(138,43,226,0.07)' },
  { x: SW * 0.25,  y: SH * 0.6,  size: 190, delay: 2400, duration: 8000, color: 'rgba(255,107,53,0.04)' },
  { x: SW * 0.82,  y: SH * 0.72, size: 130, delay: 600,  duration: 10000, color: 'rgba(255,215,0,0.04)' },
  { x: SW * 0.5,   y: SH * 0.9,  size: 100, delay: 1800, duration: 6500, color: 'rgba(0,230,118,0.04)' },
];

// ─── Single animated orb ──────────────────────────────────────────────────

const AnimatedOrb: React.FC<{ orb: OrbConfig }> = ({ orb }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    translateY.value = withDelay(
      orb.delay,
      withRepeat(
        withTiming(-40, { duration: orb.duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
    opacity.value = withDelay(
      orb.delay,
      withRepeat(
        withTiming(0.9, { duration: orb.duration * 0.75, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        animatedStyle,
        {
          left: orb.x - orb.size / 2,
          top: orb.y - orb.size / 2,
          width: orb.size,
          height: orb.size,
          borderRadius: orb.size / 2,
          backgroundColor: orb.color,
        },
      ]}
    />
  );
};

// ─── Exported component ───────────────────────────────────────────────────

interface AnimatedBackgroundProps {
  children?: React.ReactNode;
  style?: object;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  children,
  style,
}) => (
  <View style={[styles.container, style]}>
    <View style={styles.fill} />
    {ORBS.map((orb, i) => (
      <AnimatedOrb key={i} orb={orb} />
    ))}
    <View style={styles.content}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GameColors.backgroundPrimary,
  },
  orb: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
