import React, { useCallback } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { hapticsService } from '@/services/HapticsService';
import { useRouter } from 'expo-router';
import { GameColors } from '@/theme/colors';
import { pressIn, pressOut } from '@/animations';
import { useRTL } from '@/hooks/useRTL';
import { ROUTES } from '@/navigation/routes';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface BackButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
  iconColor?: string;
  testID?: string;
  /**
   * Where to go when there is nothing to go back to (deep link, cold start,
   * or a screen reached via router.replace). Defaults to the lobby.
   */
  fallbackRoute?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  style,
  iconColor = GameColors.textWhite,
  testID,
  fallbackRoute = ROUTES.LOBBY,
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
    hapticsService.impact(0);
    if (onPress) {
      onPress();
      return;
    }
    // router.back() is a no-op with an empty history stack, which strands the
    // player on the screen. Fall back to a real destination in that case.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackRoute as never);
    }
  }, [fallbackRoute, onPress, router]);

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
