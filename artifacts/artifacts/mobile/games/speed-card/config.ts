import { buildRawGameConfig } from '@/shared/games/rawConfig';
import type { GameplayDifficulty } from '@/shared/difficulty';

export const SPEED_CARD_COUNT = 5;
export const SPEED_CARD_FLASH_MS = 500;

export const SPEED_CARD_REVEAL_MS: Record<GameplayDifficulty, number> = {
  easy: 3000,
  medium: 1500,
  hard: 500,
};

export const SPEED_CARD_PALETTE = [
  { id: 'red', name: 'Red', hex: '#E53935' },
  { id: 'blue', name: 'Blue', hex: '#1E88E5' },
  { id: 'yellow', name: 'Yellow', hex: '#FDD835' },
  { id: 'green', name: 'Green', hex: '#43A047' },
  { id: 'orange', name: 'Orange', hex: '#FB8C00' },
  { id: 'purple', name: 'Purple', hex: '#8E24AA' },
  { id: 'pink', name: 'Pink', hex: '#EC407A' },
  { id: 'brown', name: 'Brown', hex: '#6D4C41' },
  { id: 'black', name: 'Black', hex: '#212121' },
  { id: 'white', name: 'White', hex: '#FAFAFA' },
  { id: 'turquoise', name: 'Turquoise', hex: '#00ACC1' },
  { id: 'gold', name: 'Gold', hex: '#FFD54F' },
  { id: 'navy', name: 'Navy', hex: '#1A237E' },
  { id: 'gray', name: 'Gray', hex: '#9E9E9E' },
  { id: 'lime', name: 'Lime', hex: '#C0CA33' },
  { id: 'magenta', name: 'Magenta', hex: '#D81B60' },
] as const;

export type SpeedCardPaletteColor = (typeof SPEED_CARD_PALETTE)[number];

export const SPEED_CARD_PALETTE_IDS: readonly string[] = SPEED_CARD_PALETTE.map((color) => color.id);

export const rawConfig = buildRawGameConfig('speed-card');
