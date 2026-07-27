import React, { useCallback } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { GameColors } from '@/theme/colors';
import { pressIn, pressOut } from '@/animations';
import { useRTL } from '@/hooks/useRTL';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface BackButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
  iconColor?: string;
  testID?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  style,
  iconColor = GameColors.textWhite,
  testID,
}) => {
  const { isRTL } = useRTL();
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => { scale.value = pressIn(); }, [scale]);
  const handlePressOut = useCallback(() => { scale.value = pressOut(); }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  }, [onPress, router]);

  // Flip arrow direction for RTL
  const iconName = isRTL ? 'chevron-forward' : 'chevron-back';

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      testID={testID}
      activeOpacity={1}
      style={[animatedStyle, styles.button, style]}
    >
      <Ionicons name={iconName} size={24} color={iconColor} />
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
