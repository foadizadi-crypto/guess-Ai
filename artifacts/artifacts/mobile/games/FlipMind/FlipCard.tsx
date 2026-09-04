import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { TargetColor } from './config';
import { MindTone } from './flipTokens';

type FlipCardProps = {
  color: TargetColor;
  round: number;
  flash?: 'correct' | 'wrong' | null;
  size?: number;
};

const FACE = {
  green: {
    fill: [MindTone.greenHot, MindTone.green, MindTone.greenDeep] as [string, string, string],
    rim: MindTone.greenHot,
    label: 'GREEN',
  },
  red: {
    fill: [MindTone.redHot, MindTone.red, MindTone.redDeep] as [string, string, string],
    rim: MindTone.redHot,
    label: 'RED',
  },
};

function ColorFace({ color }: { color: TargetColor }) {
  const face = FACE[color];
  return (
    <LinearGradient colors={[MindTone.metalHot, MindTone.metal, MindTone.metalDeep]} style={styles.bezel}>
      <LinearGradient colors={face.fill} start={{ x: 0.2, y: 0 }} end={{ x: 0.85, y: 1 }} style={styles.well}>
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0.4)', 'transparent']}
          start={{ x: 0.18, y: 0 }}
          end={{ x: 0.72, y: 0.52 }}
          style={styles.sheen}
        />
        <View style={[styles.core, { borderColor: face.rim }]} />
        <Text style={styles.faceLabel}>{face.label}</Text>
      </LinearGradient>
    </LinearGradient>
  );
}

function ExtrusionFace() {
  return (
    <LinearGradient
      colors={[MindTone.metalHot, MindTone.metal, MindTone.metalDeep, '#1A0838']}
      locations={[0, 0.2, 0.58, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.extrusion}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.42)', 'transparent', 'rgba(0,0,0,0.38)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.sheen}
      />
      <View style={styles.edgeGreen} />
      <View style={styles.edgeRed} />
      <View style={styles.ridge} />
    </LinearGradient>
  );
}

