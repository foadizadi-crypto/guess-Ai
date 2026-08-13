import React, { ReactNode, useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export type IconAnimation = 'float' | 'pulse' | 'spin' | 'none';

interface AnimatedIconProps {
  children: ReactNode;
  animation?: IconAnimation;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared motion treatment for custom game artwork.
 *
 * The animation runs on the UI thread through Reanimated, so a lobby full of
 * icons does not create JS timers or re-render the screen on every frame.
 * `delay` staggers repeated icons deterministically instead of synchronizing
 * every asset into one distracting pulse.
 */
export function AnimatedIcon({
  children,
  animation = 'float',
  delay = 0,
  style,
}: AnimatedIconProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;

    if (animation === 'none') return;

    if (animation === 'spin') {
      progress.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, {
            duration: 5200,
            easing: Easing.linear,
          }),
          -1,
          false,
        ),
      );
    } else {
      const duration = animation === 'pulse' ? 1050 : 1800;
      progress.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, {
              duration,
              easing: Easing.inOut(Easing.sin),
            }),
            withTiming(0, {
              duration,
              easing: Easing.inOut(Easing.sin),
            }),
          ),
          -1,
          false,
        ),
      );
    }

    return () => cancelAnimation(progress);
  }, [animation, delay, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    if (animation === 'none') return {};

    if (animation === 'spin') {
      return {
        transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 360])}deg` }],
      };
    }

    if (animation === 'pulse') {
      return {
        opacity: interpolate(progress.value, [0, 0.5, 1], [0.9, 1, 0.9]),
        transform: [{ scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.045, 1]) }],
      };
    }

    return {
      transform: [
        { translateY: interpolate(progress.value, [0, 0.5, 1], [0, -3, 0]) },
        { rotate: `${interpolate(progress.value, [0, 0.5, 1], [-0.8, 0.8, -0.8])}deg` },
        { scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.025, 1]) },
      ],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}