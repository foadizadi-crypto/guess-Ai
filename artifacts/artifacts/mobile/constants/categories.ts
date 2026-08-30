import type { Category } from '@/types';

/**
 * First three categories are free. The rest unlock as the player levels up.
 * Extra unlocks (shop) are merged in by the caller.
 */
export const STARTER_CATEGORIES: readonly Category[] = ['animals', 'nature', 'food', 'speed_card'];

export const CATEGORY_UNLOCK_LEVEL: Record<Category, number> = {
  animals: 1,
  nature: 1,
  food: 1,
  landmarks: 5,
  movies: 8,
  sports: 12,
  technology: 16,
  art: 20,
  vehicles: 24,
  celebrities: 28,
  history: 32,
  space: 36,
  cities: 40,
  music: 45,
  science: 50,
  speed_card: 1,
};

export function categoryUnlockLevel(category: Category): number {
  return CATEGORY_UNLOCK_LEVEL[category] ?? 1;
}

export function isCategoryUnlocked(
  category: Category,
  playerLevel: number,
  extraUnlocks: readonly string[] = [],
): boolean {
  if (extraUnlocks.includes(category)) return true;
  return playerLevel >= categoryUnlockLevel(category);
}
