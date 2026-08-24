import React, { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { hapticsService } from '@/services/HapticsService';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { pressIn, pressOut } from '@/animations';
import { useRTL } from '@/hooks/useRTL';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
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
    hapticsService.impact(0);
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
      style={[animatedStyle, styles.button, disabled && styles.disabled, style]}
    >
      <Text style={[styles.text, { textAlign }, textStyle]}>{title}</Text>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: GameColors.accentGold,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GameColors.accentGold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  disabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    ...Typography.body,
    color: GameColors.backgroundPrimary,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
});
