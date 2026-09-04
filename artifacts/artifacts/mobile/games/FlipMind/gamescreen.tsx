import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReactionFlow } from './flow';
import { verifyReverseAction } from './engine';
import { SevenGameSessionShell } from '@/games/sessionShell';
import type { SevenGameScreenProps } from '@/games/sessionShell';
import { HudPlate, allowBlurFor, allowBurstFor, useVisualQuality } from '@/games/visualFoundation';
import { useRTL } from '@/hooks/useRTL';
import type { TargetColor } from './config';
import { FlipMindWorld } from './FlipMindWorld';
import { FlipMindHud } from './FlipMindHud';
import { FlipCard } from './FlipCard';
import { PolarPad } from './PolarPad';
import { MindTone } from './flipTokens';

const HOW_TO_TITLE = 'Flip Mind';
const HOW_TO_BODY =
  'Watch the color. Tap the opposite pad before time runs out. Green means tap Red. Red means tap Green.';

type Flash = 'correct' | 'wrong' | null;
type PadState = 'idle' | 'selected' | 'correct' | 'wrong';

export default function ReverseReactionScreen({
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
  const { currentCircle, round, maxRounds, timeLeft, score, handleButtonPress, retryRound } = useReactionFlow(
    difficulty,
    playing,
    wrongOpen,
    onCorrect,
    () => setWrongOpen(true),
    onComplete,
  );

  const insets = useSafeAreaInsets();
  const { flexDirection } = useRTL();
  const quality = useVisualQuality();
  const topPad = Platform.OS === 'web' ? 54 : insets.top + 10;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 14;

  const [flash, setFlash] = useState<Flash>(null);
  const [padMark, setPadMark] = useState<{ color: TargetColor; ok: boolean } | null>(null);
  const lastTime = useRef(timeLeft);
  const [timeCap, setTimeCap] = useState(Math.max(timeLeft, 0.05));

  useEffect(() => {
    if (timeLeft > lastTime.current + 0.04) setTimeCap(timeLeft);
    lastTime.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    if (!flash && !padMark) return;
    const id = setTimeout(() => {
      setFlash(null);
      setPadMark(null);
    }, 280);
    return () => clearTimeout(id);
  }, [flash, padMark, round, score, wrongOpen]);

  const onPad = (color: TargetColor) => {
    if (!playing || wrongOpen) return;
    const ok = verifyReverseAction(currentCircle, color);
    setPadMark({ color, ok });
    setFlash(ok ? 'correct' : 'wrong');
    handleButtonPress(color);
  };

  const padState = (color: TargetColor): PadState => {
    if (!padMark || padMark.color !== color) return 'idle';
    if (padMark.ok) return 'correct';
    return 'wrong';
  };

  const timeRatio = timeCap > 0 ? Math.min(1, Math.max(0, timeLeft / timeCap)) : 0;
  const urgency = playing && !wrongOpen && timeLeft <= 1;

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
        setFlash(null);
        setPadMark(null);
      }}
      onExitToCategory={onExitToCategory}
      onRestart={onRestart}
    >
      <FlipMindWorld quality={quality} urgency={urgency} flash={flash}>
        <View style={[styles.play, { paddingTop: topPad, paddingBottom: botPad }]}>
          <FlipMindHud
            round={round}
            maxRounds={maxRounds}
            score={score}
            timeLeft={timeLeft}
            timeRatio={timeRatio}
            rowStyle={{ flexDirection }}
            glow={allowBlurFor(quality)}
          />

          <HudPlate
            blur={allowBlurFor(quality)}
            border="rgba(167,139,250,0.38)"
            fill={['rgba(18,8,42,0.88)', 'rgba(8,4,22,0.78)']}
            style={styles.hintPlate}
          >
            <Text style={styles.hint}>Do the opposite. If the card is green, tap Red.</Text>
          </HudPlate>

          <View style={styles.stage}>
            <FlipCard
              color={currentCircle}
              round={round}
              flash={allowBurstFor(quality) ? flash : null}
            />
          </View>

          <View style={[styles.pads, { flexDirection }]}>
            <PolarPad color="green" onPress={() => onPad('green')} state={padState('green')} />
            <PolarPad color="red" onPress={() => onPad('red')} state={padState('red')} />
          </View>
        </View>
      </FlipMindWorld>
    </SevenGameSessionShell>
  );
}

const styles = StyleSheet.create({
  play: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 12,
  },
  hintPlate: {
    alignSelf: 'stretch',
  },
  hint: {
    color: MindTone.ink,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
  },
  stage: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pads: {
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    flexShrink: 0,
  },
});
