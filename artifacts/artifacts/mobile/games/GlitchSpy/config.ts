import { buildRawGameConfig } from '@/shared/games/rawConfig';

export const GLITCH_SPY_GAME_ID = 'glitch_spy';
export const GLITCH_SPY_TITLE = 'Glitch Spy';

export const SHAPE_POOL = ['⭐', '🔺', '🟢', '🟦', '💛', '💜', '🍎', '🐱', '🚀', '💎', '🍀', '🌙'];

export const getDifferenceSettings = (difficulty: 'easy' | 'medium' | 'hard') => {
  switch (difficulty) {
    case 'easy': return { gridCount: 4, timeLimit: 8.0 };
    case 'medium': return { gridCount: 9, timeLimit: 5.0 };
    case 'hard': return { gridCount: 16, timeLimit: 3.0 };
    default: return { gridCount: 4, timeLimit: 8.0 };
  }
};

export const rawConfig = buildRawGameConfig(GLITCH_SPY_GAME_ID);
