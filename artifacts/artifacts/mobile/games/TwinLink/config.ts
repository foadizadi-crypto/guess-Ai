import { buildRawGameConfig } from '@/shared/games/rawConfig';

export const TWIN_LINK_GAME_ID = 'twin_link';
export const TWIN_LINK_TITLE = 'Twin Link';

export const ICONS_POOL = ['🍎', '🍌', '🍇', '🍉', '🍒', '🥑', '🍍', '🍊', '🍓', '🥝', '🌽', '🥕'];

export const getMatchSettings = (difficulty: 'easy' | 'medium' | 'hard') => {
  switch (difficulty) {
    case 'easy': return { pairCount: 4 };   // ۸ کارت
    case 'medium': return { pairCount: 6 }; // ۱۲ کارت
    case 'hard': return { pairCount: 12 };  // ۲۴ کارت
    default: return { pairCount: 4 };
  }
};

export const rawConfig = buildRawGameConfig(TWIN_LINK_GAME_ID);
