import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePerfectClickFlow } from './flow';
import { SevenGameSessionShell } from '@/games/sessionShell';
import type { SevenGameScreenProps } from '@/games/sessionShell';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useRTL } from '@/hooks/useRTL';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function LockButton({
  label,
  colors,
  onPress,
}: {
  label: string;
  colors: [string, string];
  onPress: () => void;
}) {
  const press = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(0.94, { duration: 70 });
      }}
      onPressOut={() => {
        press.value = withSpring(1, { damping: 12, stiffness: 260 });
      }}
      style={[styles.mainBtn, pressStyle]}
    >
      <LinearGradient colors={colors} style={styles.mainBtnFill}>
        <Text style={styles.btnText}>{label}</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

export default function PerfectClickScreen({
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
  const {
    elapsedTime,
    isRunning,
    isFinished,
    roundScore,
    targetTime,
    hideTime,
    round,
    maxRounds,
    score,
    startTimer,
    stopTimer,
    retryRound,
  } = usePerfectClickFlow(
    difficulty,
    playing,
    wrongOpen,
    onCorrect,
    () => setWrongOpen(true),
    onComplete,
  );
  const shouldHideTimer = isRunning && elapsedTime > hideTime;

  const insets = useSafeAreaInsets();
  const { flexDirection } = useRTL();
  const topPad = Platform.OS === 'web' ? 54 : insets.top + 12;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 16;
  const roundRatio = maxRounds > 0 ? Math.min(1, round / maxRounds) : 0;

  const pulse = useSharedValue(0.4);
  const roundFill = useSharedValue(roundRatio);

  useEffect(() => {
    pulse.value = isRunning
      ? withRepeat(withTiming(1, { duration: 520, easing: Easing.inOut(Easing.sin) }), -1, true)
      : withTiming(0.45, { duration: 180 });
  }, [isRunning, pulse]);

  useEffect(() => {
    roundFill.value = withTiming(roundRatio, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [roundRatio, roundFill]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const roundBarStyle = useAnimatedStyle(() => ({
    width: `${(roundFill.value * 100).toFixed(2)}%` as `${number}%`,
  }));

  return (
    <SevenGameSessionShell
      howToTitle="Tick Lock"
      howToBody="Stop the timer on the target time."
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

          <View style={styles.progressCard}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, roundBarStyle]} />
            </View>
          </View>

          <View style={styles.hintChip}>
            <Text style={styles.instruction}>
              Target: stop the clock on{' '}
              <Text style={styles.targetHighlight}>{targetTime.toFixed(2)}</Text> seconds!
            </Text>
          </View>

          <View style={styles.stage}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.timerGlow,
                pulseStyle,
                { backgroundColor: shouldHideTimer ? GameColors.accentRed : GameColors.glow },
              ]}
            />
            <View style={[styles.timerDisplayBox, shouldHideTimer && styles.timerHiddenBox]}>
              {shouldHideTimer ? (
                <Text style={styles.hiddenTimerText}>🙈 Time hidden! Stay focused...</Text>
              ) : (
                <Text style={styles.timerText}>{elapsedTime.toFixed(2)}s</Text>
              )}
            </View>
          </View>

          {!isRunning && !isFinished ? (
            <LockButton
              label="Start 🚀"
              colors={[GameColors.accentGreen, GameColors.backgroundSecondary]}
              onPress={startTimer}
            />
          ) : isRunning ? (
            <LockButton
              label="Stop! 🛑"
              colors={[GameColors.accentRed, GameColors.backgroundSecondary]}
              onPress={stopTimer}
            />
          ) : (
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Score</Text>
              <Text style={styles.resultText}>{roundScore}</Text>
            </View>
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
  hudScore: {
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
  hintChip: {
    alignSelf: 'center',
    backgroundColor: GameColors.coinBg,
    borderWidth: 1,
    borderColor: GameColors.coinBorder,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  instruction: {
    ...Typography.bodyMedium,
    color: GameColors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
  },
  targetHighlight: {
    color: GameColors.accentGold,
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  stage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  timerDisplayBox: {
    minHeight: 150,
    width: '100%',
    maxWidth: 320,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: GameColors.cardBorder,
    backgroundColor: GameColors.card,
    paddingHorizontal: 16,
  },
  timerHiddenBox: {
    borderColor: GameColors.accentRed,
    backgroundColor: GameColors.backgroundSecondary,
  },
  timerText: {
    fontSize: 64,
    lineHeight: 76,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: GameColors.textWhite,
    fontVariant: ['tabular-nums'],
  },
  hiddenTimerText: {
    fontSize: 18,
    color: GameColors.accentRed,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    textAlign: 'center',
  },
  mainBtn: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GameColors.border,
  },
  mainBtnFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: GameColors.textWhite,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    textAlign: 'center',
  },
  resultBox: {
    minWidth: 180,
    minHeight: 180,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: GameColors.cardBorder,
    backgroundColor: GameColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  resultLabel: {
    ...Typography.small,
    color: GameColors.textSecondary,
    marginBottom: 6,
  },
  resultText: {
    fontSize: 40,
    lineHeight: 48,
    color: GameColors.accentGold,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
});
