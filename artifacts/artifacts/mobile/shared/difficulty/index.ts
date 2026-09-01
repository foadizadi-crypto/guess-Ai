import type { Difficulty } from '@/types';

export type GameplayDifficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_IDS = ['easy', 'medium', 'hard', 'extra-hard', 'max'] as const;

export const OPEN_DIFFICULTY_IDS: readonly GameplayDifficulty[] = ['easy', 'medium', 'hard'];

export function isDifficultyOpen(difficulty: Difficulty): boolean {
  return difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard';
}

/** Locked tiers have no unique gameplay numbers yet — they use Hard's existing tunables. */
export function toGameplayDifficulty(difficulty: Difficulty): GameplayDifficulty {
  if (difficulty === 'medium') return 'medium';
  if (difficulty === 'hard' || difficulty === 'extra-hard' || difficulty === 'max') return 'hard';
  return 'easy';
}
