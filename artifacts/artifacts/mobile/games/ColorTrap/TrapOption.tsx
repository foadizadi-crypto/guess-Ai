import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { hapticsService } from '@/services/HapticsService';
import { TrapTone } from './trapTokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type TrapOptionState = 'idle' | 'correct' | 'wrong';

type TrapOptionProps = {
  label: string;
  onPress: () => void;
  state?: TrapOptionState;
  index?: number;
};

function CornerTick({ corner }: { corner: 'tl' | 'tr' | 'bl' | 'br' }) {
  const pos =
    corner === 'tl'
      ? { top: 5, left: 5 }
      : corner === 'tr'
        ? { top: 5, right: 5 }
        : corner === 'bl'
          ? { bottom: 5, left: 5 }
          : { bottom: 5, right: 5 };
  const fromLeft = corner === 'tl' || corner === 'bl';
  const fromTop = corner === 'tl' || corner === 'tr';
  return (
    <View pointerEvents="none" style={[styles.tickSeat, pos]}>
      <View style={[styles.tickH, fromTop ? { top: 0 } : { bottom: 0 }, { backgroundColor: fromLeft ? TrapTone.magentaHot : TrapTone.cyanHot }]} />
      <View style={[styles.tickV, fromLeft ? { left: 0 } : { right: 0 }, { backgroundColor: fromLeft ? TrapTone.magentaHot : TrapTone.cyanHot }]} />
    </View>
  );
}

export function TrapOption({ label, onPress, state = 'idle', index = 0 }: TrapOptionProps) {
  const press = useSharedValue(1);
  const enter = useSharedValue(0);
  const lamp = useSharedValue(0);
  const lit = state === 'correct';
  const bad = state === 'wrong';

  useEffect(() => {
    enter.value = 0;
    enter.value = withDelay(index * 42, withSpring(1, { damping: 16, stiffness: 240 }));
  }, [enter, index, label]);

  useEffect(() => {
    lamp.value = withTiming(lit || bad ? 1 : 0, { duration: 120, easing: Easing.out(Easing.quad) });
  }, [bad, lamp, lit]);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ scale: press.value * interpolate(enter.value, [0, 1], [0.92, 1]) }, { translateY: interpolate(enter.value, [0, 1], [10, 0]) }],
  }));

  const lampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(lamp.value, [0, 1], [0, 0.55]),
  }));

  return (
    <AnimatedPressable
      pointerEvents="box-only"
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(0.96, { duration: 70 });
        void hapticsService.selection();
      }}
      onPressOut={() => {
        press.value = withSpring(1, { damping: 16, stiffness: 280 });
      }}
      style={[styles.wrap, wrapStyle]}
    >
      <View pointerEvents="none" style={styles.drop} />
      <LinearGradient
        colors={[TrapTone.chromeHot, TrapTone.chrome, TrapTone.chromeDeep, TrapTone.chrome]}
        locations={[0, 0.18, 0.58, 1]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.92, y: 1 }}
        style={styles.chassis}
      >
        <LinearGradient
          colors={['rgba(242,245,255,0.28)', 'rgba(18,10,32,0.92)', 'rgba(8,4,16,0.96)']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.face}
        >
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(242,245,255,0.34)', 'transparent']}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.7, y: 0.5 }}
            style={styles.sheen}
          />
          <View pointerEvents="none" style={styles.splitRail}>
            <LinearGradient
              colors={[TrapTone.magenta, 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.rail}
            />
            <LinearGradient
              colors={['transparent', TrapTone.cyan]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.rail}
            />
          </View>
          <Text style={styles.kicker}>{String(index + 1).padStart(2, '0')}</Text>
          <Text style={styles.label}>{label}</Text>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.lamp,
              lampStyle,
              { backgroundColor: bad ? TrapTone.magenta : TrapTone.cyan },
            ]}
          />
        </LinearGradient>
        <CornerTick corner="tl" />
        <CornerTick corner="tr" />
        <CornerTick corner="bl" />
        <CornerTick corner="br" />
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '47%',
    flexGrow: 1,
    minHeight: 76,
  },
  drop: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 2,
    height: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(4,0,14,0.45)',
  },
  chassis: {
    flex: 1,
    minHeight: 76,
    borderRadius: 18,
    padding: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(197,206,224,0.35)',
    shadowColor: TrapTone.cyan,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
  },
  face: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
  },
  splitRail: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    height: 2,
    flexDirection: 'row',
    gap: 4,
  },
  rail: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  kicker: {
    color: TrapTone.mute,
    fontSize: 9,
    letterSpacing: 1.4,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  label: {
    color: TrapTone.ink,
    fontSize: 18,
    lineHeight: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(242,245,255,0.28)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  lamp: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
  },
  tickSeat: {
    position: 'absolute',
    width: 12,
    height: 12,
  },
  tickH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
  tickV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    borderRadius: 1,
  },
});
