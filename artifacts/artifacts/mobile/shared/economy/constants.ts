import type { GameEvent } from './types';

/** Event multipliers — defined once. Not copied into game configs. */
export const EVENT_MULTIPLIERS: Record<GameEvent, number> = {
  CORRECT: 1,
  COMBO: 1.5,
  SUPER_COMBO: 2.5,
  FINISH: 3,
  STREAK: 1.25,
  WRONG: 0,
  LEVEL_COMPLETE: 2,
};

export const ECONOMY_RATES = {
  XP_RATE: 1,
  COIN_RATE: 0.5,
} as const;

export function getProgressionMultiplier(_playerLevel: number): number {
  return 1;
}

export function eventMultiplier(event: GameEvent): number {
  return EVENT_MULTIPLIERS[event];
}
