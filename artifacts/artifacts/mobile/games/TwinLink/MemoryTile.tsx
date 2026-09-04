import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { hapticsService } from '@/services/HapticsService';
import { TwinTone } from './twinTokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type MemoryTileProps = {
  icon: string;
  revealed: boolean;
  matched: boolean;
  size: number;
  index: number;
  onPress: () => void;
};

function TwinMark({ size }: { size: number }) {
  const dot = Math.max(7, size * 0.14);
  const bridge = Math.max(10, size * 0.22);
  return (
    <View style={styles.markRow}>
      <LinearGradient
        colors={[TwinTone.cyanHot, TwinTone.cyanDeep]}
        style={{ width: dot, height: dot, borderRadius: dot / 2 }}
      />
      <LinearGradient
        colors={[TwinTone.cyan, TwinTone.link, TwinTone.rose]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ width: bridge, height: 3, borderRadius: 2 }}
      />
      <LinearGradient
        colors={[TwinTone.roseHot, TwinTone.roseDeep]}
        style={{ width: dot, height: dot, borderRadius: dot / 2 }}
      />
    </View>
  );
}

export function MemoryTile({ icon, revealed, matched, size, index, onPress }: MemoryTileProps) {
  const flip = useSharedValue(revealed ? 1 : 0);
  const press = useSharedValue(1);
  const enter = useSharedValue(0);
  const shine = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    enter.value = withDelay(60 + index * 42, withSpring(1, { damping: 16, stiffness: 180, mass: 0.8 }));
  }, [enter, index]);

  useEffect(() => {
    flip.value = withSpring(revealed ? 1 : 0, { damping: 13, stiffness: 170, mass: 0.7 });
    if (revealed) {
      shine.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
    } else {
      shine.value = 0;
    }
  }, [flip, revealed, shine]);

  useEffect(() => {
    if (matched) {
      pulse.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), -1, true);
    } else {
      pulse.value = withTiming(0, { duration: 180 });
    }
  }, [matched, pulse]);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateY: interpolate(enter.value, [0, 1], [16, 0]) },
      { scale: press.value * interpolate(enter.value, [0, 1], [0.9, 1]) },
    ],
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1100 }, { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` }],
    opacity: flip.value < 0.5 ? 1 : 0,
  }));

  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1100 }, { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` }],
    opacity: flip.value >= 0.5 ? 1 : 0,
  }));

  const lightStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shine.value, [0, 1], [0, 0.38]),
  }));

  const matchGlow = useAnimatedStyle(() => ({
    opacity: matched ? 0.28 + pulse.value * 0.22 : 0,
    transform: [{ scale: 1 + pulse.value * 0.04 }],
  }));

  const radius = Math.max(12, size * 0.18);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(0.94, { duration: 70 });
        void hapticsService.selection();
      }}
      onPressOut={() => {
        press.value = withSpring(1, { damping: 12, stiffness: 260 });
      }}
      style={[{ width: size, height: size }, wrapStyle]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.shadow,
          {
            borderRadius: radius,
            shadowColor: matched ? TwinTone.cyan : TwinTone.link,
            shadowOpacity: matched ? 0.62 : 0.32,
          },
        ]}
      />
      <Animated.View pointerEvents="none" style={[styles.matchHalo, { borderRadius: radius + 4 }, matchGlow]} />

      <Animated.View style={[styles.face, backStyle, { borderRadius: radius, borderColor: 'rgba(94,234,212,0.38)' }]}>
        <LinearGradient
          colors={['#2A1B4A', TwinTone.enamel, '#0E0A1C']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.fill}
        >
          <LinearGradient
            colors={['rgba(94,234,212,0.28)', 'transparent', 'rgba(240,171,252,0.22)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sheen}
          />
          <View style={styles.innerRing} />
          <TwinMark size={size} />
        </LinearGradient>
      </Animated.View>

      <Animated.View
        style={[
          styles.face,
          faceStyle,
          {
            borderRadius: radius,
            borderColor: matched ? TwinTone.cyanHot : 'rgba(233,213,255,0.55)',
          },
        ]}
      >
        <LinearGradient
          colors={[TwinTone.porcelain, '#FFFFFF', TwinTone.porcelainDeep]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.fill}
        >
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0.7)', 'transparent', 'rgba(20,12,40,0.12)']}
            style={styles.sheen}
          />
          <Animated.View pointerEvents="none" style={[styles.flash, lightStyle]} />
          <Text style={[styles.icon, { fontSize: Math.max(22, size * 0.38) }]}>{icon}</Text>
        </LinearGradient>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    elevation: 12,
  },
  matchHalo: {
    ...StyleSheet.absoluteFillObject,
    margin: -3,
    backgroundColor: 'rgba(94,234,212,0.35)',
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    borderWidth: 1.5,
  },
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TwinTone.cyanHot,
  },
  innerRing: {
    position: 'absolute',
    top: 8,
    right: 8,
    bottom: 8,
    left: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(233,213,255,0.22)',
  },
  markRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    textAlign: 'center',
  },
});
