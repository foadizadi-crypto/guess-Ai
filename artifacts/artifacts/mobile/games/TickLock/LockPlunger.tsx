import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { hapticsService } from '@/services/HapticsService';
import { TickTone } from './tickTokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const TRAVEL = 10;

const MODE = {
  start: {
    cap: [TickTone.goHot, TickTone.go, TickTone.goDeep] as [string, string, string],
    pool: 'rgba(52,211,153,0.7)',
    ring: TickTone.goHot,
    label: 'START',
  },
  stop: {
    cap: [TickTone.stopHot, TickTone.stop, TickTone.stopDeep] as [string, string, string],
    pool: 'rgba(244,63,94,0.7)',
    ring: TickTone.stopHot,
    label: 'STOP',
  },
};

function PlateScrew({ style }: { style: object }) {
  return (
    <View pointerEvents="none" style={[styles.screw, style]}>
      <LinearGradient
        colors={[TickTone.steelHot, TickTone.steel, TickTone.steelDeep]}
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

export function LockPlunger({
  mode,
  onPress,
}: {
  mode: 'start' | 'stop';
  onPress: () => void;
}) {
  const press = useSharedValue(0);
  const tone = MODE[mode];

  const capStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: press.value * TRAVEL }],
  }));

  const stemStyle = useAnimatedStyle(() => ({
    height: interpolate(press.value, [0, 1], [12, 3]),
    opacity: interpolate(press.value, [0, 1], [0.55, 0.14]),
  }));

  const poolStyle = useAnimatedStyle(() => ({
    opacity: interpolate(press.value, [0, 1], [0.34, 0.82]),
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
        colors={[TickTone.steelHot, TickTone.steel, TickTone.steelDeep, '#0A1420']}
        locations={[0, 0.22, 0.62, 1]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.92, y: 1 }}
        style={styles.chassis}
      >
        <LinearGradient
          colors={['rgba(232,242,248,0.42)', 'rgba(28,44,58,0.2)', 'rgba(5,8,15,0.72)']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.bevel}
        >
          <View style={styles.plate}>
            <LinearGradient
              colors={['rgba(232,242,248,0.32)', 'transparent']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.7, y: 0.45 }}
              style={styles.plateSheen}
            />
            <View style={styles.well}>
              <Animated.View style={[styles.ledPool, poolStyle, { backgroundColor: tone.pool }]} />
              <View style={[styles.ledRing, { borderColor: tone.ring, shadowColor: tone.ring }]} />
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
          colors={['#1C2C3A', '#0A1420', '#05080F']}
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
            <Text style={[styles.label, { textShadowColor: `${tone.ring}AA` }]}>{tone.label}</Text>
          </LinearGradient>
        </LinearGradient>
      </Animated.View>
    </AnimatedPressable>
  );
}

export function ScoreCrown({ score }: { score: number }) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.drop} />
      <LinearGradient
        colors={[TickTone.steelHot, TickTone.brass, TickTone.steelDeep, TickTone.brassDeep]}
        locations={[0, 0.22, 0.62, 1]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.92, y: 1 }}
        style={styles.chassis}
      >
        <LinearGradient
          colors={['rgba(243,213,176,0.42)', 'rgba(107,74,46,0.28)', 'rgba(5,8,15,0.72)']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.bevel}
        >
          <View style={styles.plate}>
            <View style={styles.scoreWell}>
              <Text style={styles.scoreKicker}>SCORE</Text>
              <Text style={styles.scoreValue}>{score}</Text>
            </View>
          </View>
        </LinearGradient>
        <PlateScrew style={styles.screwTL} />
        <PlateScrew style={styles.screwTR} />
        <PlateScrew style={styles.screwBL} />
        <PlateScrew style={styles.screwBR} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 168,
    height: 176,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  drop: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 4,
    height: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(2,4,10,0.55)',
  },
  chassis: {
    width: 156,
    height: 156,
    borderRadius: 78,
    padding: 4,
    overflow: 'hidden',
    shadowColor: TickTone.tick,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 12,
  },
  bevel: {
    flex: 1,
    borderRadius: 74,
    padding: 4,
    overflow: 'hidden',
  },
  plate: {
    flex: 1,
    borderRadius: 70,
    backgroundColor: '#0A1420',
    overflow: 'hidden',
  },
  plateSheen: {
    ...StyleSheet.absoluteFillObject,
  },
  well: {
    ...StyleSheet.absoluteFillObject,
    margin: 14,
    borderRadius: 70,
    backgroundColor: 'rgba(5,8,15,0.92)',
    overflow: 'hidden',
  },
  ledPool: {
    ...StyleSheet.absoluteFillObject,
  },
  ledRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 70,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  stem: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 28,
    width: 88,
    borderRadius: 6,
    backgroundColor: 'rgba(5,8,15,0.7)',
  },
  cap: {
    position: 'absolute',
    top: 14,
    width: 112,
    height: 112,
  },
  capShell: {
    flex: 1,
    borderRadius: 56,
    paddingHorizontal: 6,
    paddingTop: 5,
    paddingBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  capFace: {
    flex: 1,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  capSheen: {
    ...StyleSheet.absoluteFillObject,
  },
  capLip: {
    position: 'absolute',
    top: 8,
    left: 18,
    right: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
  label: {
    color: TickTone.ink,
    fontSize: 18,
    letterSpacing: 2.2,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  screw: {
    position: 'absolute',
    width: 12,
    height: 12,
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
    backgroundColor: 'rgba(5,8,15,0.78)',
  },
  screwSlotCross: {
    transform: [{ rotate: '90deg' }],
  },
  screwTL: { top: 18, left: 18 },
  screwTR: { top: 18, right: 18 },
  screwBL: { bottom: 18, left: 18 },
  screwBR: { bottom: 18, right: 18 },
  scoreWell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreKicker: {
    color: TickTone.mute,
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  scoreValue: {
    color: TickTone.brassHot,
    fontSize: 40,
    lineHeight: 46,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(243,213,176,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
