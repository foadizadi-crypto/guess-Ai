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
import { FindTone } from './searchTokens';

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

function WoodShelf({
  side,
  top,
  width: boardW,
}: {
  side: 'left' | 'right';
  top: number;
  width: number;
}) {
  return (
    <LinearGradient
      colors={['#2A160A', '#5A3414', '#3A2010', '#1A0C06']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      pointerEvents="none"
      style={{
        position: 'absolute',
        top,
        [side]: 0,
        width: boardW,
        height: 11,
        borderRadius: 3,
        opacity: 0.78,
      }}
    />
  );
}

function Upright({ side, width: screenW, height }: { side: 'left' | 'right'; width: number; height: number }) {
  const thick = Math.max(18, screenW * 0.07);
  return (
    <LinearGradient
      colors={side === 'left' ? ['#120804', '#3A2210', '#241408', '#100806'] : ['#100806', '#241408', '#3A2210', '#120804']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        [side]: 0,
        width: thick,
        height,
        opacity: 0.9,
      }}
    />
  );
}

type SearchEnvironmentProps = {
  blackout?: boolean;
  urgency?: boolean;
};

export function SearchEnvironment({ blackout = false, urgency = false }: SearchEnvironmentProps) {
  const { width, height } = useWindowDimensions();
  const lamp = usePulse(blackout ? 0.72 : 0.94, blackout ? 0.82 : 1.08, blackout ? 2200 : 3800);
  const coneH = height * (blackout ? 0.28 : 0.52);
  const coneW = width * (blackout ? 0.42 : 0.7);
  const shelfW = width * 0.16;
  const lampSize = blackout ? 36 : 52;
  const core = blackout
    ? 'rgba(255,112,67,0.08)'
    : urgency
      ? 'rgba(255,77,109,0.22)'
      : 'rgba(255,176,136,0.28)';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[FindTone.void, FindTone.velvet, '#120A14']}
        style={StyleSheet.absoluteFill}
      />

      <Upright side="left" width={width} height={height} />
      <Upright side="right" width={width} height={height} />

      <LinearGradient
        colors={['#3A2410', '#6A4018', FindTone.brass, '#2A1808']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        pointerEvents="none"
        style={styles.beam}
      />
      <LinearGradient
        colors={[FindTone.brassHot, FindTone.brassDeep]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        pointerEvents="none"
        style={styles.beamLip}
      />

      <View pointerEvents="none" style={[styles.plaque, { left: width * 0.09, top: height * 0.28 }]}>
        <LinearGradient colors={[FindTone.brassHot, FindTone.brassDeep]} style={styles.plaqueFill} />
      </View>
      <View pointerEvents="none" style={[styles.plaque, { right: width * 0.09, top: height * 0.42 }]}>
        <LinearGradient colors={[FindTone.brass, FindTone.brassDeep]} style={styles.plaqueFill} />
      </View>

      <WoodShelf side="left" top={height * 0.22} width={shelfW} />
      <WoodShelf side="left" top={height * 0.38} width={shelfW * 1.1} />
      <WoodShelf side="left" top={height * 0.56} width={shelfW} />
      <WoodShelf side="left" top={height * 0.74} width={shelfW * 0.92} />
      <WoodShelf side="right" top={height * 0.2} width={shelfW} />
      <WoodShelf side="right" top={height * 0.36} width={shelfW * 1.08} />
      <WoodShelf side="right" top={height * 0.54} width={shelfW} />
      <WoodShelf side="right" top={height * 0.72} width={shelfW * 0.9} />

      <View
        pointerEvents="none"
        style={[
          styles.cord,
          { height: height * 0.08, backgroundColor: blackout ? 'rgba(90,52,20,0.35)' : 'rgba(90,52,20,0.7)' },
        ]}
      />
      <LinearGradient
        colors={[FindTone.brassHot, FindTone.brass, FindTone.brassDeep]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        pointerEvents="none"
        style={[
          styles.lampCup,
          {
            top: height * 0.055,
            opacity: blackout ? 0.4 : 1,
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            alignSelf: 'center',
            top: height * 0.06,
            width: lampSize,
            height: lampSize,
            borderRadius: lampSize / 2,
            backgroundColor: core,
          },
          lamp,
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.lampRing,
          {
            top: height * 0.06 + 6,
            width: lampSize - 12,
            height: lampSize - 12,
            borderRadius: (lampSize - 12) / 2,
            borderColor: blackout ? 'rgba(196,132,58,0.28)' : FindTone.brass,
          },
        ]}
      />

      <LinearGradient
        colors={
          blackout
            ? ['rgba(255,112,67,0.06)', 'rgba(255,112,67,0.02)', 'transparent']
            : urgency
              ? ['rgba(255,77,109,0.28)', 'rgba(255,112,67,0.1)', 'transparent']
              : ['rgba(255,176,136,0.34)', 'rgba(196,132,58,0.12)', 'transparent']
        }
        pointerEvents="none"
        style={{
          position: 'absolute',
          alignSelf: 'center',
          top: height * 0.1,
          width: coneW,
          height: coneH,
          borderBottomLeftRadius: coneW,
          borderBottomRightRadius: coneW,
        }}
      />

      <LinearGradient
        colors={['rgba(10,6,4,0)', blackout ? 'rgba(4,2,2,0.82)' : 'rgba(8,4,4,0.62)']}
        pointerEvents="none"
        style={styles.floor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  beam: {
    position: 'absolute',
    top: 0,
    left: '8%',
    right: '8%',
    height: 12,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    opacity: 0.88,
  },
  beamLip: {
    position: 'absolute',
    top: 10,
    left: '12%',
    right: '12%',
    height: 2,
    opacity: 0.55,
  },
  plaque: {
    position: 'absolute',
    width: 22,
    height: 28,
    borderRadius: 3,
    overflow: 'hidden',
    opacity: 0.42,
  },
  plaqueFill: {
    flex: 1,
  },
  lampCup: {
    position: 'absolute',
    alignSelf: 'center',
    width: 28,
    height: 10,
    borderRadius: 4,
  },
  cord: {
    position: 'absolute',
    alignSelf: 'center',
    top: 8,
    width: 3,
    borderRadius: 2,
  },
  lampRing: {
    position: 'absolute',
    alignSelf: 'center',
    borderWidth: 2,
  },
  floor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
  },
});