export function FlipCard({ color, round, flash = null, size = 168 }: FlipCardProps) {
  const flip = useSharedValue(color === 'red' ? 1 : 0);
  const bounce = useSharedValue(1);
  const goodGlow = useSharedValue(0);
  const badGlow = useSharedValue(0);
  const depth = Math.round(size * 0.28);
  const sceneW = size + depth + 18;
  const sceneH = size + 58;
  const radius = Math.max(10, size * 0.08);

  const project = (t: number) => {
    'worklet';
    const rad = t * Math.PI;
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    const faceW = size * Math.max(c, 0);
    const backW = size * Math.max(-c, 0);
    const sideW = Math.max(depth * 0.42, Math.abs(s) * depth + Math.abs(c) * depth * 0.46);
    const visW = (c >= 0 ? faceW : backW) + sideW;
    const origin = (sceneW - visW) / 2;
    return { c, s, faceW, backW, sideW, visW, origin };
  };

  useEffect(() => {
    flip.value = withSpring(color === 'red' ? 1 : 0, { damping: 12, stiffness: 148, mass: 0.88 });
    bounce.value = 0.9;
    bounce.value = withSpring(1, { damping: 12, stiffness: 230 });
  }, [bounce, color, flip, round]);

  useEffect(() => {
    goodGlow.value = withTiming(flash === 'correct' ? 1 : 0, { duration: flash === 'correct' ? 120 : 180 });
    badGlow.value = withTiming(flash === 'wrong' ? 1 : 0, { duration: flash === 'wrong' ? 120 : 180 });
  }, [badGlow, flash, goodGlow]);

  const wrapStyle = useAnimatedStyle(() => {
    const edge = Math.sin(flip.value * Math.PI);
    return {
      transform: [
        { perspective: 1600 },
        { translateY: interpolate(edge, [0, 1], [0, -12]) },
        { rotateZ: `${interpolate(flip.value, [0, 0.5, 1], [-4, -12, 4])}deg` },
        { rotateX: `${interpolate(edge, [0, 1], [20, 8])}deg` },
        { scale: bounce.value },
      ],
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    const p = project(flip.value);
    const edge = Math.abs(p.s);
    return {
      width: p.visW * 0.94,
      left: p.origin + p.visW * 0.03,
      opacity: interpolate(edge, [0, 1], [0.52, 0.16]),
      transform: [{ scaleY: interpolate(edge, [0, 1], [1, 0.58]) }],
    };
  });

  const topStyle = useAnimatedStyle(() => {
    const p = project(flip.value);
    return {
      width: p.visW,
      left: p.origin,
      height: 10 + 8 * Math.abs(p.c),
    };
  });

  const greenStyle = useAnimatedStyle(() => {
    const p = project(flip.value);
    const yaw = Math.min(90, flip.value * 180);
    return {
      opacity: p.c > 0.02 ? 1 : 0,
      zIndex: p.c > 0 ? 3 : 0,
      transformOrigin: '0% 50%',
      transform: [{ perspective: 1200 }, { translateX: p.origin }, { rotateY: `${yaw}deg` }],
    };
  });

  const redStyle = useAnimatedStyle(() => {
    const p = project(flip.value);
    const yaw = Math.max(0, 180 - flip.value * 180);
    return {
      opacity: p.c < -0.02 ? 1 : 0,
      zIndex: p.c < 0 ? 3 : 0,
      transformOrigin: '0% 50%',
      transform: [{ perspective: 1200 }, { translateX: p.origin }, { rotateY: `${yaw}deg` }],
    };
  });

  const sideStyle = useAnimatedStyle(() => {
    const p = project(flip.value);
    const faceNow = p.c >= 0 ? p.faceW : p.backW;
    return {
      width: p.sideW,
      transform: [{ translateX: p.origin + faceNow }],
    };
  });

  const lipStyle = useAnimatedStyle(() => {
    const p = project(flip.value);
    return {
      width: p.visW,
      left: p.origin,
    };
  });

  const flashFrame = useAnimatedStyle(() => {
    const p = project(flip.value);
    const yaw = p.c >= 0 ? Math.min(90, flip.value * 180) : Math.max(0, 180 - flip.value * 180);
    return {
      transformOrigin: '0% 50%',
      transform: [{ perspective: 1200 }, { translateX: p.origin }, { rotateY: `${yaw}deg` }],
    };
  });

  const goodStyle = useAnimatedStyle(() => ({
    opacity: interpolate(goodGlow.value, [0, 1], [0, 0.38]),
  }));
  const badStyle = useAnimatedStyle(() => ({
    opacity: interpolate(badGlow.value, [0, 1], [0, 0.42]),
  }));

  const faceBox = { width: size, height: size, borderRadius: radius };

  return (
    <View style={{ width: sceneW, height: sceneH }} pointerEvents="none">
      <Animated.View style={[styles.ground, shadowStyle]} />
      <Animated.View style={[styles.rig, wrapStyle, { width: sceneW, height: size + 28 }]}>
        <Animated.View style={[styles.topFace, topStyle, { borderTopLeftRadius: radius, borderTopRightRadius: radius }]}>
          <LinearGradient
            colors={[MindTone.metalHot, MindTone.metal, MindTone.metalDeep]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.extrusion}
          />
        </Animated.View>
        <Animated.View style={[styles.face, greenStyle, faceBox]}>
          <ColorFace color="green" />
        </Animated.View>
        <Animated.View style={[styles.face, redStyle, faceBox]}>
          <ColorFace color="red" />
        </Animated.View>
        <Animated.View style={[styles.side, sideStyle, { height: size, borderRadius: Math.max(6, radius * 0.45) }]}>
          <ExtrusionFace />
        </Animated.View>
        <Animated.View style={[styles.lip, lipStyle, { top: size + 4 }]}>
          <LinearGradient colors={['#2E1065', '#120628', '#070414']} style={styles.extrusion} />
        </Animated.View>
        <Animated.View
          style={[styles.flash, flashFrame, goodStyle, faceBox, { backgroundColor: MindTone.greenHot }]}
        />
        <Animated.View
          style={[styles.flash, flashFrame, badStyle, faceBox, { backgroundColor: MindTone.redHot }]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  ground: {
    position: 'absolute',
    bottom: 2,
    height: 22,
    borderRadius: 12,
    backgroundColor: 'rgba(4,0,16,0.58)',
  },
  rig: {
    overflow: 'visible',
  },
  topFace: {
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
    zIndex: 4,
  },
  face: {
    position: 'absolute',
    top: 8,
    left: 0,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },
  side: {
    position: 'absolute',
    top: 8,
    left: 0,
    overflow: 'hidden',
    zIndex: 2,
  },
  lip: {
    position: 'absolute',
    height: 12,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
    zIndex: 1,
  },
  extrusion: {
    flex: 1,
  },
  edgeGreen: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 1,
    backgroundColor: MindTone.green,
    opacity: 0.85,
  },
  edgeRed: {
    position: 'absolute',
    right: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 1,
    backgroundColor: MindTone.red,
    opacity: 0.85,
  },
  ridge: {
    position: 'absolute',
    top: 12,
    bottom: 12,
    left: '42%',
    width: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(245,243,255,0.5)',
  },
  bezel: {
    flex: 1,
    padding: 3,
  },
  well: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
  },
  core: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    backgroundColor: 'rgba(8,4,18,0.28)',
  },
  faceLabel: {
    marginTop: 12,
    color: MindTone.ink,
    fontSize: 13,
    letterSpacing: 2,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  flash: {
    position: 'absolute',
    top: 8,
    left: 0,
  },
});
