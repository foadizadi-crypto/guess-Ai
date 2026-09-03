import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDifferenceFlow } from './flow';
import { SevenGameSessionShell } from '@/games/sessionShell';
import type { SevenGameScreenProps } from '@/games/sessionShell';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useRTL } from '@/hooks/useRTL';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SCREEN_W = Dimensions.get('window').width;
const TILE_GAP = 4;

function MatrixTile({
  glyph,
  size,
  fontSize,
  interactive,
  onPress,
}: {
  glyph: string;
  size: number;
  fontSize: number;
  interactive: boolean;
  onPress?: () => void;
}) {
  const press = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  const inner = (
    <View style={[styles.tileFace, { width: size, height: size, borderRadius: Math.max(8, size * 0.16) }]}>
      <Text style={[styles.tileGlyph, { fontSize }]}>{glyph}</Text>
    </View>
  );

  if (!interactive) {
    return <View style={{ width: size, height: size }}>{inner}</View>;
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(0.94, { duration: 70 });
      }}
      onPressOut={() => {
        press.value = withSpring(1, { damping: 16, stiffness: 280 });
      }}
      style={[{ width: size, height: size }, pressStyle]}
    >
      {inner}
    </AnimatedPressable>
  );
}

export default function SpotDifferenceScreen({
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
  const { gridData, round, maxRounds, timeLeft, score, gridCount, selectTile, retryRound } = useDifferenceFlow(
    difficulty,
    playing,
    wrongOpen,
    onCorrect,
    () => setWrongOpen(true),
    onComplete,
  );
  const numColumns = Math.sqrt(gridCount);

  const insets = useSafeAreaInsets();
  const { flexDirection } = useRTL();
  const topPad = Platform.OS === 'web' ? 54 : insets.top + 12;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 16;

  const boardKey = gridData
    ? `${round}:${gridCount}:${gridData.items.join('')}:${gridData.differentIndex}`
    : `empty:${round}`;

  const [capKey, setCapKey] = useState(boardKey);
  const [roundCap, setRoundCap] = useState(() => Math.max(timeLeft, 0.1));
  if (capKey !== boardKey) {
    setCapKey(boardKey);
    setRoundCap(Math.max(timeLeft, 0.1));
  }

  const timerRatio = Math.min(1, Math.max(0, timeLeft / roundCap));
  const boardSize = Math.min(SCREEN_W - 48, 288);
  const innerSize = boardSize - 16;
  const tileSize = numColumns > 0 ? Math.floor((innerSize - TILE_GAP * (numColumns - 1)) / numColumns) : 0;
  const glyphSize = numColumns > 0 ? 96 / numColumns : 16;

  const timerFill = useSharedValue(1);
  const boardScale = useSharedValue(1);

  useEffect(() => {
    timerFill.value = withTiming(timerRatio, { duration: 90, easing: Easing.linear });
  }, [timerRatio, timerFill]);

  useEffect(() => {
    boardScale.value = 0.96;
    boardScale.value = withSpring(1, { damping: 14, stiffness: 220 });
  }, [boardKey, boardScale]);

  const timerBarStyle = useAnimatedStyle(() => ({
    width: `${(timerFill.value * 100).toFixed(2)}%` as `${number}%`,
    backgroundColor: interpolateColor(
      timerFill.value,
      [0, 0.28, 1],
      [GameColors.accentRed, GameColors.accentGold, GameColors.accentGreen],
    ),
  }));

  const boardsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boardScale.value }],
  }));

  const timerColor = useMemo(() => {
    if (timerRatio <= 0.28) return GameColors.accentRed;
    if (timerRatio <= 0.55) return GameColors.accentGold;
    return GameColors.accentGreen;
  }, [timerRatio]);

  return (
    <SevenGameSessionShell
      howToTitle="Glitch Spy"
      howToBody="Find the shape that is different from the others."
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
            <View style={styles.hudCard}>
              <Text style={styles.hudLabel}>Score</Text>
              <Text style={[styles.hudValue, styles.hudScore]}>{score}</Text>
            </View>
          </View>

          <View style={styles.timerCard}>
            <View style={[styles.timerMeta, { flexDirection }]}>
              <Text style={styles.hudLabel}>Time left</Text>
              <Text style={[styles.timerValue, { color: timerColor }]}>{timeLeft.toFixed(1)}s</Text>
            </View>
            <View style={styles.timerTrack}>
              <Animated.View style={[styles.timerFill, timerBarStyle]} />
            </View>
          </View>

          <View style={styles.hintChip}>
            <Text style={styles.instruction}>Look at the bottom grid and tap the shape that is different!</Text>
          </View>

          {!gridData ? null : (
            <Animated.View style={[styles.boards, boardsStyle]}>
              <View style={styles.gridContainer}>
                <Text style={styles.gridLabel}>Reference 👁️</Text>
                <View style={[styles.grid, styles.gridReference, { width: boardSize }]}>
                  {gridData.items.map((item, idx) => (
                    <MatrixTile
                      key={`ref-${idx}`}
                      glyph={idx === gridData.differentIndex ? gridData.items[(idx + 1) % gridCount] : item}
                      size={tileSize}
                      fontSize={glyphSize}
                      interactive={false}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.gridContainer}>
                <Text style={[styles.gridLabel, styles.gridLabelTarget]}>Second image (find one difference!) 👇</Text>
                <View style={[styles.grid, styles.gridTarget, { width: boardSize }]}>
                  {gridData.items.map((item, idx) => (
                    <MatrixTile
                      key={`target-${idx}`}
                      glyph={item}
                      size={tileSize}
                      fontSize={glyphSize}
                      interactive
                      onPress={() => selectTile(idx)}
                    />
                  ))}
                </View>
              </View>
            </Animated.View>
          )}
        </View>
      </AnimatedBackground>
    </SevenGameSessionShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 10,
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
    paddingVertical: 10,
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
  hudScore: {
    color: GameColors.accentGold,
  },
  timerCard: {
    backgroundColor: GameColors.backgroundSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GameColors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  timerMeta: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerValue: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timerTrack: {
    height: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  timerFill: {
    height: 8,
    borderRadius: 8,
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
    color: GameColors.accentGold,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
  },
  boards: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  gridContainer: {
    alignItems: 'center',
  },
  gridLabel: {
    ...Typography.small,
    color: GameColors.textSecondary,
    marginBottom: 6,
    fontFamily: 'Inter_700Bold',
  },
  gridLabelTarget: {
    color: GameColors.accentGold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: TILE_GAP,
  },
  gridReference: {
    backgroundColor: GameColors.backgroundPrimary,
    borderColor: GameColors.border,
  },
  gridTarget: {
    backgroundColor: GameColors.backgroundSecondary,
    borderColor: GameColors.cardBorder,
  },
  tileFace: {
    backgroundColor: GameColors.card,
    borderWidth: 1,
    borderColor: GameColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileGlyph: {
    textAlign: 'center',
  },
  divider: {
    width: '72%',
    height: 1,
    backgroundColor: GameColors.border,
  },
});
