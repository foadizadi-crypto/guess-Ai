import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStroopFlow } from './flow';
import { SevenGameSessionShell } from '@/games/sessionShell';
import type { SevenGameScreenProps } from '@/games/sessionShell';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useRTL } from '@/hooks/useRTL';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ColorTrapOption({ label, onPress }: { label: string; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 280 });
      }}
      style={[styles.optionBtn, animatedStyle]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.optionFill}
      >
        <Text style={styles.optionText}>{label}</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

export default function StroopGameScreen({
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
  const { currentQuestion, score, maxQuestions, round, timeLeft, submitAnswer, retryRound } = useStroopFlow(
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

  const questionKey = currentQuestion
    ? `${round}:${currentQuestion.word.name}:${currentQuestion.textColor.hex}:${currentQuestion.options.join('|')}`
    : `empty:${round}`;

  const [capKey, setCapKey] = useState(questionKey);
  const [roundCap, setRoundCap] = useState(() => Math.max(timeLeft, 0.1));
  if (capKey !== questionKey) {
    setCapKey(questionKey);
    setRoundCap(Math.max(timeLeft, 0.1));
  }

  const timerRatio = Math.min(1, Math.max(0, timeLeft / roundCap));
  const ink = currentQuestion?.textColor.hex ?? GameColors.accentGold;

  const wordScale = useSharedValue(1);
  const timerFill = useSharedValue(1);

  useEffect(() => {
    wordScale.value = 0.86;
    wordScale.value = withSpring(1, { damping: 13, stiffness: 210 });
  }, [questionKey, wordScale]);

  useEffect(() => {
    timerFill.value = withTiming(timerRatio, { duration: 90, easing: Easing.linear });
  }, [timerRatio, timerFill]);

  const wordStyle = useAnimatedStyle(() => ({
    transform: [{ scale: wordScale.value }],
  }));

  const timerBarStyle = useAnimatedStyle(() => ({
    width: `${(timerFill.value * 100).toFixed(2)}%` as `${number}%`,
    backgroundColor: interpolateColor(
      timerFill.value,
      [0, 0.28, 1],
      [GameColors.accentRed, GameColors.accentGold, GameColors.accentGreen],
    ),
  }));

  const timerColor = useMemo(() => {
    if (timerRatio <= 0.28) return GameColors.accentRed;
    if (timerRatio <= 0.55) return GameColors.accentGold;
    return GameColors.accentGreen;
  }, [timerRatio]);

  return (
    <SevenGameSessionShell
      howToTitle="Color Trap"
      howToBody="Choose the color of the text, not the word itself."
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
                {round} of {maxQuestions}
              </Text>
            </View>
            <View style={styles.hudCard}>
              <Text style={styles.hudLabel}>Score</Text>
              <Text style={[styles.hudValue, styles.hudScore]}>{score}</Text>
            </View>
          </View>

          <View style={styles.timerCard}>
            <View style={[styles.timerMeta, { flexDirection }]}>
              <Text style={styles.hudLabel}>Time</Text>
              <Text style={[styles.timerValue, { color: timerColor }]}>{timeLeft.toFixed(1)}s</Text>
            </View>
            <View style={styles.timerTrack}>
              <Animated.View style={[styles.timerFill, timerBarStyle]} />
            </View>
          </View>

          <View style={styles.hintChip}>
            <Text style={styles.instruction}>Choose the text color (not the word itself!)</Text>
          </View>

          {!currentQuestion ? null : (
            <>
              <Animated.View
                style={[
                  styles.wordStage,
                  wordStyle,
                  {
                    borderColor: ink,
                    shadowColor: ink,
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.08)', GameColors.backgroundPrimary]}
                  style={styles.wordStageInner}
                >
                  <Text
                    style={[
                      styles.mainWord,
                      {
                        color: ink,
                        textShadowColor: ink,
                      },
                    ]}
                  >
                    {currentQuestion.word.name}
                  </Text>
                </LinearGradient>
              </Animated.View>

              <View style={styles.optionsGrid}>
                {currentQuestion.options.map((opt, i) => (
                  <ColorTrapOption key={`${questionKey}-${i}`} label={opt} onPress={() => submitAnswer(opt)} />
                ))}
              </View>
            </>
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
  hudScore: {
    color: GameColors.accentGold,
  },
  timerCard: {
    backgroundColor: GameColors.backgroundSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GameColors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  timerMeta: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerValue: {
    fontSize: 28,
    lineHeight: 34,
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
  wordStage: {
    flexGrow: 1,
    minHeight: 168,
    borderRadius: 28,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  wordStageInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  mainWord: {
    fontSize: 56,
    lineHeight: 68,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  optionBtn: {
    width: '47%',
    flexGrow: 1,
    minHeight: 72,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GameColors.border,
    backgroundColor: GameColors.card,
  },
  optionFill: {
    flex: 1,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  optionText: {
    ...Typography.semibold,
    color: GameColors.textWhite,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
});
