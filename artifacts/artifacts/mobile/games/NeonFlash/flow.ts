import { useState, useEffect, useRef } from 'react';
import { getSimonSettings } from './config';
import { generateNextTile, verifyPlayerChoice } from './engine';
import { SESSION_ROUNDS, lerpByRound } from '@/games/sessionShell';

export const useSimonFlow = (
  difficulty: 'easy' | 'medium' | 'hard',
  enabled: boolean,
  frozen: boolean,
  onCorrect: (points: number) => void,
  onWrong: () => void,
  onComplete: () => void,
) => {
  const base = getSimonSettings(difficulty);
  const hard = getSimonSettings('hard');
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [isShowingSeq, setIsShowingSeq] = useState(false);
  const [round, setRound] = useState(1);
  const [replayKey, setReplayKey] = useState(0);
  const onWrongRef = useRef(onWrong);
  const onCorrectRef = useRef(onCorrect);
  const onCompleteRef = useRef(onComplete);
  onWrongRef.current = onWrong;
  onCorrectRef.current = onCorrect;
  onCompleteRef.current = onComplete;
  const speed = lerpByRound(base.speed, hard.speed, round);

  const playGen = useRef(0);

  const playSequence = async (seq: number[]) => {
    const gen = ++playGen.current;
    setIsShowingSeq(true);
    setPlayerSeq([]);
    for (let i = 0; i < seq.length; i++) {
      await new Promise((r) => setTimeout(r, speed));
      if (playGen.current !== gen) return;
      setActiveTile(seq[i]);
      await new Promise((r) => setTimeout(r, speed));
      if (playGen.current !== gen) return;
      setActiveTile(null);
    }
    if (playGen.current !== gen) return;
    setIsShowingSeq(false);
  };

  useEffect(() => {
    if (!enabled) return;
    if (frozen) {
      playGen.current += 1;
      setIsShowingSeq(false);
      setActiveTile(null);
      return;
    }
    if (sequence.length === 0) {
      const first = [generateNextTile()];
      setSequence(first);
      void playSequence(first);
      return;
    }
    void playSequence(sequence);
  }, [enabled, frozen, replayKey]);

  const submitChoice = (id: number) => {
    if (!enabled || frozen || isShowingSeq) return;
    const newPlayerSeq = [...playerSeq, id];
    setPlayerSeq(newPlayerSeq);

    if (!verifyPlayerChoice(newPlayerSeq, sequence)) {
      onWrongRef.current();
      return;
    }

    if (newPlayerSeq.length !== sequence.length) return;

    onCorrectRef.current(1);
    if (round >= SESSION_ROUNDS) {
      onCompleteRef.current();
      return;
    }
    setRound((r) => r + 1);
    const nextSeq = [...sequence, generateNextTile()];
    setSequence(nextSeq);
    setTimeout(() => playSequence(nextSeq), 600);
  };

  const retryRound = () => setReplayKey((k) => k + 1);

  return {
    round,
    maxRounds: SESSION_ROUNDS,
    activeTile,
    isShowingSeq,
    submitChoice,
    retryRound,
  };
};
