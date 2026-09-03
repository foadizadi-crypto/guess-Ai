import { buildRawGameConfig } from '@/shared/games/rawConfig';

export const GOLD_RUSH_GAME_ID = 'gold_rush';
export const GOLD_RUSH_TITLE = 'Gold Rush';

export interface CardState {
  id: number;
  type: 'gold' | 'bomb' | 'multiplier';
  value: number;
  isRevealed: boolean;
}

export const getFateSettings = (difficulty: 'easy' | 'medium' | 'hard') => {
  switch (difficulty) {
    case 'easy': return { totalCards: 5, bombCount: 1, multiplierCount: 1 };
    case 'medium': return { totalCards: 5, bombCount: 2, multiplierCount: 0 };
    case 'hard': return { totalCards: 6, bombCount: 3, multiplierCount: 0 };
    default: return { totalCards: 5, bombCount: 1, multiplierCount: 1 };
  }
};

export const rawConfig = buildRawGameConfig(GOLD_RUSH_GAME_ID);
