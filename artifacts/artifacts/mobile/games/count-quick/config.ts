import { buildRawGameConfig } from '@/shared/games/rawConfig';
import type { GameplayDifficulty } from '@/shared/difficulty';

export const COUNT_QUICK_GAME_ID = 'count-quick';
export const COUNT_QUICK_QUESTIONS = 5;
export const COUNT_QUICK_ANSWER_OPTIONS = 4;
export const COUNT_QUICK_SCORE_CORRECT = 100;
export const COUNT_QUICK_SCORE_WRONG = -50;
export const COUNT_QUICK_GAME_OVER_WRONGS = 3;
export const COUNT_QUICK_TARGET_RULE = 'count-color' as const;

export const COUNT_QUICK_SHAPES = [
  'circle',
  'square',
  'triangle',
  'star',
  'diamond',
  'hexagon',
] as const;

export type CountQuickShapeId = (typeof COUNT_QUICK_SHAPES)[number];

export const COUNT_QUICK_ITEM_COUNT: Record<GameplayDifficulty, number> = {
  easy: 6,
  medium: 9,
  hard: 12,
};

export const COUNT_QUICK_SECONDS: Record<GameplayDifficulty, number> = {
  easy: 5,
  medium: 3,
  hard: 2,
};

export interface CountQuickPalette {
  id: string;
  name: string;
  colors: readonly string[];
}

export const COUNT_QUICK_PALETTES: readonly CountQuickPalette[] = [
  {
    id: 'candy',
    name: 'Candy',
    colors: ['#FF4D6D', '#FFB703', '#06D6A0', '#4D96FF', '#9B5DE5', '#F15BB5'],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: ['#0077B6', '#00B4D8', '#48CAE4', '#90E0EF', '#023E8A', '#CAF0F8'],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: ['#FF6B35', '#F7C59F', '#EF476F', '#FFD166', '#8338EC', '#F72585'],
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2', '#D8F3DC'],
  },
  {
    id: 'neon',
    name: 'Neon',
    colors: ['#FF006E', '#FB5607', '#FFBE0B', '#00F5D4', '#3A86FF', '#8338EC'],
  },
];

export const rawConfig = buildRawGameConfig(COUNT_QUICK_GAME_ID);
