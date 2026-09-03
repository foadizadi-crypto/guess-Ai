import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/store/gameStore';
import { ROUTES } from '@/navigation/routes';
import type { GameplayDifficulty } from '@/types';
import type { SevenGameScreenProps } from './types';

export function useSevenGameRoute(): {
  sessionId: string;
  screenProps: SevenGameScreenProps;
} {
  const router = useRouter();
  const difficulty = useGameStore((s) => s.selectedDifficulty);
  const category = useGameStore((s) => s.selectedCategory);
  const sessionId = useGameStore((s) => s.gameSession?.id ?? 'none');
  const recordAnswer = useGameStore((s) => s.recordAnswer);
  const advanceQuestion = useGameStore((s) => s.advanceQuestion);
  const endSession = useGameStore((s) => s.endSession);
  const restartSession = useGameStore((s) => s.restartSession);
  const [skipHowTo, setSkipHowTo] = useState(false);

  const gameplay: GameplayDifficulty =
    difficulty === 'medium' || difficulty === 'hard' ? difficulty : 'easy';

  return {
    sessionId,
    screenProps: {
      difficulty: gameplay,
      skipHowTo,
      onHowToFinished: () => setSkipHowTo(true),
      onCorrect: (points: number) => {
        recordAnswer(true, points);
        advanceQuestion();
      },
      onComplete: () => {
        endSession();
        router.replace(ROUTES.RESULT);
      },
      onExitToCategory: () => {
        endSession({ applyFinish: false, sessionOutcome: 'lose' });
        router.replace(ROUTES.CATEGORY_SELECT);
      },
      onRestart: () => {
        setSkipHowTo(true);
        restartSession(difficulty, category);
      },
    },
  };
}
