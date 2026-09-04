import React, { ReactNode, useEffect } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
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
} from "react-native-reanimated";

export type IconAnimation =
  | "float"
  | "pulse"
  | "spin"
  | "glow"
  | "shine"
  | "bounce"
  | "none";

interface AnimatedIconProps {
  children: ReactNode;
  animation?: IconAnimation;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedIcon({
  children,
  animation = "float",
  delay = 0,
  style,
}: AnimatedIconProps) {
  if (animation === "none") {
    return (
      <View pointerEvents="none" style={style}>
        {children}
      </View>
    );
  }

  return (
    <AnimatedIconMotion delay={delay} animation={animation} style={style}>
      {children}
    </AnimatedIconMotion>
  );
}

function AnimatedIconMotion({
  children,
  animation,
  delay = 0,
  style,
}: AnimatedIconProps & { animation: Exclude<IconAnimation, "none"> }) {
  const progress = useSharedValue(0);
  const isMounted = useSharedValue(true);

  useEffect(() => {
    isMounted.value = true;

    return () => {
      isMounted.value = false;
      cancelAnimation(progress);
    };
  }, []);

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;

    let duration = 1800;
    switch (animation) {
      case "pulse":
        duration = 1050;
        break;
      case "glow":
        duration = 1700;
        break;
      case "shine":
        duration = 3200;
        break;
      case "bounce":
        duration = 1400;
        break;
      case "spin":
        duration = 5200;
        break;
      case "float":
      default:
        duration = 1800;
        break;
    }

    const startAnimation = () => {
      if (!isMounted.value) return;

      if (animation === "spin") {
        progress.value = withDelay(
          Math.max(delay, 50),
          withRepeat(
            withTiming(1, {
              duration,
              easing: Easing.linear,
            }),
            -1,
            false,
          ),
        );
      } else {
        progress.value = withDelay(
          Math.max(delay, 50),
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
    };

    const timer = setTimeout(() => {
      startAnimation();
    }, 50);

    return () => {
      clearTimeout(timer);
      cancelAnimation(progress);
    };
  }, [animation, delay, progress, isMounted]);

  // --------------------------------------------------
  // ANIMATED STYLES
  // --------------------------------------------------

  const animatedStyle = useAnimatedStyle(() => {
    if (animation === "spin") {
      return {
        transform: [
          {
            rotate: `${interpolate(progress.value, [0, 1], [0, 360])}deg`,
          },
        ],
      };
    }

    if (animation === "pulse") {
      return {
        opacity: interpolate(progress.value, [0, 0.5, 1], [0.88, 1, 0.88]),
        transform: [
          {
            scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.045, 1]),
          },
        ],
      };
    }

    if (animation === "glow") {
      return {
        opacity: interpolate(progress.value, [0, 0.5, 1], [0.72, 1, 0.72]),
        transform: [
          {
            scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.035, 1]),
          },
        ],
      };
    }

    if (animation === "bounce") {
      return {
        transform: [
          {
            translateY: interpolate(
              progress.value,
              [0, 0.25, 0.5, 0.75, 1],
              [0, -5, 0, -2, 0],
            ),
          },
          {
            scale: interpolate(
              progress.value,
              [0, 0.25, 0.5, 0.75, 1],
              [1, 1.025, 1, 1.01, 1],
            ),
          },
        ],
      };
    }

    if (animation === "shine") {
      return {
        opacity: interpolate(
          progress.value,
          [0, 0.45, 0.5, 0.55, 1],
          [0.94, 1, 0.96, 1, 0.94],
        ),
        transform: [
          {
            scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.025, 1]),
          },
        ],
      };
    }

    // FLOAT
    return {
      transform: [
        {
          translateY: interpolate(progress.value, [0, 0.5, 1], [0, -3, 0]),
        },
        {
          rotate: `${interpolate(
            progress.value,
            [0, 0.5, 1],
            [-0.8, 0.8, -0.8],
          )}deg`,
        },
        {
          scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.025, 1]),
        },
      ],
    };
  });

  // --------------------------------------------------
  // SHINE STREAK
  // --------------------------------------------------

  const shineStyle = useAnimatedStyle(() => {
    if (animation !== "shine") {
      return {
        opacity: 0,
      };
    }

    const x = interpolate(
      progress.value,
      [0, 0.35, 0.65, 1],
      [-140, -20, 100, 220],
    );

    const opacity = interpolate(
      progress.value,
      [0, 0.25, 0.45, 0.6, 0.8, 1],
      [0, 0, 0.8, 0.9, 0, 0],
    );

    return {
      opacity,
      transform: [
        {
          translateX: x,
        },
        {
          rotate: "-25deg",
        },
      ],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[animatedStyle, style]}>
      {children}

      {animation === "shine" && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: "-30%",
            bottom: "-30%",
            left: 0,
            right: 0,
            overflow: "hidden",
            borderRadius: 999,
          }}
        >
          <Animated.View
            style={[
              {
                position: "absolute",
                top: "-20%",
                left: "40%",
                width: 22,
                height: "140%",
                backgroundColor: "rgba(255,255,255,0.75)",
                borderRadius: 999,
              },
              shineStyle,
            ]}
          />
        </View>
      )}
    </Animated.View>
  );
}
