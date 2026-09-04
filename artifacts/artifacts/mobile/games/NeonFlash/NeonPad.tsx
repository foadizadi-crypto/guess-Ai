import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { hapticsService } from '@/services/HapticsService';
import { FlashTone, hexAlpha } from './neonTokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type NeonPadProps = {
  color: string;
  light: string;
  lit: boolean;
  size: number;
  burst?: boolean;
  armed?: boolean;
  onPress: () => void;
};

function PlateScrew({ style }: { style: ViewStyle }) {
  return (
    <View pointerEvents="none" style={[styles.screw, style]}>
      <LinearGradient
        colors={[FlashTone.metalHot, FlashTone.metal, FlashTone.metalDeep]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.screwFill}
      >
        <View style={styles.screwSlot} />
        <View style={[styles.screwSlot, styles.screwSlotCross]} />
      </LinearGradient>
    </View>
  );
}

export function NeonPad({
  color,
  light,
  lit,
  size,
  burst = true,
  armed = true,
  onPress,
}: NeonPadProps) {
  const glow = useSharedValue(0);
  const press = useSharedValue(0);
  const radius = Math.max(18, size * 0.2);
  const travel = Math.max(5, size * 0.055);
  const bloom = size * 1.18;
  const dimLight = hexAlpha(light, 0.45);
  const pool = hexAlpha(light, 0.7);
  const bloomFill = hexAlpha(light, 0.55);
  const bloomHi = burst ? 0.78 : 0.5;

  useEffect(() => {
    glow.value = withTiming(lit ? 1 : 0, { duration: 80, easing: Easing.out(Easing.cubic) });
  }, [glow, lit]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: press.value * travel },
      { scale: interpolate(press.value, [0, 1], [1, 0.96]) * interpolate(glow.value, [0, 1], [1, 1.04]) },
    ],
  }));

  const bloomStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.12, bloomHi]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.88, 1.12]) }],
  }));

  const poolStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.22, 0.92]),
  }));

  const faceStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(glow.value, [0, 1], [color, light]),
  }));

  const sheenStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.16, 0.48]),
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.35, 1]),
    borderColor: interpolateColor(glow.value, [0, 1], [dimLight, light]),
  }));

  return (
    <AnimatedPressable
      pointerEvents="box-only"
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(1, { duration: 70 });
        if (armed) void hapticsService.selection();
      }}
      onPressOut={() => {
        press.value = withSpring(0, { damping: 15, stiffness: 320, mass: 0.42 });
      }}
      style={[{ width: size, height: size }, wrapStyle]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bloom,
          bloomStyle,
          {
            width: bloom,
            height: bloom,
            left: (size - bloom) / 2,
            top: (size - bloom) / 2,
            borderRadius: radius + 8,
            backgroundColor: bloomFill,
            shadowColor: light,
          },
        ]}
      />

      <LinearGradient
        pointerEvents="none"
        colors={[FlashTone.metalHot, FlashTone.metal, '#1A0A36', FlashTone.metalDeep]}
        locations={[0, 0.2, 0.62, 1]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.92, y: 1 }}
        style={[
          styles.chassis,
          {
            width: size,
            height: size,
            borderRadius: radius,
            shadowColor: color,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(247,244,255,0.38)', 'rgba(42,11,92,0.22)', 'rgba(4,1,12,0.72)']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={[styles.bevel, { borderRadius: radius - 3 }]}
        >
          <View style={[styles.well, { borderRadius: radius - 7 }]}>
            <Animated.View style={[styles.ledPool, poolStyle, { backgroundColor: pool }]} />
            <Animated.View style={[styles.face, faceStyle]} />
            <Animated.View pointerEvents="none" style={[styles.sheen, sheenStyle]} />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(255,255,255,0.42)', 'rgba(255,255,255,0.06)', 'transparent']}
              start={{ x: 0.18, y: 0 }}
              end={{ x: 0.78, y: 0.58 }}
              style={styles.capSheen}
            />
            <View style={styles.capLip} />
            <Animated.View style={[styles.ledRing, ringStyle, { borderRadius: radius - 12, shadowColor: light }]} />
          </View>
        </LinearGradient>
        <PlateScrew style={styles.screwTL} />
        <PlateScrew style={styles.screwTR} />
        <PlateScrew style={styles.screwBL} />
        <PlateScrew style={styles.screwBR} />
      </LinearGradient>
    </AnimatedPressable>
  );
}

type NeonCabinetProps = {
  size: number;
  watching: boolean;
  children: React.ReactNode;
};

export function NeonCabinet({ size, watching, children }: NeonCabinetProps) {
  const pulse = useSharedValue(0.35);

  useEffect(() => {
    pulse.value = watching
      ? withRepeat(withTiming(1, { duration: 520, easing: Easing.inOut(Easing.sin) }), -1, true)
      : withTiming(0.35, { duration: 180 });
  }, [pulse, watching]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const frameRadius = Math.max(26, size * 0.12);

  return (
    <View style={[styles.cabinetWrap, { width: size, height: size }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.cabinetGlow,
          glowStyle,
          {
            width: size + 28,
            height: size + 28,
            borderRadius: frameRadius + 6,
          },
        ]}
      />
      <LinearGradient
        colors={[FlashTone.metalHot, FlashTone.cyan, FlashTone.metalDeep, FlashTone.magenta, FlashTone.metalHot]}
        locations={[0, 0.18, 0.5, 0.82, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cabinetBezel, { borderRadius: frameRadius }]}
      >
        <LinearGradient
          colors={['rgba(18,8,40,0.96)', 'rgba(6,2,16,0.98)', 'rgba(12,6,28,0.96)']}
          style={[styles.cabinetWell, { borderRadius: Math.max(22, size * 0.1) }]}
        >
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(243,232,255,0.28)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.cabinetHair}
          />
          {children}
        </LinearGradient>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  bloom: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
  },
  chassis: {
    alignSelf: 'center',
    padding: 3,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 12,
  },
  bevel: {
    flex: 1,
    padding: 3,
    overflow: 'hidden',
  },
  well: {
    flex: 1,
    backgroundColor: 'rgba(6,2,16,0.92)',
    overflow: 'hidden',
  },
  ledPool: {
    ...StyleSheet.absoluteFillObject,
  },
  face: {
    ...StyleSheet.absoluteFillObject,
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  capSheen: {
    ...StyleSheet.absoluteFillObject,
  },
  capLip: {
    position: 'absolute',
    top: 5,
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.34)',
  },
  ledRing: {
    ...StyleSheet.absoluteFillObject,
    margin: 8,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  screw: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 6,
    overflow: 'hidden',
  },
  screwFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screwSlot: {
    position: 'absolute',
    width: 7,
    height: 1.4,
    borderRadius: 1,
    backgroundColor: 'rgba(6,2,16,0.78)',
  },
  screwSlotCross: {
    transform: [{ rotate: '90deg' }],
  },
  screwTL: { top: 6, left: 6 },
  screwTR: { top: 6, right: 6 },
  screwBL: { bottom: 6, left: 6 },
  screwBR: { bottom: 6, right: 6 },
  cabinetWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cabinetGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(34,240,255,0.28)',
  },
  cabinetBezel: {
    width: '100%',
    height: '100%',
    padding: 3,
    overflow: 'hidden',
    shadowColor: FlashTone.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 14,
  },
  cabinetWell: {
    flex: 1,
    overflow: 'visible',
    padding: 12,
  },
  cabinetHair: {
    position: 'absolute',
    top: 6,
    left: 16,
    right: 16,
    height: 1.5,
  },
});
