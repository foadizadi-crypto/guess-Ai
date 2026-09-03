import { useState, useEffect, useRef } from 'react';
import { getReactionSettings, TargetColor } from './config';
import { generateRandomColor, verifyReverseAction } from './engine';
import { SESSION_ROUNDS, lerpByRound } from '@/games/sessionShell';

export const useReactionFlow = (
  difficulty: 'easy' | 'medium' | 'hard',
  enabled: boolean,
  frozen: boolean,
  onCorrect: (points: number) => void,
  onWrong: () => void,
  onComplete: () => void,
) => {
  const base = getReactionSettings(difficulty);
  const hard = getReactionSettings('hard');
  const [currentCircle, setCurrentCircle] = useState<TargetColor>('green');
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

  const timeLimit = lerpByRound(base.timeLimit, hard.timeLimit, round);

  useEffect(() => {
    if (!enabled || frozen || round > SESSION_ROUNDS) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    settled.current = false;
    setCurrentCircle(generateRandomColor());
    setTimeLeft(timeLimit);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.05) {
          if (!settled.current) {
            settled.current = true;
            setTimeout(() => onWrongRef.current(), 0);
          }
          return 0;
        }
        return prev - 0.05;
      });
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [round, enabled, frozen, retryKey, timeLimit]);

  const handleButtonPress = (color: 'green' | 'red') => {
    if (!enabled || frozen || settled.current) return;
    settled.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    if (verifyReverseAction(currentCircle, color)) {
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
    currentCircle,
    round,
    maxRounds: SESSION_ROUNDS,
    timeLeft,
    score,
    handleButtonPress,
    retryRound,
  };
};
