import React, { useEffect, useState } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMatchFlow } from './flow';
import { SevenGameSessionShell } from '@/games/sessionShell';
import type { SevenGameScreenProps } from '@/games/sessionShell';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useRTL } from '@/hooks/useRTL';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SCREEN_W = Dimensions.get('window').width;

function MemoryCard({
  icon,
  revealed,
  matched,
  size,
  onPress,
}: {
  icon: string;
  revealed: boolean;
  matched: boolean;
  size: number;
  onPress: () => void;
}) {
  const flip = useSharedValue(revealed ? 1 : 0);
  const press = useSharedValue(1);

  useEffect(() => {
    flip.value = withSpring(revealed ? 1 : 0, { damping: 13, stiffness: 170, mass: 0.7 });
  }, [revealed, flip]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` },
    ],
    opacity: flip.value < 0.5 ? 1 : 0,
  }));

  const faceStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` },
    ],
    opacity: flip.value >= 0.5 ? 1 : 0,
  }));

  const radius = Math.max(12, size * 0.18);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(0.94, { duration: 70 });
      }}
      onPressOut={() => {
        press.value = withSpring(1, { damping: 12, stiffness: 260 });
      }}
      style={[{ width: size, height: size }, wrapStyle]}
    >
      <Animated.View style={[styles.cardFace, backStyle, { borderRadius: radius, borderColor: GameColors.cardBorder }]}>
        <LinearGradient
          colors={[GameColors.backgroundSecondary, GameColors.card]}
          style={[styles.cardFill, { borderRadius: radius }]}
        >
          <Text style={styles.cardBackMark}>?</Text>
        </LinearGradient>
      </Animated.View>
      <Animated.View
        style={[
          styles.cardFace,
          faceStyle,
          {
            borderRadius: radius,
            borderColor: matched ? GameColors.accentGold : GameColors.border,
            shadowColor: matched ? GameColors.accentGold : GameColors.transparent,
            shadowOpacity: matched ? 0.65 : 0,
            shadowRadius: matched ? 10 : 0,
          },
        ]}
      >
        <View style={[styles.cardFill, { borderRadius: radius, backgroundColor: GameColors.textWhite }]}>
          <Text style={[styles.iconText, { fontSize: Math.max(22, size * 0.38) }]}>{icon}</Text>
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
}

export default function MemoryMatchScreen({
  difficulty,
  skipHowTo,
  onHowToFinished,
  onCorrect,
  onComplete,
  onExitToCategory,
  onRestart,
}: SevenGameScreenProps) {
  const [playing, setPlaying] = useState(false);
  const [wrongOpen, setWrongOpen] = useState(false);
  const { cards, moves, pairsFound, maxRounds, flipCard, retryRound } = useMatchFlow(
    difficulty,
    playing,
    wrongOpen,
    onCorrect,
    () => setWrongOpen(true),
    onComplete,
  );

  const insets = useSafeAreaInsets();
  const { flexDirection } = useRTL();
  const topPad = Platform.OS === 'web' ? 54 : insets.top + 12;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 16;
  const cardCount = cards.length;
  const cardSize = cardCount > 16 ? 54 : cardCount > 12 ? 62 : 72;
  const pairRatio = maxRounds > 0 ? Math.min(1, pairsFound / maxRounds) : 0;

  const pairFill = useSharedValue(pairRatio);
  useEffect(() => {
    pairFill.value = withTiming(pairRatio, { duration: 220 });
  }, [pairRatio, pairFill]);

  const pairBarStyle = useAnimatedStyle(() => ({
    width: `${(pairFill.value * 100).toFixed(2)}%` as `${number}%`,
  }));

  return (
    <SevenGameSessionShell
      howToTitle="Twin Link"
      howToBody="Find the matching pairs."
      skipHowTo={skipHowTo}
      wrongOpen={wrongOpen}
      onHowToFinished={onHowToFinished}
      onPlayStart={() => setPlaying(true)}
      onContinue={() => {
        retryRound();
        setWrongOpen(false);
      }}
      onExitToCategory={onExitToCategory}
      onRestart={onRestart}
    >
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
          <View style={[styles.hudRow, { flexDirection }]}>
            <View style={styles.hudCard}>
              <Text style={styles.hudLabel}>Pairs</Text>
              <Text style={styles.hudValue}>
                {pairsFound} of {maxRounds}
              </Text>
            </View>
            <View style={styles.hudCard}>
              <Text style={styles.hudLabel}>Moves</Text>
              <Text style={[styles.hudValue, styles.hudMoves]}>{moves}</Text>
            </View>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, pairBarStyle]} />
            </View>
          </View>

          <View style={[styles.matchGrid, { maxWidth: Math.min(SCREEN_W - 40, 360) }]}>
            {cards.map((card, index) => (
              <MemoryCard
                key={card.id}
                icon={card.icon}
                revealed={card.isFlipped || card.isMatched}
                matched={card.isMatched}
                size={cardSize}
                onPress={() => flipCard(index)}
              />
            ))}
          </View>
        </View>
      </AnimatedBackground>
    </SevenGameSessionShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 14,
  },
  hudRow: {
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
  },
  hudCard: {
    flex: 1,
    backgroundColor: GameColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GameColors.cardBorder,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  hudLabel: {
    ...Typography.small,
    color: GameColors.textSecondary,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  hudValue: {
    ...Typography.semibold,
    color: GameColors.textWhite,
    fontFamily: 'Inter_700Bold',
  },
  hudMoves: {
    color: GameColors.accentGold,
  },
  progressCard: {
    width: '100%',
    backgroundColor: GameColors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GameColors.border,
    padding: 10,
  },
  progressTrack: {
    height: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  progressFill: {
    height: 8,
    borderRadius: 8,
    backgroundColor: GameColors.accentGold,
  },
  matchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  cardFace: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderWidth: 1.5,
    backfaceVisibility: 'hidden',
  },
  cardFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBackMark: {
    color: GameColors.textWhite,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  iconText: {
    textAlign: 'center',
  },
});
