import { buildRawGameConfig } from '@/shared/games/rawConfig';
import type { GameplayDifficulty } from '@/shared/difficulty';

export const LOST_ITEM_GAME_ID = 'lost-item';
export const LOST_ITEM_QUESTIONS = 5;
export const LOST_ITEM_ANSWER_OPTIONS = 4;
export const LOST_ITEM_SCORE_CORRECT = 100;
export const LOST_ITEM_SCORE_WRONG = -50;
export const LOST_ITEM_GAME_OVER_WRONGS = 3;
export const LOST_ITEM_DARK_MS = 3000;
export const LOST_ITEM_IMAGE_STYLE = 'cartoon' as const;

export const LOST_ITEM_PHASE_MS: Record<GameplayDifficulty, number> = {
  easy: 6000,
  medium: 4000,
  hard: 2500,
};

export const LOST_ITEM_LOCATIONS = [
  'lower left',
  'lower right',
  'upper left',
  'upper right',
  'center left',
  'center right',
] as const;

export type LostItemLocation = (typeof LOST_ITEM_LOCATIONS)[number];

export interface LostItemSet {
  id: string;
  difficulty: GameplayDifficulty;
  scene: string;
  items: readonly string[];
}

export const LOST_ITEM_SETS: readonly LostItemSet[] = [
  {
    id: 'large-animals',
    difficulty: 'easy',
    scene: 'a clear outdoor clearing with 10 large animals standing together, each animal big and easy to see',
    items: [
      'elephant',
      'lion',
      'giraffe',
      'hippopotamus',
      'rhinoceros',
      'bear',
      'gorilla',
      'tiger',
      'zebra',
      'panda',
    ],
  },
  {
    id: 'large-shapes',
    difficulty: 'easy',
    scene: 'a bright toy table with 10 large geometric solids standing together, each shape big and easy to see',
    items: [
      'cube',
      'sphere',
      'pyramid',
      'cylinder',
      'cone',
      'star prism',
      'torus',
      'rectangular box',
      'hexagonal prism',
      'heart prism',
    ],
  },
  {
    id: 'trees',
    difficulty: 'easy',
    scene: 'an open park with 5 large trees standing together, each tree big and easy to see',
    items: ['oak tree', 'pine tree', 'palm tree', 'cherry blossom tree', 'willow tree'],
  },
  {
    id: 'tool-wall',
    difficulty: 'medium',
    scene: 'a crowded warehouse tool wall packed with medium-sized tools hanging densely together',
    items: [
      'wrench',
      'pliers',
      'hammer',
      'screwdriver',
      'hand saw',
      'power drill',
      'tape measure',
      'spirit level',
      'clamp',
      'chisel',
      'mallet',
      'metal file',
      'allen key',
      'socket wrench',
      'putty knife',
      'utility knife',
      'crowbar',
      'bench vise',
      'sander',
      'bolt cutter',
      'pipe wrench',
      'staple gun',
      'hex socket',
      'nail puller',
    ],
  },
  {
    id: 'tree-leaves',
    difficulty: 'hard',
    scene: 'a dense tree packed with many tiny individual leaves and fine foliage detail',
    items: ['oak leaf', 'maple leaf', 'birch leaf', 'holly leaf', 'fern frond'],
  },
  {
    id: 'library-books',
    difficulty: 'hard',
    scene: 'a packed library wall of shelves filled with many small books and fine shelf detail',
    items: [
      'red hardcover book',
      'blue hardcover book',
      'green hardcover book',
      'yellow hardcover book',
      'thick encyclopedia',
      'slim poetry book',
    ],
  },
  {
    id: 'messy-toys',
    difficulty: 'hard',
    scene: 'a crowded messy kids room filled with many tiny toys and lots of small details',
    items: [
      'small rubber duck',
      'tiny race car',
      'mini teddy bear',
      'small wooden block',
      'yo-yo',
      'glass marble',
    ],
  },
];

export const rawConfig = buildRawGameConfig(LOST_ITEM_GAME_ID);
