import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { CountTone } from './countTokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SnapButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
};

export function SnapButton({ label, onPress, disabled = false, testID }: SnapButtonProps) {
  const press = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
    opacity: disabled ? 0.62 : 1,
  }));

  return (
    <AnimatedPressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        if (disabled) return;
        press.value = withTiming(0.97, { duration: 70 });
      }}
      onPressOut={() => {
        press.value = withSpring(1, { damping: 14, stiffness: 240 });
      }}
      style={[styles.wrap, style]}
    >
      <View pointerEvents="none" style={styles.halo} />
      <LinearGradient
        colors={[CountTone.flashHot, CountTone.flash, CountTone.flashDeep, CountTone.flash, CountTone.flashHot]}
        locations={[0, 0.18, 0.5, 0.82, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.bezel}
      >
        <LinearGradient
          colors={['rgba(254,205,211,0.42)', 'rgba(136,19,55,0.35)', 'rgba(251,113,133,0.22)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.lip}
        >
          <LinearGradient
            colors={[CountTone.flashHot, CountTone.flash, CountTone.flashDeep]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={styles.well}
          >
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(255,255,255,0.42)', 'transparent']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.7, y: 0.55 }}
              style={styles.sheen}
            />
            <Text style={styles.label}>{label}</Text>
          </LinearGradient>
        </LinearGradient>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    position: 'relative',
    shadowColor: CountTone.flash,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 8,
  },
  halo: {
    position: 'absolute',
    top: -3,
    right: -3,
    bottom: -3,
    left: -3,
    borderRadius: 20,
    backgroundColor: 'rgba(251,113,133,0.18)',
  },
  bezel: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  lip: {
    margin: 1.5,
    borderRadius: 16,
    overflow: 'hidden',
  },
  well: {
    margin: 2,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    overflow: 'hidden',
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
  },
  label: {
    color: CountTone.ink,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(136,19,55,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
