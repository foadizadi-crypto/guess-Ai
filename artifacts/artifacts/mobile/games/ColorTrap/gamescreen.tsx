import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStroopFlow } from './flow';
import { SevenGameSessionShell } from '@/games/sessionShell';
import type { SevenGameScreenProps } from '@/games/sessionShell';
import { HudPlate, allowBlurFor, allowBurstFor, useVisualQuality } from '@/games/visualFoundation';
import { useRTL } from '@/hooks/useRTL';
import { ColorTrapWorld } from './ColorTrapWorld';
import { ColorTrapHud } from './ColorTrapHud';
import { WordStage } from './WordStage';
import { TrapOption } from './TrapOption';
import { TrapTone } from './trapTokens';

const HOW_TO_TITLE = 'Color Trap';
const HOW_TO_BODY = 'Choose the color of the text, not the word itself.';

type Flash = 'correct' | 'wrong' | null;
type PickMark = { opt: string; ok: boolean };

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
  const quality = useVisualQuality();
  const topPad = Platform.OS === 'web' ? 54 : insets.top + 10;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 14;

  const questionKey = currentQuestion
    ? `${round}:${currentQuestion.word.name}:${currentQuestion.textColor.hex}:${currentQuestion.options.join('|')}`
    : `empty:${round}`;

  const [capKey, setCapKey] = useState(questionKey);
  const [roundCap, setRoundCap] = useState(() => Math.max(timeLeft, 0.1));
  if (capKey !== questionKey) {
    setCapKey(questionKey);
    setRoundCap(Math.max(timeLeft, 0.1));
  }

  const [flash, setFlash] = useState<Flash>(null);
  const [pickMark, setPickMark] = useState<PickMark | null>(null);

  useEffect(() => {
    setPickMark(null);
  }, [questionKey]);

  useEffect(() => {
    if (wrongOpen) setFlash('wrong');
  }, [wrongOpen]);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 280);
    return () => clearTimeout(id);
  }, [flash, questionKey]);

  const timerRatio = Math.min(1, Math.max(0, timeLeft / roundCap));
  const ink = currentQuestion?.textColor.hex ?? TrapTone.cyan;
  const urgency = playing && !wrongOpen && timeLeft <= 1;

  const onPick = (opt: string) => {
    if (!playing || wrongOpen || !currentQuestion) return;
    const ok = opt === currentQuestion.textColor.name;
    setPickMark({ opt, ok });
    setFlash(ok ? 'correct' : 'wrong');
    submitAnswer(opt);
  };

  const optionState = (opt: string) => {
    if (!pickMark || pickMark.opt !== opt) return 'idle' as const;
    return pickMark.ok ? ('correct' as const) : ('wrong' as const);
  };

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
        setPickMark(null);
      }}
      onExitToCategory={onExitToCategory}
      onRestart={onRestart}
    >
      <ColorTrapWorld quality={quality} urgency={urgency} flash={allowBurstFor(quality) ? flash : null} ink={ink}>
        <View style={[styles.play, { paddingTop: topPad, paddingBottom: botPad }]}>
          <ColorTrapHud
            round={round}
            maxRounds={maxQuestions}
            score={score}
            timeLeft={timeLeft}
            timeRatio={timerRatio}
            rowStyle={{ flexDirection }}
            glow={allowBlurFor(quality)}
          />

          <HudPlate
            blur={allowBlurFor(quality)}
            border="rgba(34,211,238,0.38)"
            fill={['rgba(18,8,32,0.9)', 'rgba(8,4,18,0.8)']}
            style={styles.hintPlate}
          >
            <Text style={styles.hint}>Name the ink color. Ignore the written word.</Text>
          </HudPlate>

          {!currentQuestion ? null : (
            <>
              <WordStage
                word={currentQuestion.word.name}
                ink={ink}
                questionKey={questionKey}
                flash={allowBurstFor(quality) ? flash : null}
                burst={allowBurstFor(quality)}
              />
              <View style={styles.options}>
                {currentQuestion.options.map((opt, i) => (
                  <TrapOption
                    key={`${questionKey}-${i}`}
                    label={opt}
                    onPress={() => onPick(opt)}
                    state={optionState(opt)}
                    index={i}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </ColorTrapWorld>
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
    color: TrapTone.ink,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 2,
  },
});
