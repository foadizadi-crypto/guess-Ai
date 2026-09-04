import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

function CornerVignette({
  position,
  size,
}: {
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  size: number;
}) {
  const isTop = position === 'topLeft' || position === 'topRight';
  const isLeft = position === 'topLeft' || position === 'bottomLeft';
  const start = { x: isLeft ? 0 : 1, y: isTop ? 0 : 1 };
  const end = { x: isLeft ? 1 : 0, y: isTop ? 1 : 0 };

  return (
    <LinearGradient
      colors={['rgba(4,2,12,0.62)', 'rgba(4,2,12,0.00)']}
      start={start}
      end={end}
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        ...(isTop ? { top: 0 } : { bottom: 0 }),
        ...(isLeft ? { left: 0 } : { right: 0 }),
      }}
    />
  );
}

function EdgeSpeck({
  x,
  y,
  size,
  opacity,
  duration,
  delay,
}: {
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}) {
  const { width, height } = useWindowDimensions();
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(withTiming(-22, { duration, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [delay, duration, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: x * width,
          top: y * height,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(233,213,255,0.9)',
        },
        style,
      ]}
    />
  );
}

export function MindForeground() {
  const { width } = useWindowDimensions();
  const corner = Math.max(120, width * 0.42);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <CornerVignette position="topLeft" size={corner} />
      <CornerVignette position="topRight" size={corner} />
      <CornerVignette position="bottomLeft" size={corner} />
      <CornerVignette position="bottomRight" size={corner} />
      <LinearGradient
        colors={['rgba(7,4,20,0.35)', 'transparent', 'rgba(7,4,20,0.5)']}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      <EdgeSpeck x={0.04} y={0.12} size={5} opacity={0.36} duration={6400} delay={0} />
      <EdgeSpeck x={0.93} y={0.18} size={6} opacity={0.32} duration={7100} delay={500} />
      <EdgeSpeck x={0.06} y={0.9} size={5} opacity={0.3} duration={5800} delay={900} />
      <EdgeSpeck x={0.92} y={0.86} size={6} opacity={0.34} duration={8000} delay={300} />
    </View>
  );
}
