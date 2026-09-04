import React, { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { TrapTone } from './trapTokens';

type WordStageProps = {
  word: string;
  ink: string;
  questionKey: string;
  flash?: 'correct' | 'wrong' | null;
  burst?: boolean;
};

export function WordStage({ word, ink, questionKey, flash = null, burst = true }: WordStageProps) {
  const { width } = useWindowDimensions();
  const scale = useSharedValue(1);
  const good = useSharedValue(0);
  const bad = useSharedValue(0);
  const fontSize = Math.min(72, Math.max(44, width * 0.155));

  useEffect(() => {
    scale.value = 0.82;
    scale.value = withSpring(1, { damping: 13, stiffness: 210 });
  }, [questionKey, scale]);

  useEffect(() => {
    good.value = withTiming(flash === 'correct' ? 1 : 0, { duration: flash === 'correct' ? 110 : 180, easing: Easing.out(Easing.quad) });
    bad.value = withTiming(flash === 'wrong' ? 1 : 0, { duration: flash === 'wrong' ? 110 : 180, easing: Easing.out(Easing.quad) });
  }, [bad, flash, good]);

  const stageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const goodStyle = useAnimatedStyle(() => ({
    opacity: interpolate(good.value, [0, 1], [0, burst ? 0.38 : 0.18]),
  }));
  const badStyle = useAnimatedStyle(() => ({
    opacity: interpolate(bad.value, [0, 1], [0, burst ? 0.4 : 0.2]),
  }));

  return (
    <Animated.View style={[styles.wrap, stageStyle, { borderColor: ink, shadowColor: ink }]}>
      <LinearGradient
        colors={[TrapTone.chromeHot, TrapTone.chrome, TrapTone.chromeDeep]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.bezel}
      >
        <LinearGradient colors={['rgba(18,10,32,0.96)', 'rgba(6,4,14,0.98)']} style={styles.well}>
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(242,245,255,0.16)', 'transparent']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 0.55 }}
            style={styles.sheen}
          />
          <View pointerEvents="none" style={[styles.inkRim, { borderColor: ink }]} />
          <Text pointerEvents="none" style={[styles.ghost, styles.ghostMag, { fontSize, lineHeight: fontSize + 10 }]}>
            {word}
          </Text>
          <Text pointerEvents="none" style={[styles.ghost, styles.ghostCyan, { fontSize, lineHeight: fontSize + 10 }]}>
            {word}
          </Text>
          <Text
            style={[
              styles.word,
              {
                color: ink,
                fontSize,
                lineHeight: fontSize + 10,
                textShadowColor: ink,
              },
            ]}
          >
            {word}
          </Text>
          <View pointerEvents="none" style={styles.scan} />
          <Animated.View pointerEvents="none" style={[styles.flash, goodStyle, { backgroundColor: TrapTone.cyan }]} />
          <Animated.View pointerEvents="none" style={[styles.flash, badStyle, { backgroundColor: TrapTone.magenta }]} />
        </LinearGradient>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    minHeight: 168,
    borderRadius: 26,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  bezel: {
    flex: 1,
    padding: 2.5,
  },
  well: {
    flex: 1,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 16,
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
  },
  inkRim: {
    ...StyleSheet.absoluteFillObject,
    margin: 10,
    borderRadius: 18,
    borderWidth: 1.25,
    opacity: 0.55,
  },
  ghost: {
    position: 'absolute',
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    opacity: 0.14,
  },
  ghostMag: {
    color: TrapTone.magenta,
    transform: [{ translateX: -2.5 }],
  },
  ghostCyan: {
    color: TrapTone.cyan,
    transform: [{ translateX: 2.5 }],
  },
  word: {
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
    zIndex: 2,
  },
  scan: {
    position: 'absolute',
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(242,245,255,0.12)',
    top: '58%',
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
  },
});
