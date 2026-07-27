import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: SW, height: SH } = Dimensions.get('window');

interface AnimatedGradientBackgroundProps {
  children?: React.ReactNode;
}

type GradientColors = readonly [string, string, ...string[]];

const GRADIENT_A: GradientColors = ['#0D0221', '#1A0B2E', '#0D0221'] as const;
const GRADIENT_B: GradientColors = ['#120228', '#220B38', '#0A011A'] as const;
const GRADIENT_C: GradientColors = ['#0A0118', '#1E0D35', '#130225'] as const;

// Three gradients cycle through each other for a subtle breathing effect
const GRADIENTS = [GRADIENT_A, GRADIENT_B, GRADIENT_C] as const;

export const AnimatedGradientBackground: React.FC<AnimatedGradientBackgroundProps> = ({
  children,
}) => {
  const opacity1 = useSharedValue(1);
  const opacity2 = useSharedValue(0);
  const opacity3 = useSharedValue(0);

  useEffect(() => {
    // Cross-fade three gradient states cyclically
    const dur = 4000;

    opacity1.value = withRepeat(
      withTiming(0, { duration: dur, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    opacity2.value = withRepeat(
      withTiming(1, { duration: dur * 0.67, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    opacity3.value = withRepeat(
      withTiming(0.6, { duration: dur * 1.3, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const style1 = useAnimatedStyle(() => ({ opacity: opacity1.value }));
  const style2 = useAnimatedStyle(() => ({ opacity: opacity2.value }));
  const style3 = useAnimatedStyle(() => ({ opacity: opacity3.value }));

  return (
    <View style={styles.container}>
      {/* Base layer — always opaque */}
      <LinearGradient
        colors={GRADIENT_A}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated overlays */}
      {([style1, style2, style3] as const).map((s, i) => (
        <Animated.View key={i} style={[StyleSheet.absoluteFill, s]}>
          <LinearGradient
            colors={GRADIENTS[i]}
            start={{ x: 0.2 + i * 0.15, y: 0 }}
            end={{ x: 0.8 - i * 0.1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ))}

      {/* Accent orbs */}
      <View style={[styles.orb, styles.orbTopRight]} />
      <View style={[styles.orb, styles.orbBottomLeft]} />

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, zIndex: 1 },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbTopRight: {
    width: SW * 0.7,
    height: SW * 0.7,
    top: -SW * 0.15,
    right: -SW * 0.2,
    backgroundColor: 'rgba(138,43,226,0.06)',
  },
  orbBottomLeft: {
    width: SW * 0.85,
    height: SW * 0.85,
    bottom: SH * 0.05,
    left: -SW * 0.3,
    backgroundColor: 'rgba(255,215,0,0.04)',
  },
});
