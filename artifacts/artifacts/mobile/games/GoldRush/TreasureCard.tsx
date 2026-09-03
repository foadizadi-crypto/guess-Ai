import React, { useEffect, useRef } from 'react';
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
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { hapticsService } from '@/services/HapticsService';
import { GoldTone } from './goldTokens';
import type { CardState } from './config';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ART = {
  back: require('./art/card-back.jpg'),
  gold: require('./art/card-gold.jpg'),
  bomb: require('./art/card-bomb.jpg'),
  x2: require('./art/card-x2.jpg'),
};

type TreasureCardProps = {
  card: CardState;
  width: number;
  height: number;
  index: number;
  burst: boolean;
  onPress: () => void;
};

export function TreasureCard({ card, width, height, index, burst, onPress }: TreasureCardProps) {
  const flip = useSharedValue(card.isRevealed ? 1 : 0);
  const press = useSharedValue(1);
  const enter = useSharedValue(0);
  const shine = useSharedValue(0);

  const revealedRef = useRef(card.isRevealed);

  useEffect(() => {
    enter.value = withDelay(
      80 + index * 70,
      withSpring(1, { damping: 16, stiffness: 180, mass: 0.8 }),
    );
  }, [enter, index]);

  useEffect(() => {
    flip.value = withSpring(card.isRevealed ? 1 : 0, { damping: 13, stiffness: 170, mass: 0.72 });
    const justOpened = card.isRevealed && !revealedRef.current;
    revealedRef.current = card.isRevealed;
    if (justOpened) {
      shine.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
      if (card.type === 'bomb') void hapticsService.notification(0);
      else void hapticsService.notification(1);
    } else if (!card.isRevealed) {
      shine.value = 0;
    }
  }, [card.isRevealed, card.type, flip, shine]);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateY: interpolate(enter.value, [0, 1], [18, 0]) },
      { scale: press.value * interpolate(enter.value, [0, 1], [0.92, 1]) },
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
    opacity: interpolate(shine.value, [0, 1], [0, card.type === 'bomb' ? 0.35 : 0.42]),
  }));

  const face = card.type === 'bomb' ? ART.bomb : card.type === 'multiplier' ? ART.x2 : ART.gold;
  const radius = Math.max(12, width * 0.12);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(0.96, { duration: 70 });
        void hapticsService.selection();
      }}
      onPressOut={() => {
        press.value = withSpring(1, { damping: 12, stiffness: 260 });
      }}
      style={[{ width, height }, wrapStyle]}
    >
      <View
        style={[
          styles.shadow,
          {
            borderRadius: radius,
            shadowColor: card.isRevealed && card.type === 'bomb' ? GoldTone.ember : GoldTone.metal,
            shadowOpacity: card.isRevealed ? 0.55 : 0.28,
          },
        ]}
      />
      <Animated.View style={[styles.face, backStyle, { borderRadius: radius }]}>
        <ExpoImage source={ART.back} style={styles.art} contentFit="cover" cachePolicy="memory-disk" />
        <LinearGradient
          colors={['rgba(244,215,138,0.22)', 'transparent', 'rgba(0,0,0,0.35)']}
          style={styles.sheen}
        />
      </Animated.View>
      <Animated.View style={[styles.face, faceStyle, { borderRadius: radius }]}>
        <ExpoImage source={face} style={styles.art} contentFit="cover" cachePolicy="memory-disk" />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flash,
            lightStyle,
            { backgroundColor: card.type === 'bomb' ? 'rgba(181,82,42,0.7)' : GoldTone.metalHot },
          ]}
        />
        {card.type === 'gold' ? (
          <View style={styles.valueChip}>
            <Text style={styles.valueText}>+{card.value}</Text>
          </View>
        ) : null}
        {burst && card.type !== 'bomb' ? <View pointerEvents="none" style={styles.burst} /> : null}
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
  face: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(244,215,138,0.28)',
  },
  art: { width: '100%', height: '100%' },
  sheen: { ...StyleSheet.absoluteFillObject },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GoldTone.metalHot,
  },
  burst: {
    position: 'absolute',
    alignSelf: 'center',
    top: '28%',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(244,215,138,0.18)',
  },
  valueChip: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(7,4,13,0.72)',
    borderColor: 'rgba(244,215,138,0.55)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  valueText: {
    color: GoldTone.metalHot,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 14,
  },
});
