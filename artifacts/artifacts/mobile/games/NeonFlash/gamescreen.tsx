import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSimonFlow } from './flow';
import { TILES } from './config';
import { SevenGameSessionShell } from '@/games/sessionShell';
import type { SevenGameScreenProps } from '@/games/sessionShell';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useRTL } from '@/hooks/useRTL';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const GRID_GAP = 14;
const SCREEN_W = Dimensions.get('window').width;

function NeonTile({
  color,
  light,
  lit,
  size,
  onPress,
}: {
  color: string;
  light: string;
  lit: boolean;
  size: number;
  onPress: () => void;
}) {
  const glow = useSharedValue(0);
  const press = useSharedValue(1);

  useEffect(() => {
    glow.value = withTiming(lit ? 1 : 0, { duration: 80, easing: Easing.out(Easing.cubic) });
  }, [lit, glow]);

  const tileStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value * interpolate(glow.value, [0, 1], [1, 1.045]) }],
    backgroundColor: interpolateColor(glow.value, [0, 1], [color, light]),
    shadowOpacity: interpolate(glow.value, [0, 1], [0.22, 0.9]),
    shadowRadius: interpolate(glow.value, [0, 1], [8, 22]),
  }));

  const sheenStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.08, 0.38]),
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(0.96, { duration: 70 });
      }}
      onPressOut={() => {
        press.value = withSpring(1, { damping: 16, stiffness: 280 });
      }}
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: Math.max(22, size * 0.22),
          borderColor: light,
          shadowColor: color,
        },
        tileStyle,
      ]}
    >
      <Animated.View pointerEvents="none" style={[styles.tileSheen, sheenStyle]} />
    </AnimatedPressable>
  );
}

export default function SimonSaysScreen({
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
  const { round, maxRounds, activeTile, isShowingSeq, submitChoice, retryRound } = useSimonFlow(
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
  const gridSize = Math.min(SCREEN_W - 40, 340);
  const tileSize = (gridSize - GRID_GAP) / 2;
  const roundRatio = maxRounds > 0 ? Math.min(1, round / maxRounds) : 0;

  const roundFill = useSharedValue(roundRatio);
  const pulse = useSharedValue(0.35);

  useEffect(() => {
    roundFill.value = withTiming(roundRatio, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [roundRatio, roundFill]);

  useEffect(() => {
    pulse.value = isShowingSeq
      ? withRepeat(withTiming(1, { duration: 520, easing: Easing.inOut(Easing.sin) }), -1, true)
      : withTiming(0.35, { duration: 180 });
  }, [isShowingSeq, pulse]);

  const roundBarStyle = useAnimatedStyle(() => ({
    width: `${(roundFill.value * 100).toFixed(2)}%` as `${number}%`,
  }));

  const arenaPulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const statusColor = useMemo(
    () => (isShowingSeq ? GameColors.accentGold : GameColors.accentGreen),
    [isShowingSeq],
  );

  return (
    <SevenGameSessionShell
      howToTitle="Neon Flash"
      howToBody="Watch the pattern and repeat the same order."
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
              <Text style={styles.hudLabel}>Round</Text>
              <Text style={styles.hudValue}>
                {round} of {maxRounds}
              </Text>
            </View>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, roundBarStyle]} />
            </View>
          </View>

          <View style={styles.hintChip}>
            <Text style={[styles.instruction, { color: statusColor }]}>
              {isShowingSeq ? 'Watch the pattern...' : 'Now you repeat!'}
            </Text>
          </View>

          <View style={styles.stage}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.arenaGlow,
                arenaPulseStyle,
                { width: gridSize + 36, height: gridSize + 36, borderRadius: (gridSize + 36) / 5 },
              ]}
            />
            <LinearGradient
              colors={[GameColors.backgroundSecondary, GameColors.backgroundPrimary]}
              style={[styles.arena, { width: gridSize + 28, height: gridSize + 28 }]}
            >
              <View style={[styles.simonGrid, { width: gridSize, height: gridSize }]}>
                {TILES.map((tile) => (
                  <NeonTile
                    key={tile.id}
                    color={tile.color}
                    light={tile.light}
                    lit={activeTile === tile.id}
                    size={tileSize}
                    onPress={() => submitChoice(tile.id)}
                  />
                ))}
              </View>
            </LinearGradient>
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
    gap: 14,
  },
  hudRow: {
    justifyContent: 'space-between',
    gap: 12,
  },
  hudCard: {
    flex: 1,
    backgroundColor: GameColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GameColors.cardBorder,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  hudLabel: {
    ...Typography.small,
    color: GameColors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  hudValue: {
    ...Typography.semibold,
    color: GameColors.textWhite,
    fontFamily: 'Inter_700Bold',
  },
  progressCard: {
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
  hintChip: {
    alignSelf: 'center',
    backgroundColor: GameColors.coinBg,
    borderWidth: 1,
    borderColor: GameColors.coinBorder,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  instruction: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arenaGlow: {
    position: 'absolute',
    backgroundColor: GameColors.glow,
  },
  arena: {
    borderRadius: 32,
    borderWidth: 1,
    borderColor: GameColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  tile: {
    overflow: 'hidden',
    borderWidth: 1.5,
    elevation: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  tileSheen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GameColors.textWhite,
  },
});
