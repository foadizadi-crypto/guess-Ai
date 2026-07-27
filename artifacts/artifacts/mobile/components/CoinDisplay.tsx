import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { CoinIcon } from '@/assets/icons';
import { formatCoins } from '@/utils';

interface CoinDisplayProps {
  amount: number;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  animate?: boolean;
}

export const CoinDisplay: React.FC<CoinDisplayProps> = ({
  amount,
  size = 'medium',
  style,
  animate = false,
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (animate) {
      scale.value = withSequence(
        withSpring(1.25, { damping: 10, stiffness: 300 }),
        withSpring(1, { damping: 15, stiffness: 200 }),
      );
    }
  }, [amount, animate, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconSize = size === 'small' ? 14 : size === 'large' ? 26 : 20;

  const textStyles = {
    small: styles.textSmall,
    medium: styles.textMedium,
    large: styles.textLarge,
  };

  const containerStyles = {
    small: styles.containerSmall,
    medium: styles.containerMedium,
    large: styles.containerLarge,
  };

  return (
    <Animated.View style={[styles.base, containerStyles[size], animatedStyle, style]}>
      <CoinIcon size={iconSize} />
      <Text style={[styles.text, textStyles[size]]}>{formatCoins(amount)}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GameColors.coinBg,
    borderWidth: 1,
    borderColor: GameColors.coinBorder,
    borderRadius: 20,
  },
  containerSmall: { gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  containerMedium: { gap: 6, paddingHorizontal: 12, paddingVertical: 6 },
  containerLarge: { gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  text: {
    fontFamily: 'Inter_700Bold',
    color: GameColors.accentGold,
  },
  textSmall: { ...Typography.small, fontFamily: 'Inter_700Bold', color: GameColors.accentGold },
  textMedium: { ...Typography.bodyMedium, fontFamily: 'Inter_700Bold', color: GameColors.accentGold },
  textLarge: { ...Typography.body, fontFamily: 'Inter_700Bold', color: GameColors.accentGold },
});
