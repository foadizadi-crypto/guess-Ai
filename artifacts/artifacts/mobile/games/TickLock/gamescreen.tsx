import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePerfectClickFlow } from './flow';
import { SevenGameSessionShell } from '@/games/sessionShell';
import type { SevenGameScreenProps } from '@/games/sessionShell';
import { allowBlurFor, useVisualQuality } from '@/games/visualFoundation';
import { useRTL } from '@/hooks/useRTL';
import { TickLockWorld } from './TickLockWorld';
import { TickLockHud } from './TickLockHud';
import { ChronographFace } from './ChronographFace';
import { LockPlunger, ScoreCrown } from './LockPlunger';

const HOW_TO_TITLE = 'Tick Lock';
const HOW_TO_BODY = 'Stop the timer on the target time.';

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
  const quality = useVisualQuality();
  const topPad = Platform.OS === 'web' ? 54 : insets.top + 10;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 14;

  return (
    <SevenGameSessionShell
      howToTitle={HOW_TO_TITLE}
      howToBody={HOW_TO_BODY}
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
      <TickLockWorld quality={quality} hidden={shouldHideTimer} running={isRunning} finished={isFinished}>
        <View style={[styles.play, { paddingTop: topPad, paddingBottom: botPad }]}>
          <TickLockHud
            round={round}
            maxRounds={maxRounds}
            score={score}
            targetTime={targetTime}
            rowStyle={{ flexDirection }}
            glow={allowBlurFor(quality)}
          />

          <View style={styles.stage}>
            <ChronographFace
              hidden={shouldHideTimer}
              readout={shouldHideTimer ? null : elapsedTime.toFixed(2)}
              running={isRunning}
              glow={allowBlurFor(quality)}
            />
          </View>

          {!isRunning && !isFinished ? (
            <LockPlunger mode="start" onPress={startTimer} />
          ) : isRunning ? (
            <LockPlunger mode="stop" onPress={stopTimer} />
          ) : (
            <ScoreCrown score={roundScore ?? 0} />
          )}
        </View>
      </TickLockWorld>
    </SevenGameSessionShell>
  );
}

const styles = StyleSheet.create({
  play: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 12,
    alignItems: 'center',
  },
  stage: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
