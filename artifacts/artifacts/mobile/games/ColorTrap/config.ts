import { buildRawGameConfig } from '@/shared/games/rawConfig';

export const COLOR_TRAP_GAME_ID = 'color_trap';
export const COLOR_TRAP_TITLE = 'Color Trap';

export const COLOR_POOL = [
  { name: 'Red', hex: '#e74c3c' },
  { name: 'Blue', hex: '#3498db' },
  { name: 'Green', hex: '#2ecc71' },
  { name: 'Yellow', hex: '#f1c40f' },
];

export const getDifficultySettings = (difficulty: 'easy' | 'medium' | 'hard') => {
  switch (difficulty) {
    case 'easy': return { maxQuestions: 5, timeLimit: 4 };
    case 'medium': return { maxQuestions: 8, timeLimit: 2.5 };
    case 'hard': return { maxQuestions: 12, timeLimit: 1.5 };
    default: return { maxQuestions: 5, timeLimit: 4 };
  }
};

export const rawConfig = buildRawGameConfig(COLOR_TRAP_GAME_ID);
