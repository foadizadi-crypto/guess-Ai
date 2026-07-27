import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';

interface FloatingTextProps {
  text: string;
  color?: string;
  x?: number;
  y?: number;
  onComplete?: () => void;
}

export const FloatingText: React.FC<FloatingTextProps> = ({
  text,
  color = GameColors.accentGold,
  x = 0,
  y = 0,
  onComplete,
}) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    // Pop in
    scale.value = withTiming(1.1, { duration: 200, easing: Easing.out(Easing.back(2)) });
    // Slide up
    translateY.value = withTiming(-70, { duration: 1200, easing: Easing.out(Easing.cubic) });
    // Fade out after brief hold
    opacity.value = withSequence(
      withTiming(1, { duration: 250 }),
      withTiming(0, {
        duration: 950,
        easing: Easing.in(Easing.cubic),
      }, (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      }),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, { left: x, top: y }]}>
      <Text style={[styles.text, { color }]}>{text}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 100,
  },
  text: {
    ...Typography.body,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
