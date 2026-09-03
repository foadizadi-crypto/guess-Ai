import { useState, useEffect, useRef } from 'react';
import { getClickSettings } from './config';
import { calculateClickScore } from './engine';
import { SESSION_ROUNDS, lerpByRound } from '@/games/sessionShell';

export const usePerfectClickFlow = (
  difficulty: 'easy' | 'medium' | 'hard',
  enabled: boolean,
  frozen: boolean,
  onCorrect: (points: number) => void,
  onWrong: () => void,
  onComplete: () => void,
) => {
  const base = getClickSettings(difficulty);
  const hard = getClickSettings('hard');
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [roundScore, setRoundScore] = useState<number | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const onWrongRef = useRef(onWrong);
  const onCorrectRef = useRef(onCorrect);
  const onCompleteRef = useRef(onComplete);
  onWrongRef.current = onWrong;
  onCorrectRef.current = onCorrect;
  onCompleteRef.current = onComplete;

  const targetTime = lerpByRound(base.targetTime, hard.targetTime, round);
  const hideTime = lerpByRound(base.hideTime, hard.hideTime, round);
  const tolerance = lerpByRound(base.tolerance, hard.tolerance, round);

  useEffect(() => {
    setIsRunning(false);
    setIsFinished(false);
    setRoundScore(null);
    setElapsedTime(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [round, retryKey]);

  useEffect(() => {
    if (!enabled || frozen) {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, frozen]);

  const startTimer = () => {
    if (!enabled || frozen || isRunning) return;
    setIsRunning(true);
    setIsFinished(false);
    setRoundScore(null);
    setElapsedTime(0);
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      setElapsedTime((Date.now() - startTimeRef.current) / 1000);
    }, 10);
  };

  const stopTimer = () => {
    if (!enabled || frozen || !isRunning || intervalRef.current === null) return;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsRunning(false);
    setIsFinished(true);
    const finalTime = (Date.now() - startTimeRef.current) / 1000;
    setElapsedTime(finalTime);
    const earned = calculateClickScore(finalTime, targetTime, tolerance);
    setRoundScore(earned);
    if (earned <= 0) {
      onWrongRef.current();
      return;
    }
    setScore((s) => s + earned);
    onCorrectRef.current(earned);
    if (round >= SESSION_ROUNDS) {
      onCompleteRef.current();
    } else {
      setTimeout(() => setRound((r) => r + 1), 600);
    }
  };

  const retryRound = () => setRetryKey((k) => k + 1);

  return {
    elapsedTime,
    isRunning,
    isFinished,
    roundScore,
    targetTime,
    hideTime,
    round,
    maxRounds: SESSION_ROUNDS,
    score,
    startTimer,
    stopTimer,
    retryRound,
  };
};
