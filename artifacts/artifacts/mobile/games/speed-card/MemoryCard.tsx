import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SpeedTone } from './speedTokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type MemoryCardProps = {
  hex: string;
  width: number;
  height: number;
  faceUp: boolean;
  disabled: boolean;
  highlight?: 'correct' | 'wrong' | null;
  burst?: boolean;
  onPress: () => void;
};

function hexLum(hex: string): number {
  const raw = hex.replace('#', '');
  if (raw.length < 6) return 0.5;
  const r = Number.parseInt(raw.slice(0, 2), 16) / 255;
  const g = Number.parseInt(raw.slice(2, 4), 16) / 255;
  const b = Number.parseInt(raw.slice(4, 6), 16) / 255;
  if (Number.isNaN(r + g + b)) return 0.5;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function Diamond({ top, left }: { top: `${number}%`; left: `${number}%` }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top,
        left,
        width: '22%',
        aspectRatio: 1,
        borderWidth: 1.25,
        borderColor: 'rgba(125,211,252,0.42)',
        backgroundColor: 'rgba(251,191,36,0.08)',
        transform: [{ rotate: '45deg' }],
      }}
    />
  );
}

function CardBack() {
  return (
    <LinearGradient
      colors={['#3A1424', '#160814', '#2A0C18', '#0A040C']}
      locations={[0, 0.28, 0.62, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.fill}
    >
      <LinearGradient
        colors={['rgba(224,242,254,0.22)', 'transparent', 'rgba(0,0,0,0.4)']}
        style={styles.fill}
      />
      <Diamond top="14%" left="18%" />
      <Diamond top="14%" left="58%" />
      <Diamond top="40%" left="38%" />
      <Diamond top="64%" left="18%" />
      <Diamond top="64%" left="58%" />
      <View pointerEvents="none" style={styles.medallion}>
        <LinearGradient
          colors={[SpeedTone.ice, SpeedTone.snap, SpeedTone.crimsonDeep]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.medallionFill}
        />
      </View>
      <View pointerEvents="none" style={styles.backRim} />
    </LinearGradient>
  );
}

function ColorFace({ hex, radius }: { hex: string; radius: number }) {
  const light = hexLum(hex) > 0.62;
  const rim = light ? 'rgba(8,4,15,0.78)' : 'rgba(255,255,255,0.62)';
  return (
    <LinearGradient
      colors={[SpeedTone.paper, SpeedTone.paperDeep, '#B89F82']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[styles.fill, { borderRadius: radius }]}
    >
      <View style={[styles.well, { backgroundColor: hex, borderColor: rim, borderRadius: Math.max(6, radius - 5) }]}>
        <LinearGradient
          pointerEvents="none"
          colors={light ? ['rgba(255,255,255,0.1)', 'transparent'] : ['rgba(255,255,255,0.26)', 'transparent']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.7, y: 0.4 }}
          style={styles.sheen}
        />
        <LinearGradient
          pointerEvents="none"
          colors={light ? ['transparent', 'rgba(0,0,0,0.08)'] : ['transparent', 'rgba(0,0,0,0.2)']}
          start={{ x: 0.5, y: 0.55 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.sheen}
        />
      </View>
    </LinearGradient>
  );
}

export function MemoryCard({
  hex,
  width,
  height,
  faceUp,
  disabled,
  highlight = null,
  burst = false,
  onPress,
}: MemoryCardProps) {
  const flip = useSharedValue(faceUp ? 1 : 0);
  const press = useSharedValue(1);
  const glow = useSharedValue(0);
  const radius = Math.max(10, Math.min(width, height) * 0.12);

  useEffect(() => {
    flip.value = withSpring(faceUp ? 1 : 0, { damping: 15, stiffness: 210, mass: 0.62 });
  }, [faceUp, flip]);

  useEffect(() => {
    glow.value = withTiming(highlight ? 1 : 0, { duration: highlight ? 120 : 180 });
  }, [glow, highlight]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1100 }, { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` }],
    opacity: flip.value < 0.5 ? 1 : 0,
  }));

  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1100 }, { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` }],
    opacity: flip.value >= 0.5 ? 1 : 0,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0, 0.9]),
  }));

  const glowColor = highlight === 'wrong' ? SpeedTone.crimson : SpeedTone.greenHot;

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(0.96, { duration: 70 });
      }}
      onPressOut={() => {
        press.value = withSpring(1, { damping: 14, stiffness: 280, mass: 0.4 });
      }}
      style={[{ width, height }, wrapStyle]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.shadow,
          {
            borderRadius: radius,
            shadowColor: highlight ? glowColor : '#000',
            shadowOpacity: highlight ? 0.55 : 0.32,
          },
        ]}
      />
      <Animated.View style={[styles.face, backStyle, { borderRadius: radius }]}>
        <LinearGradient
          colors={[SpeedTone.snapHot, SpeedTone.ice, SpeedTone.crimsonDeep, SpeedTone.snap]}
          start={{ x: 0.08, y: 0 }}
          end={{ x: 0.92, y: 1 }}
          style={styles.cardBezel}
        >
          <CardBack />
        </LinearGradient>
      </Animated.View>
      <Animated.View style={[styles.face, faceStyle, { borderRadius: radius }]}>
        <LinearGradient
          colors={[SpeedTone.paper, SpeedTone.snap, SpeedTone.paperDeep]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.cardBezel}
        >
          <ColorFace hex={hex} radius={Math.max(6, radius - 3)} />
        </LinearGradient>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.glow, glowStyle, { borderRadius: radius, borderColor: glowColor }]}
      />
      {burst && highlight === 'correct' ? (
        <View pointerEvents="none" style={[styles.burst, { backgroundColor: 'rgba(110,231,183,0.22)' }]} />
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 10,
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },
  cardBezel: {
    flex: 1,
    padding: 2,
  },
  fill: {
    flex: 1,
  },
  well: {
    flex: 1,
    margin: 5,
    borderWidth: 2,
    overflow: 'hidden',
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
  },
  backRim: {
    ...StyleSheet.absoluteFillObject,
    margin: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(251,191,36,0.45)',
    borderRadius: 8,
  },
  medallion: {
    position: 'absolute',
    alignSelf: 'center',
    top: '38%',
    width: 22,
    height: 22,
    transform: [{ rotate: '45deg' }],
    overflow: 'hidden',
  },
  medallionFill: {
    flex: 1,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2.5,
  },
  burst: {
    position: 'absolute',
    alignSelf: 'center',
    top: '30%',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
