import { buildRawGameConfig } from '@/shared/games/rawConfig';

export const FLIP_MIND_GAME_ID = 'flip_mind';
export const FLIP_MIND_TITLE = 'Flip Mind';
// Presentation copy lives in gamescreen.tsx (English). Gameplay numbers below are unchanged.

export type TargetColor = 'green' | 'red';

export const getReactionSettings = (difficulty: 'easy' | 'medium' | 'hard') => {
  switch (difficulty) {
    case 'easy': return { maxRounds: 10, timeLimit: 5.0 };
    case 'medium': return { maxRounds: 20, timeLimit: 3.0 };
    case 'hard': return { maxRounds: 30, timeLimit: 1.5 };
    default: return { maxRounds: 10, timeLimit: 5.0 };
  }
};

export const rawConfig = buildRawGameConfig(FLIP_MIND_GAME_ID);
