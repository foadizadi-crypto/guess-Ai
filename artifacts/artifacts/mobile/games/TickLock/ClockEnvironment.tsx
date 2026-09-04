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
import { TickTone } from './tickTokens';

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

function Ring({ size, color, thickness }: { size: number; color: string; thickness: number }) {
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
        top: '48%',
        marginTop: -size / 2,
      }}
    />
  );
}

function GearTooth({
  index,
  total,
  radius,
  width,
  height,
  color,
}: {
  index: number;
  total: number;
  radius: number;
  width: number;
  height: number;
  color: string;
}) {
  const angle = (index / total) * 360;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width,
        height,
        marginLeft: -width / 2,
        marginTop: -height / 2,
        borderRadius: 1.5,
        backgroundColor: color,
        transform: [{ rotate: `${angle}deg` }, { translateY: -radius }],
      }}
    />
  );
}

function HourPip({ index, radius, hidden }: { index: number; radius: number; hidden: boolean }) {
  const angle = index * 30;
  const major = index % 3 === 0;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: major ? 5 : 3,
        height: major ? 14 : 8,
        marginLeft: major ? -2.5 : -1.5,
        marginTop: major ? -7 : -4,
        borderRadius: 2,
        backgroundColor: hidden
          ? major
            ? 'rgba(251,113,133,0.42)'
            : 'rgba(251,113,133,0.22)'
          : major
            ? TickTone.tick
            : 'rgba(94,234,212,0.38)',
        transform: [{ rotate: `${angle}deg` }, { translateY: -radius }],
      }}
    />
  );
}

function CaseArc({ side, size, color }: { side: 'left' | 'right'; size: number; color: string }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: '22%',
        [side]: -size * 0.42,
        width: size,
        height: size * 1.12,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  );
}

type ClockEnvironmentProps = {
  hidden?: boolean;
  running?: boolean;
};

export function ClockEnvironment({ hidden = false, running = false }: ClockEnvironmentProps) {
  const { width, height } = useWindowDimensions();
  const well = Math.min(width, height) * 0.78;
  const breathe = usePulse(0.96, running ? 1.06 : 1.03, hidden ? 900 : 3800);
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 28000, easing: Easing.linear }), -1, false);
  }, [spin]);

  const gearStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const core = hidden ? 'rgba(244,63,94,0.2)' : running ? 'rgba(94,234,212,0.2)' : 'rgba(139,164,184,0.14)';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <CaseArc side="left" size={width * 0.62} color={hidden ? 'rgba(136,19,55,0.16)' : 'rgba(28,44,58,0.55)'} />
      <CaseArc side="right" size={width * 0.62} color={hidden ? 'rgba(244,63,94,0.12)' : 'rgba(15,118,110,0.16)'} />

      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            alignSelf: 'center',
            top: height * 0.26,
            width: well,
            height: well,
            borderRadius: well / 2,
            backgroundColor: core,
          },
          breathe,
        ]}
      />

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          alignSelf: 'center',
          top: height * 0.28,
          width: well * 0.92,
          height: well * 0.92,
        }}
      >
        <Animated.View style={[StyleSheet.absoluteFill, gearStyle]}>
          {Array.from({ length: 16 }, (_, i) => (
            <GearTooth
              key={i}
              index={i}
              total={16}
              radius={well * 0.44}
              width={i % 2 === 0 ? 10 : 7}
              height={i % 2 === 0 ? 18 : 12}
              color={hidden ? 'rgba(251,113,133,0.2)' : 'rgba(94,234,212,0.16)'}
            />
          ))}
        </Animated.View>
        {Array.from({ length: 12 }, (_, i) => (
          <HourPip key={i} index={i} radius={well * 0.34} hidden={hidden} />
        ))}
      </View>

      <Ring size={well * 0.38} color="rgba(94,234,212,0.2)" thickness={1.25} />
      <Ring size={well * 0.56} color="rgba(139,164,184,0.28)" thickness={2} />
      <Ring size={well * 0.74} color="rgba(212,165,116,0.16)" thickness={1.25} />

      <LinearGradient colors={['rgba(5,8,15,0)', 'rgba(5,8,15,0.62)']} style={styles.floor} pointerEvents="none" />
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
