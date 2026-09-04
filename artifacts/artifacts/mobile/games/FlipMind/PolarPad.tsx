import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { hapticsService } from '@/services/HapticsService';
import type { TargetColor } from './config';
import { MindTone } from './flipTokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PolarPadProps = {
  color: TargetColor;
  onPress: () => void;
  state?: 'idle' | 'selected' | 'correct' | 'wrong';
};

const TRAVEL = 9;

const PAD = {
  green: {
    cap: [MindTone.greenHot, MindTone.green, MindTone.greenDeep] as [string, string, string],
    led: MindTone.green,
    ledHot: 'rgba(110,231,183,0.95)',
    ledPool: 'rgba(52,211,153,0.7)',
    label: 'GREEN',
  },
  red: {
    cap: [MindTone.redHot, MindTone.red, MindTone.redDeep] as [string, string, string],
    led: MindTone.red,
    ledHot: 'rgba(251,113,133,0.95)',
    ledPool: 'rgba(244,63,94,0.7)',
    label: 'RED',
  },
};

function PlateScrew({ style }: { style: ViewStyle }) {
  return (
    <View pointerEvents="none" style={[styles.screw, style]}>
      <LinearGradient
        colors={[MindTone.metalHot, MindTone.metal, MindTone.metalDeep]}
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

export function PolarPad({ color, onPress, state = 'idle' }: PolarPadProps) {
  const press = useSharedValue(0);
  const lamp = useSharedValue(0);
  const tone = PAD[color];
  const lit = state === 'selected' || state === 'correct';
  const bad = state === 'wrong';
  const ledColor = bad ? MindTone.redHot : tone.led;

  useEffect(() => {
    lamp.value = withTiming(lit ? 1 : bad ? 0.85 : 0, { duration: 110 });
  }, [bad, lamp, lit]);

  const capStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: press.value * TRAVEL }],
  }));

  const stemStyle = useAnimatedStyle(() => ({
    height: interpolate(press.value, [0, 1], [11, 2]),
    opacity: interpolate(press.value, [0, 1], [0.55, 0.12]),
  }));

  const ledStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, interpolate(press.value, [0, 1], [0.34, 0.82]) + lamp.value * 0.42),
  }));

  const lampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(lamp.value, [0, 1], [0.2, 0.9]),
  }));

  return (
    <AnimatedPressable
      pointerEvents="box-only"
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(1, { duration: 70 });
        void hapticsService.selection();
      }}
      onPressOut={() => {
        press.value = withSpring(0, { damping: 15, stiffness: 320, mass: 0.42 });
      }}
      style={styles.wrap}
    >
      <View pointerEvents="none" style={styles.drop} />

      <LinearGradient
        pointerEvents="none"
        colors={[MindTone.metalHot, MindTone.metal, '#2A1060', MindTone.metalDeep]}
        locations={[0, 0.22, 0.62, 1]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.92, y: 1 }}
        style={styles.chassis}
      >
        <LinearGradient
          colors={['rgba(245,243,255,0.42)', 'rgba(76,29,149,0.2)', 'rgba(8,4,18,0.72)']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.bevel}
        >
          <View style={styles.plate}>
            <LinearGradient
              colors={['rgba(233,213,255,0.38)', 'transparent']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.7, y: 0.45 }}
              style={styles.plateSheen}
            />
            <View style={styles.well}>
              <Animated.View style={[styles.ledPool, ledStyle, { backgroundColor: tone.ledPool }]} />
              <Animated.View
                style={[
                  styles.ledRing,
                  lampStyle,
                  { borderColor: bad ? MindTone.redHot : tone.ledHot, shadowColor: ledColor },
                ]}
              />
            </View>
          </View>
        </LinearGradient>
        <PlateScrew style={styles.screwTL} />
        <PlateScrew style={styles.screwTR} />
        <PlateScrew style={styles.screwBL} />
        <PlateScrew style={styles.screwBR} />
      </LinearGradient>

      <Animated.View pointerEvents="none" style={[styles.stem, stemStyle]} />

      <Animated.View pointerEvents="none" style={[styles.cap, capStyle]}>
        <LinearGradient
          colors={['#3B2068', '#1A0C34', '#0A0614']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.capShell}
        >
          <LinearGradient colors={tone.cap} start={{ x: 0.18, y: 0 }} end={{ x: 0.82, y: 1 }} style={styles.capFace}>
            <LinearGradient
              colors={['rgba(255,255,255,0.46)', 'rgba(255,255,255,0.08)', 'transparent']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.75, y: 0.55 }}
              style={styles.capSheen}
            />
            <View style={styles.capLip} />
            <Animated.View style={[styles.legendGlow, lampStyle, { backgroundColor: `${tone.led}55` }]} />
            <Text style={[styles.label, { textShadowColor: `${tone.led}AA` }]}>{tone.label}</Text>
          </LinearGradient>
        </LinearGradient>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 132,
    height: 140,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  drop: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 2,
    height: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(4,0,14,0.55)',
  },
  chassis: {
    width: 124,
    height: 124,
    borderRadius: 22,
    padding: 3,
    overflow: 'hidden',
    shadowColor: MindTone.violet,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
  },
  bevel: {
    flex: 1,
    borderRadius: 19,
    padding: 3,
    overflow: 'hidden',
  },
  plate: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#14082C',
    overflow: 'hidden',
  },
  plateSheen: {
    ...StyleSheet.absoluteFillObject,
  },
  well: {
    ...StyleSheet.absoluteFillObject,
    margin: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(6,2,16,0.92)',
    overflow: 'hidden',
  },
  ledPool: {
    ...StyleSheet.absoluteFillObject,
  },
  ledRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  stem: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 22,
    width: 78,
    borderRadius: 6,
    backgroundColor: 'rgba(8,4,18,0.7)',
  },
  cap: {
    position: 'absolute',
    top: 8,
    left: 18,
    width: 96,
    height: 96,
  },
  capShell: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 5,
    paddingTop: 4,
    paddingBottom: 11,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  capFace: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  capSheen: {
    ...StyleSheet.absoluteFillObject,
  },
  capLip: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
  legendGlow: {
    position: 'absolute',
    width: 72,
    height: 28,
    borderRadius: 14,
  },
  label: {
    color: MindTone.ink,
    fontSize: 15,
    letterSpacing: 1.6,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
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
    backgroundColor: 'rgba(8,4,18,0.78)',
  },
  screwSlotCross: {
    transform: [{ rotate: '90deg' }],
  },
  screwTL: { top: 6, left: 6 },
  screwTR: { top: 6, right: 6 },
  screwBL: { bottom: 6, left: 6 },
  screwBR: { bottom: 6, right: 6 },
});
