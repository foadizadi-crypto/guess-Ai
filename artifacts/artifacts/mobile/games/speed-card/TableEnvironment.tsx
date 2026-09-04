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
import { SpeedTone } from './speedTokens';

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

function Rail({ side, width }: { side: 'left' | 'right'; width: number }) {
  const colors: [string, string, string, string] =
    side === 'left'
      ? ['#2A1018', '#5A2830', SpeedTone.crimsonDeep, '#1A080E']
      : ['#1A080E', SpeedTone.crimsonDeep, '#5A2830', '#2A1018'];
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [side]: 0,
        width: Math.max(18, width * 0.08),
      }}
    />
  );
}

function Chevron({ top, width, flip }: { top: number; width: number; flip?: boolean }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top,
        left: width * 0.18,
        width: width * 0.64,
        height: 10,
        transform: [{ scaleX: flip ? -1 : 1 }],
      }}
    >
      <LinearGradient
        colors={['transparent', 'rgba(125,211,252,0.28)', 'rgba(251,191,36,0.55)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.chevron}
      />
    </View>
  );
}

type TableEnvironmentProps = {
  urgency?: boolean;
};

export function TableEnvironment({ urgency = false }: TableEnvironmentProps) {
  const { width, height } = useWindowDimensions();
  const wellW = width * 0.86;
  const wellH = height * 0.42;
  const breathe = usePulse(0.96, 1.04, 3800);
  const core = urgency ? 'rgba(251,113,133,0.22)' : 'rgba(125,211,252,0.14)';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Rail side="left" width={width} />
      <Rail side="right" width={width} />

      <LinearGradient
        colors={[SpeedTone.snapHot, SpeedTone.crimsonDeep, SpeedTone.snap, SpeedTone.crimsonDeep, SpeedTone.snapHot]}
        locations={[0, 0.18, 0.5, 0.82, 1]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.92, y: 1 }}
        style={{
          position: 'absolute',
          top: height * 0.22,
          width: wellW,
          height: wellH,
          borderRadius: wellW * 0.18,
          left: (width - wellW) / 2,
          padding: 3,
        }}
      >
        <LinearGradient
          colors={['#140810', SpeedTone.feltHot, SpeedTone.felt, '#10060C']}
          style={styles.feltWell}
        >
          <View pointerEvents="none" style={styles.feltStitch} />
          <View pointerEvents="none" style={styles.feltDiamond} />
        </LinearGradient>
      </LinearGradient>

      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            alignSelf: 'center',
            left: (width - wellW * 0.55) / 2,
            top: height * 0.28,
            width: wellW * 0.55,
            height: wellW * 0.55,
            borderRadius: wellW * 0.28,
            backgroundColor: core,
          },
          breathe,
        ]}
      />

      <Chevron top={height * 0.08} width={width} />
      <Chevron top={height * 0.11} width={width} flip />
      <Chevron top={height * 0.14} width={width} />

      <LinearGradient
        colors={['rgba(8,4,15,0)', 'rgba(8,4,15,0.62)']}
        style={styles.floor}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  feltWell: {
    flex: 1,
    borderRadius: 36,
    overflow: 'hidden',
  },
  feltStitch: {
    ...StyleSheet.absoluteFillObject,
    margin: 14,
    borderRadius: 28,
    borderWidth: 1.25,
    borderStyle: 'dashed',
    borderColor: 'rgba(251,191,36,0.22)',
  },
  feltDiamond: {
    position: 'absolute',
    alignSelf: 'center',
    top: '42%',
    width: 18,
    height: 18,
    transform: [{ rotate: '45deg' }],
    borderWidth: 1.5,
    borderColor: 'rgba(125,211,252,0.28)',
  },
  chevron: {
    flex: 1,
    borderRadius: 5,
  },
  floor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
  },
});
