import { useState, useEffect, useRef } from 'react';
import { getDifferenceSettings } from './config';
import { generateDifferenceGrid, GridData } from './engine';
import { SESSION_ROUNDS, lerpByRound } from '@/games/sessionShell';

function gridCountForRound(difficulty: 'easy' | 'medium' | 'hard', round: number): number {
  const start = getDifferenceSettings(difficulty).gridCount;
  const raw = lerpByRound(start, 16, round);
  if (raw < 6.5) return 4;
  if (raw < 12.5) return 9;
  return 16;
}

export const useDifferenceFlow = (
  difficulty: 'easy' | 'medium' | 'hard',
  enabled: boolean,
  frozen: boolean,
  onCorrect: (points: number) => void,
  onWrong: () => void,
  onComplete: () => void,
) => {
  const base = getDifferenceSettings(difficulty);
  const hard = getDifferenceSettings('hard');
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const [timeLeft, setTimeLeft] = useState(base.timeLimit);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const settled = useRef(false);
  const onWrongRef = useRef(onWrong);
  const onCorrectRef = useRef(onCorrect);
  const onCompleteRef = useRef(onComplete);
  onWrongRef.current = onWrong;
  onCorrectRef.current = onCorrect;
  onCompleteRef.current = onComplete;

  const gridCount = gridCountForRound(difficulty, round);
  const timeLimit = lerpByRound(base.timeLimit, hard.timeLimit, round);

  useEffect(() => {
    if (!enabled || frozen || round > SESSION_ROUNDS) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    settled.current = false;
    setGridData(generateDifferenceGrid(gridCount));
    setTimeLeft(timeLimit);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          if (!settled.current) {
            settled.current = true;
            setTimeout(() => onWrongRef.current(), 0);
          }
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [round, enabled, frozen, retryKey, gridCount, timeLimit]);

  const selectTile = (index: number) => {
    if (!enabled || frozen || !gridData || settled.current) return;
    settled.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    if (index === gridData.differentIndex) {
      setScore((s) => s + 1);
      onCorrectRef.current(1);
      if (round >= SESSION_ROUNDS) {
        onCompleteRef.current();
      } else {
        setRound((r) => r + 1);
      }
    } else {
      onWrongRef.current();
    }
  };

  const retryRound = () => setRetryKey((k) => k + 1);

  return {
    gridData,
    round,
    maxRounds: SESSION_ROUNDS,
    timeLeft,
    score,
    gridCount,
    selectTile,
    retryRound,
  };
};
