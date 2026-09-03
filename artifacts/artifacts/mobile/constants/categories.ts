import type { Category } from '@/types';

/** 15 existing blur/image categories = slots 1–15. */
export const BLUR_CATEGORIES = [
  'animals',
  'nature',
  'food',
  'landmarks',
  'movies',
  'sports',
  'technology',
  'art',
  'vehicles',
  'celebrities',
  'history',
  'space',
  'cities',
  'music',
  'science',
] as const satisfies readonly Category[];

/**
 * Playable independent games on the category grid.
 * Slot 16 = Speed Card, 17 = Count Quick, 18 = Lost Item,
 * 19 = Flip Mind, 20 = Gold Rush, 21 = Tick Lock, 22 = Twin Link,
 * 23 = Neon Flash, 24 = Glitch Spy, 25 = Color Trap.
 */
export const NEW_PLAYABLE_CATEGORIES = [
  'speed_card',
  'count_quick',
  'lost_item',
  'flip_mind',
  'gold_rush',
  'tick_lock',
  'twin_link',
  'neon_flash',
  'glitch_spy',
  'color_trap',
] as const satisfies readonly Category[];

export const CATEGORY_LAYOUT: readonly Category[] = [
  ...BLUR_CATEGORIES,
  ...NEW_PLAYABLE_CATEGORIES,
];
// CATEGORY_LAYOUT length is 25. Indices 0–14 = blur 1–15.
// Index 15/16/17 = games 16/17/18. Index 18–24 = games 19–25.

/**
 * First three blur categories are free. New games are their own slots (16+),
 * not mixed into this starter set.
 */
export const STARTER_CATEGORIES: readonly Category[] = ['animals', 'nature', 'food'];

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
  count_quick: 1,
  lost_item: 1,
  flip_mind: 1,
  gold_rush: 1,
  tick_lock: 1,
  twin_link: 1,
  neon_flash: 1,
  glitch_spy: 1,
  color_trap: 1,
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
