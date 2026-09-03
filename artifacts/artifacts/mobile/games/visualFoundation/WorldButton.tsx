import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type WorldButtonProps = {
  label: string;
  onPress: () => void;
  colors: [string, string];
  textColor?: string;
};

export function WorldButton({ label, onPress, colors, textColor = '#1A1004' }: WorldButtonProps) {
  const press = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(0.97, { duration: 70 });
      }}
      onPressOut={() => {
        press.value = withSpring(1, { damping: 14, stiffness: 240 });
      }}
      style={[styles.wrap, style]}
    >
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(244,215,138,0.45)',
  },
  fill: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
