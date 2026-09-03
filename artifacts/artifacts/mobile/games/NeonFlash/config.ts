import { buildRawGameConfig } from '@/shared/games/rawConfig';

export const NEON_FLASH_GAME_ID = 'neon_flash';
export const NEON_FLASH_TITLE = 'Neon Flash';

export const TILES = [
  { id: 0, color: '#e74c3c', light: '#ff6b6b' },
  { id: 1, color: '#3498db', light: '#5dade2' },
  { id: 2, color: '#2ecc71', light: '#58d68d' },
  { id: 3, color: '#f1c40f', light: '#f5b041' },
];

export const getSimonSettings = (difficulty: 'easy' | 'medium' | 'hard') => {
  switch (difficulty) {
    case 'easy': return { maxRounds: 4, speed: 500 };
    case 'medium': return { maxRounds: 6, speed: 400 };
    case 'hard': return { maxRounds: 8, speed: 250 };
    default: return { maxRounds: 4, speed: 500 };
  }
};

export const rawConfig = buildRawGameConfig(NEON_FLASH_GAME_ID);
