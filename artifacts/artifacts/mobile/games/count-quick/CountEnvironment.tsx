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
import { CountTone } from './countTokens';

function usePulse(lo: number, hi: number, duration: number, delay = 0) {
  const scale = useSharedValue(lo);
  useEffect(() => {
    const id = setTimeout(() => {
      scale.value = withRepeat(
        withTiming(hi, { duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    }, delay);
    return () => clearTimeout(id);
  }, [delay, duration, hi, lo, scale]);
  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}

function HashCluster({
  x,
  y,
  bars,
  rotate,
}: {
  x: number;
  y: number;
  bars: number;
  rotate: string;
}) {
  return (
    <View
      pointerEvents="none"
      style={[styles.hashSeat, { left: `${x}%`, top: `${y}%`, transform: [{ rotate }] }]}
    >
      {Array.from({ length: bars }, (_, i) => (
        <View key={i} style={[styles.hashBar, i % 2 === 0 ? styles.hashTeal : styles.hashCoral]} />
      ))}
    </View>
  );
}

type CountEnvironmentProps = {
  urgency?: boolean;
};

export function CountEnvironment({ urgency = false }: CountEnvironmentProps) {
  const { width, height } = useWindowDimensions();
  const well = Math.min(width, height) * 0.78;
  const breathe = usePulse(0.96, 1.04, 3800);
  const core = urgency ? 'rgba(251,113,133,0.2)' : 'rgba(45,212,191,0.16)';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#061018', CountTone.tallyDeep, '#0B1C28', '#061018']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: width * 0.11,
          height: '100%',
          borderTopRightRadius: 22,
          borderBottomRightRadius: 22,
        }}
      />
      <LinearGradient
        colors={['#061018', CountTone.flashDeep, '#0B1C28', '#061018']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0 }}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: width * 0.11,
          height: '100%',
          borderTopLeftRadius: 22,
          borderBottomLeftRadius: 22,
        }}
      />

      <View
        style={{
          position: 'absolute',
          left: width * 0.08,
          top: height * 0.16,
          width: 7,
          height: height * 0.42,
          borderRadius: 4,
          backgroundColor: urgency ? 'rgba(251,113,133,0.28)' : 'rgba(45,212,191,0.28)',
          transform: [{ rotate: '-11deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: width * 0.08,
          top: height * 0.16,
          width: 7,
          height: height * 0.42,
          borderRadius: 4,
          backgroundColor: urgency ? 'rgba(251,113,133,0.3)' : 'rgba(251,113,133,0.22)',
          transform: [{ rotate: '11deg' }],
        }}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: (width - well) / 2,
            top: height * 0.24,
            width: well,
            height: well * 0.72,
            borderRadius: well / 2,
            backgroundColor: core,
          },
          breathe,
        ]}
      />

      <LinearGradient
        colors={['rgba(45,212,191,0.0)', 'rgba(45,212,191,0.22)', 'rgba(251,113,133,0.16)', 'rgba(45,212,191,0.0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{
          position: 'absolute',
          top: height * 0.34,
          left: width * 0.16,
          right: width * 0.16,
          height: 3,
          borderRadius: 2,
        }}
      />

      <HashCluster x={6} y={18} bars={3} rotate="-12deg" />
      <HashCluster x={86} y={16} bars={2} rotate="14deg" />
      <HashCluster x={8} y={72} bars={4} rotate="8deg" />
      <HashCluster x={82} y={76} bars={3} rotate="-18deg" />
      <HashCluster x={46} y={8} bars={2} rotate="0deg" />

      <LinearGradient colors={['rgba(6,16,24,0)', 'rgba(6,16,24,0.62)']} style={styles.floor} pointerEvents="none" />
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
  hashSeat: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 3,
  },
  hashBar: {
    width: 2.4,
    height: 18,
    borderRadius: 1,
    opacity: 0.34,
  },
  hashTeal: { backgroundColor: CountTone.tally },
  hashCoral: { backgroundColor: CountTone.flash },
});
