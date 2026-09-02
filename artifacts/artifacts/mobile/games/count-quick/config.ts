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

export interface CountQuickSwatch {
  name: string;
  hex: string;
}

export interface CountQuickPalette {
  id: string;
  name: string;
  colors: readonly CountQuickSwatch[];
}

export const COUNT_QUICK_PALETTES: readonly CountQuickPalette[] = [
  {
    id: 'candy',
    name: 'Candy',
    colors: [
      { name: 'red', hex: '#FF4D6D' },
      { name: 'gold', hex: '#FFB703' },
      { name: 'green', hex: '#06D6A0' },
      { name: 'blue', hex: '#4D96FF' },
      { name: 'purple', hex: '#9B5DE5' },
      { name: 'pink', hex: '#F15BB5' },
    ],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: [
      { name: 'navy', hex: '#0077B6' },
      { name: 'cyan', hex: '#00B4D8' },
      { name: 'aqua', hex: '#48CAE4' },
      { name: 'ice', hex: '#90E0EF' },
      { name: 'blue', hex: '#023E8A' },
      { name: 'foam', hex: '#CAF0F8' },
    ],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: [
      { name: 'orange', hex: '#FF6B35' },
      { name: 'peach', hex: '#F7C59F' },
      { name: 'rose', hex: '#EF476F' },
      { name: 'gold', hex: '#FFD166' },
      { name: 'violet', hex: '#8338EC' },
      { name: 'pink', hex: '#F72585' },
    ],
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: [
      { name: 'forest', hex: '#14532D' },
      { name: 'green', hex: '#22C55E' },
      { name: 'mint', hex: '#ECFDF5' },
      { name: 'teal', hex: '#0F766E' },
      { name: 'lime', hex: '#A3E635' },
      { name: 'cream', hex: '#F7FEE7' },
    ],
  },
  {
    id: 'neon',
    name: 'Neon',
    colors: [
      { name: 'pink', hex: '#FF006E' },
      { name: 'orange', hex: '#FB5607' },
      { name: 'yellow', hex: '#FFBE0B' },
      { name: 'aqua', hex: '#00F5D4' },
      { name: 'blue', hex: '#3A86FF' },
      { name: 'purple', hex: '#8338EC' },
    ],
  },
];

export const rawConfig = buildRawGameConfig(COUNT_QUICK_GAME_ID);
