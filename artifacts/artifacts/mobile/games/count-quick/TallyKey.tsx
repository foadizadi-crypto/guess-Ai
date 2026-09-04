import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { CountTone } from './countTokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type TallyKeyState = 'idle' | 'correct' | 'wrong';

type TallyKeyProps = {
  label: number;
  onPress: () => void;
  disabled?: boolean;
  state?: TallyKeyState;
};

export function TallyKey({ label, onPress, disabled = false, state = 'idle' }: TallyKeyProps) {
  const press = useSharedValue(1);
  const lamp = useSharedValue(0);
  const good = state === 'correct';
  const bad = state === 'wrong';

  useEffect(() => {
    lamp.value = withTiming(good || bad ? 1 : 0, { duration: 140 });
  }, [bad, good, lamp]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));
  const lampStyle = useAnimatedStyle(() => ({
    opacity: lamp.value * 0.55,
  }));

  const wash = good
    ? (['rgba(52,211,153,0.42)', 'rgba(6,95,70,0.9)'] as const)
    : bad
      ? (['rgba(251,113,133,0.42)', 'rgba(136,19,55,0.9)'] as const)
      : (['rgba(11,28,40,0.96)', 'rgba(6,16,24,0.98)'] as const);

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        if (disabled) return;
        press.value = withTiming(0.96, { duration: 70 });
      }}
      onPressOut={() => {
        press.value = withSpring(1, { damping: 14, stiffness: 260 });
      }}
      style={[styles.wrap, style]}
    >
      <LinearGradient
        colors={[CountTone.tallyHot, CountTone.tally, CountTone.tallyDeep, CountTone.flash]}
        locations={[0, 0.28, 0.72, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.bezel}
      >
        <LinearGradient colors={wash} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.well}>
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(244,251,255,0.38)', 'transparent']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.7, y: 0.5 }}
            style={styles.sheen}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.lamp,
              lampStyle,
              { backgroundColor: good ? 'rgba(110,231,183,0.55)' : 'rgba(251,113,133,0.5)' },
            ]}
          />
          <View pointerEvents="none" style={styles.hash} />
          <Text style={[styles.label, good && styles.labelGood, bad && styles.labelBad]}>{label}</Text>
        </LinearGradient>
      </LinearGradient>
      <View pointerEvents="none" style={[styles.tickH, styles.tickTL]} />
      <View pointerEvents="none" style={[styles.tickV, styles.tickTL]} />
      <View pointerEvents="none" style={[styles.tickH, styles.tickTR]} />
      <View pointerEvents="none" style={[styles.tickV, styles.tickTR]} />
      <View pointerEvents="none" style={[styles.tickH, styles.tickBL]} />
      <View pointerEvents="none" style={[styles.tickV, styles.tickBL]} />
      <View pointerEvents="none" style={[styles.tickH, styles.tickBR]} />
      <View pointerEvents="none" style={[styles.tickV, styles.tickBR]} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '47%',
    flexGrow: 1,
    borderRadius: 18,
    position: 'relative',
    shadowColor: CountTone.tally,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  bezel: {
    borderRadius: 18,
    padding: 2,
    overflow: 'hidden',
  },
  well: {
    borderRadius: 16,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: 16,
  },
  lamp: {
    ...StyleSheet.absoluteFillObject,
  },
  hash: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(45,212,191,0.45)',
    transform: [{ rotate: '-48deg' }],
  },
  label: {
    color: CountTone.ink,
    fontSize: 30,
    lineHeight: 36,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    textShadowColor: 'rgba(45,212,191,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  labelGood: { color: CountTone.greenHot },
  labelBad: { color: CountTone.flashHot },
  tickH: {
    position: 'absolute',
    width: 11,
    height: 2,
    borderRadius: 1,
    backgroundColor: CountTone.tallyHot,
  },
  tickV: {
    position: 'absolute',
    width: 2,
    height: 11,
    borderRadius: 1,
    backgroundColor: CountTone.flash,
  },
  tickTL: { top: 5, left: 5 },
  tickTR: { top: 5, right: 5 },
  tickBL: { bottom: 5, left: 5 },
  tickBR: { bottom: 5, right: 5 },
});
