// ─── Daily mission system — data-driven ──────────────────────────────────────
// Missions are drawn from this pool each day.
// Free players get 3 missions/day; Premium players get 5.
// At least 2 of the 3 free missions are always 'easy' difficulty.
// Missions reset at 00:00 UTC.

export type MissionType =
  | 'play_games'
  | 'correct_answers'
  | 'complete_hard'
  | 'get_combo'
  | 'perfect_game'
  | 'use_powerup'
  | 'play_category';

export interface MissionDefinition {
  id: string;
  type: MissionType;
  label: string;
  description: string;
  target: number;
  reward: number;        // coins awarded on completion
  difficulty: 'easy' | 'medium' | 'hard';
  param?: string;        // optional: category name for play_category missions
}

export const MISSION_POOL: MissionDefinition[] = [
  // ── Easy — achievable in a 3-5 game casual session ──────────────────────
  {
    id: 'm_play3',
    type: 'play_games',
    label: 'Play 3 Games',
    description: 'Complete 3 games of any difficulty.',
    target: 3, reward: 30, difficulty: 'easy',
  },
  {
    id: 'm_correct20',
    type: 'correct_answers',
    label: 'Sharp Shooter',
    description: 'Answer 20 questions correctly across any games.',
    target: 20, reward: 40, difficulty: 'easy',
  },
  {
    id: 'm_use_pu',
    type: 'use_powerup',
    label: 'Power Player',
    description: 'Use any power-up in a game.',
    target: 1, reward: 25, difficulty: 'easy',
  },
  {
    id: 'm_cat_animals',
    type: 'play_category',
    label: 'Animal Kingdom',
    description: 'Complete an Animals game.',
    target: 1, reward: 40, difficulty: 'easy', param: 'animals',
  },
  {
    id: 'm_cat_food',
    type: 'play_category',
    label: 'Foodie',
    description: 'Complete a Food game.',
    target: 1, reward: 40, difficulty: 'easy', param: 'food',
  },
  {
    id: 'm_cat_nature',
    type: 'play_category',
    label: 'Nature Lover',
    description: 'Complete a Nature game.',
    target: 1, reward: 40, difficulty: 'easy', param: 'nature',
  },
  {
    id: 'm_cat_space',
    type: 'play_category',
    label: 'Space Explorer',
    description: 'Complete a Space game.',
    target: 1, reward: 40, difficulty: 'easy', param: 'space',
  },

  // ── Medium — require some focus ─────────────────────────────────────────
  {
    id: 'm_combo5',
    type: 'get_combo',
    label: 'Combo Starter',
    description: 'Get a 5-answer combo in a single game.',
    target: 5, reward: 50, difficulty: 'medium',
  },
  {
    id: 'm_hard1',
    type: 'complete_hard',
    label: 'Hard Challenger',
    description: 'Complete a Hard difficulty game.',
    target: 1, reward: 60, difficulty: 'medium',
  },
  {
    id: 'm_play5',
    type: 'play_games',
    label: 'Dedicated Player',
    description: 'Complete 5 games today.',
    target: 5, reward: 50, difficulty: 'medium',
  },
  {
    id: 'm_correct40',
    type: 'correct_answers',
    label: 'Knowledge Base',
    description: 'Answer 40 questions correctly across any games.',
    target: 40, reward: 55, difficulty: 'medium',
  },

  // ── Hard — challenge missions ────────────────────────────────────────────
  {
    id: 'm_perfect',
    type: 'perfect_game',
    label: 'Flawless Victory',
    description: 'Get a perfect score in a single game.',
    target: 1, reward: 80, difficulty: 'hard',
  },
  {
    id: 'm_combo8',
    type: 'get_combo',
    label: 'Combo King',
    description: 'Reach an 8-answer combo in a single game.',
    target: 8, reward: 70, difficulty: 'hard',
  },
  {
    id: 'm_hard3',
    type: 'complete_hard',
    label: 'Hard Core',
    description: 'Complete 3 Hard difficulty games today.',
    target: 3, reward: 80, difficulty: 'hard',
  },
];

// ─── Mission selection ───────────────────────────────────────────────────────

/**
 * Pick `count` missions from the pool for a given UTC date string (YYYY-MM-DD).
 * The selection is deterministic per date so all players see the same missions.
 * Always guarantees at least 2 easy missions in the first 3 slots.
 */
export function getDailyMissions(count: number, dateStr: string): MissionDefinition[] {
  // Simple numeric seed from date string
  const seed = dateStr.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);

  const byDifficulty = {
    easy:   MISSION_POOL.filter(m => m.difficulty === 'easy'),
    medium: MISSION_POOL.filter(m => m.difficulty === 'medium'),
    hard:   MISSION_POOL.filter(m => m.difficulty === 'hard'),
  };

  const pick = (arr: MissionDefinition[], n: number, seedOffset: number): MissionDefinition[] => {
    const result: MissionDefinition[] = [];
    const used = new Set<number>();
    for (let i = 0; i < n && result.length < arr.length; i++) {
      let idx = (seed + seedOffset + i * 31) % arr.length;
      while (used.has(idx)) idx = (idx + 1) % arr.length;
      used.add(idx);
      result.push(arr[idx]!);
    }
    return result;
  };

  const selected: MissionDefinition[] = [];

  // Always start with 2 easy missions
  selected.push(...pick(byDifficulty.easy, 2, 0));

  if (count === 3) {
    selected.push(...pick(byDifficulty.medium, 1, 50));
  } else if (count > 3) {
    selected.push(...pick(byDifficulty.medium, 2, 50));
    if (count > 4) {
      selected.push(...pick(byDifficulty.hard, count - 4, 100));
    }
  }

  // Deduplicate by id and trim to count
  const seen = new Set<string>();
  return selected
    .filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; })
    .slice(0, count);
}

/** Returns YYYY-MM-DD for the current UTC date. */
export function getTodayUTC(): string {
  return new Date().toISOString().split('T')[0]!;
}
