import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { TrapTone } from './trapTokens';

function usePulse(lo: number, hi: number, duration: number, delay = 0) {
  const scale = useSharedValue(lo);
  useEffect(() => {
    const id = setTimeout(() => {
      scale.value = withRepeat(withTiming(hi, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
    }, delay);
    return () => clearTimeout(id);
  }, [delay, duration, hi, lo, scale]);
  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}

function Ring({ size, color, thickness, offsetX = 0 }: { size: number; color: string; thickness: number; offsetX?: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: thickness,
        borderColor: color,
        alignSelf: 'center',
        top: '42%',
        marginTop: -size / 2,
        marginLeft: offsetX,
      }}
    />
  );
}

function ColorWell({
  side,
  color,
  size,
}: {
  side: 'left' | 'right';
  color: string;
  size: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: '24%',
        [side]: -size * 0.32,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  );
}

function Node({
  x,
  y,
  size,
  color,
  delay,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
}) {
  const pulse = usePulse(0.86, 1.14, 2600 + delay, delay);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        pulse,
      ]}
    />
  );
}

type TrapEnvironmentProps = {
  urgency?: boolean;
};

export function TrapEnvironment({ urgency = false }: TrapEnvironmentProps) {
  const { width, height } = useWindowDimensions();
  const well = Math.min(width, height) * 0.7;
  const breathe = usePulse(0.96, 1.06, 4400);
  const core = urgency ? 'rgba(255,45,149,0.24)' : 'rgba(139,92,246,0.18)';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <ColorWell side="left" color={urgency ? 'rgba(255,45,149,0.1)' : 'rgba(255,45,149,0.16)'} size={width * 0.72} />
      <ColorWell side="right" color={urgency ? 'rgba(34,211,238,0.08)' : 'rgba(34,211,238,0.18)'} size={width * 0.72} />

      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            alignSelf: 'center',
            top: height * 0.2,
            width: well,
            height: well,
            borderRadius: well / 2,
            backgroundColor: core,
          },
          breathe,
        ]}
      />

      <Ring size={well * 0.4} color="rgba(255,45,149,0.28)" thickness={1.5} offsetX={-14} />
      <Ring size={well * 0.4} color="rgba(34,211,238,0.26)" thickness={1.5} offsetX={14} />
      <Ring size={well * 0.62} color="rgba(139,92,246,0.26)" thickness={2} />
      <Ring size={well * 0.86} color="rgba(197,206,224,0.14)" thickness={1.25} />

      <LinearGradient colors={['rgba(7,4,15,0)', 'rgba(7,4,15,0.62)']} style={styles.floor} pointerEvents="none" />

      <Node x={10} y={20} size={7} color={TrapTone.magentaHot} delay={0} />
      <Node x={86} y={16} size={6} color={TrapTone.cyanHot} delay={400} />
      <Node x={16} y={70} size={8} color={TrapTone.cyan} delay={800} />
      <Node x={80} y={74} size={7} color={TrapTone.magenta} delay={1200} />
      <Node x={48} y={10} size={5} color={TrapTone.chromeHot} delay={600} />
    </View>
  );
}

const styles = StyleSheet.create({
  floor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
  },
});
