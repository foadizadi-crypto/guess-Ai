import React, { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { hapticsService } from '@/services/HapticsService';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { pressIn, pressOut } from '@/animations';
import { useRTL } from '@/hooks/useRTL';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  borderColor?: string;
  testID?: string;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  borderColor = GameColors.accentGold,
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
      style={[
        animatedStyle,
        styles.button,
        { borderColor },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.text, { color: borderColor, textAlign }, textStyle]}>{title}</Text>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GameColors.transparent,
  },
  disabled: { opacity: 0.45 },
  text: {
    ...Typography.body,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
});
