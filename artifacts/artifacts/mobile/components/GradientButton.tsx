import React, { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { pressIn, pressOut } from '@/animations';
import { useRTL } from '@/hooks/useRTL';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type GradientTuple = readonly [string, string, ...string[]];

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  colors?: GradientTuple;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

const DEFAULT_COLORS: GradientTuple = [
  GameColors.accentGold,
  GameColors.accentOrange,
] as const;

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  colors = DEFAULT_COLORS,
  disabled = false,
  style,
  textStyle,
  testID,
}) => {
  const { textAlign } = useRTL();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => { scale.value = pressIn(); }, [scale]);
  const handlePressOut = useCallback(() => { scale.value = pressOut(); }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress]);

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      testID={testID}
      activeOpacity={1}
      style={[
        animatedStyle,
        styles.wrapper,
        disabled && styles.disabled,
        style,
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <Text style={[styles.text, { textAlign }, textStyle]}>{title}</Text>
      </LinearGradient>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: GameColors.accentGold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  disabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...Typography.body,
    color: GameColors.backgroundPrimary,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
});
