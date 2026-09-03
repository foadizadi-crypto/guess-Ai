import { useState, useEffect, useRef } from 'react';
import { getDifficultySettings } from './config';
import { generateStroopQuestion, QuestionData } from './engine';
import { SESSION_ROUNDS, lerpByRound } from '@/games/sessionShell';

export const useStroopFlow = (
  difficulty: 'easy' | 'medium' | 'hard',
  enabled: boolean,
  frozen: boolean,
  onCorrect: (points: number) => void,
  onWrong: () => void,
  onComplete: () => void,
) => {
  const base = getDifficultySettings(difficulty);
  const hard = getDifficultySettings('hard');
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
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
  const questionDifficulty: 'easy' | 'medium' | 'hard' =
    round >= 14 ? 'hard' : round >= 8 && difficulty === 'easy' ? 'medium' : difficulty;

  useEffect(() => {
    if (!enabled || frozen || round > SESSION_ROUNDS) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    settled.current = false;
    setCurrentQuestion(generateStroopQuestion(questionDifficulty));
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
  }, [round, enabled, frozen, retryKey, timeLimit, questionDifficulty]);

  const submitAnswer = (selectedName: string) => {
    if (!enabled || frozen || !currentQuestion || settled.current) return;
    settled.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    if (selectedName === currentQuestion.textColor.name) {
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
    currentQuestion,
    score,
    maxQuestions: SESSION_ROUNDS,
    round,
    timeLeft,
    submitAnswer,
    retryRound,
  };
};
