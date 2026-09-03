import type { ReactNode } from 'react';
import type { GameplayDifficulty } from '@/types';

export type SevenGameScreenProps = {
  difficulty: GameplayDifficulty;
  skipHowTo?: boolean;
  onHowToFinished?: () => void;
  onCorrect: (points: number) => void;
  onComplete: () => void;
  onExitToCategory: () => void;
  onRestart: () => void;
};

export type SevenGameSessionShellProps = {
  howToTitle: string;
  howToBody: string;
  skipHowTo?: boolean;
  wrongOpen: boolean;
  children: ReactNode;
  onHowToFinished?: () => void;
  onPlayStart: () => void;
  onContinue: () => void;
  onExitToCategory: () => void;
  onRestart: () => void;
};
