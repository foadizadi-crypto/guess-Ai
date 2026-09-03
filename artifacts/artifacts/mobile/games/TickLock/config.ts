import { buildRawGameConfig } from '@/shared/games/rawConfig';

export const TICK_LOCK_GAME_ID = 'tick_lock';
export const TICK_LOCK_TITLE = 'Tick Lock';

export const getClickSettings = (difficulty: 'easy' | 'medium' | 'hard') => {
  switch (difficulty) {
    case 'easy': return { targetTime: 1.00, hideTime: 9.99, tolerance: 0.15 };
    case 'medium': return { targetTime: 1.00, hideTime: 0.5, tolerance: 0.08 };
    case 'hard': return { targetTime: 1.50, hideTime: 0.4, tolerance: 0.04 };
    default: return { targetTime: 1.00, hideTime: 9.99, tolerance: 0.15 };
  }
};

export const rawConfig = buildRawGameConfig(TICK_LOCK_GAME_ID);
