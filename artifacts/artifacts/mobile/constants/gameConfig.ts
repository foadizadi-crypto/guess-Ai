// ─── GUESSAi — Central Game Configuration ────────────────────────────────────
// SINGLE SOURCE OF TRUTH for every tunable number in the game.
// To rebalance the economy, difficulty, or progression change values HERE ONLY.
// Core logic files must import from this file; never hardcode these numbers.
//
// Patch version: 1.1.1-missions
// Note: max_level is set to 500 per the Final Implementation Prompt.
//       (Economy Patch 1.1.1 specified 100; override this value to 100 if needed.)
// ─────────────────────────────────────────────────────────────────────────────

export const GAME_CONFIG = {

  // ── XP Formula ──────────────────────────────────────────────────────────────
  // Level threshold formula: xpForLevel(L) = coefficient × L ^ exponent
  // Used to compute total XP needed to reach a given level from level 1.
  xp_base_formula_coefficient: 1.2,
  xp_base_formula_exponent:    1.4,

  // ── XP Per Answer ───────────────────────────────────────────────────────────
  // Spec (v1.0.0): Easy×1.0 = 10 | Medium×1.25 = 13 | Hard×1.5 = 15
  xp_correct_easy:           10,
  xp_correct_medium:         13,
  xp_correct_hard:           15,
  xp_wrong:                   2,  // always awarded — prevents frustration on fails

  // ── Session Completion Rewards (per difficulty) ─────────────────────────────
  // Spec: Easy 50c+30XP | Medium 63c+38XP | Hard 75c+45XP
  session_complete_coins_easy:    50,
  session_complete_coins_medium:  63,
  session_complete_coins_hard:    75,
  session_complete_xp_easy:       30,
  session_complete_xp_medium:     38,
  session_complete_xp_hard:       45,

  // ── Perfect Game Rewards (per difficulty, stacks with session completion) ──
  // Spec: Easy 100c+50XP | Medium 125c+63XP | Hard 150c+75XP
  perfect_coins_easy:    100,
  perfect_coins_medium:  125,
  perfect_coins_hard:    150,
  perfect_xp_easy:        50,
  perfect_xp_medium:      63,
  perfect_xp_hard:        75,

  // Legacy flat aliases kept for any existing import; use the per-difficulty
  // values above in all new/updated code.
  xp_session_complete_bonus:  30,  // Easy base — kept for backward compat
  xp_perfect_game_bonus:      50,  // Easy base — kept for backward compat

  // ── Clarity / Blur Mechanics ────────────────────────────────────────────────
  // clarity_correct_increment: how much blur is removed on a correct answer
  // clarity_wrong_penalty_*  : how much extra blur is added on a wrong answer
  clarity_correct_increment:      5,
  clarity_wrong_penalty_easy:     3,
  clarity_wrong_penalty_medium:   5,
  clarity_wrong_penalty_hard:     7,

  // Initial blur amount per difficulty (0 = clear, 100 = fully blurred)
  initial_blur_easy:   50,
  initial_blur_medium: 80,
  initial_blur_hard:  100,

  // ── Combo Tiers ─────────────────────────────────────────────────────────────
  // Consecutive correct answers award a flat bonus XP per question.
  // Higher tier REPLACES lower — they do NOT stack.
  // Combo resets to 0 on any wrong answer.
  combo_tier_1_min:   3,   // Mini-Combo: 3–4 streak
  combo_tier_1_max:   4,
  combo_tier_1_bonus: 5,

  combo_tier_2_min:   5,   // Combo: 5–7 streak
  combo_tier_2_max:   7,
  combo_tier_2_bonus: 10,

  combo_tier_3_min:   8,   // Super Combo: 8–11 streak
  combo_tier_3_max:   11,
  combo_tier_3_bonus: 20,

  combo_tier_4_min:   12,  // Ultra Combo: 12–14 streak
  combo_tier_4_bonus: 30,

  // Super Combo activates at streak ≥ super_combo_threshold:
  // total XP for that answer = (base + tier_4_bonus) × super_combo_multiplier
  super_combo_threshold:   15,
  super_combo_multiplier:  2.5,

  // ── Progression ─────────────────────────────────────────────────────────────
  // max_level: 500 (per Final Implementation Prompt).
  // To cap at 100 as per Economy Patch 1.1.1, change this single value.
  max_level: 500,

  // ── Session Settings ────────────────────────────────────────────────────────
  session_timer_seconds:  120,  // countdown timer per question
  questions_per_session:   20,  // questions in a single game session

};

// ─── Remote config overlay ────────────────────────────────────────────────────
// Call applyRemoteConfig() on startup to merge live API values over the defaults
// above.  All helper functions below automatically pick up the updated values
// because they reference GAME_CONFIG by variable, not by snapshot copy.
//
// Key mapping: the API uses short snake_case keys; a few differ from the names
// above — the mapping lives in services/remoteConfigService.ts.

export function applyRemoteConfig(remote: Record<string, unknown>): void {
  const n = (key: string): number | undefined => {
    const v = remote[key];
    if (v === undefined) return undefined;
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  // XP formula (API keys differ slightly)
  const coeff = n('xp_formula_coefficient');
  const exp   = n('xp_formula_exponent');
  if (coeff !== undefined) GAME_CONFIG.xp_base_formula_coefficient = coeff;
  if (exp   !== undefined) GAME_CONFIG.xp_base_formula_exponent    = exp;

  // XP per answer
  const fields: Array<keyof typeof GAME_CONFIG> = [
    'xp_correct_easy', 'xp_correct_medium', 'xp_correct_hard', 'xp_wrong',
    'xp_session_complete_bonus', 'xp_perfect_game_bonus',
    'clarity_correct_increment',
    'clarity_wrong_penalty_easy', 'clarity_wrong_penalty_medium', 'clarity_wrong_penalty_hard',
    'initial_blur_easy', 'initial_blur_medium', 'initial_blur_hard',
    'combo_tier_1_min', 'combo_tier_1_bonus',
    'combo_tier_2_min', 'combo_tier_2_bonus',
    'combo_tier_3_min', 'combo_tier_3_bonus',
    'combo_tier_4_min', 'combo_tier_4_bonus',
    'super_combo_threshold', 'super_combo_multiplier',
    'max_level',
  ];

  for (const key of fields) {
    const val = n(key);
    if (val !== undefined) (GAME_CONFIG as Record<string, number>)[key] = val;
  }
}

// ─── Derived helpers (computed from config, not raw tunables) ─────────────────

/**
 * XP required to advance FROM level N TO level N+1.
 * Formula (per spec): Round( coefficient × N ^ exponent )
 * Examples: N=1 → 1 XP | N=50 → 287 XP | N=500 → 7,200 XP
 * Total L1→L500 ≈ 1,510,000 XP
 */
export function xpToAdvanceLevel(level: number): number {
  const { xp_base_formula_coefficient: c, xp_base_formula_exponent: e } = GAME_CONFIG;
  return Math.round(c * Math.pow(level, e));
}

/**
 * Total XP accumulated when a player first reaches `level`.
 * Level 1 = 0 XP (players start at level 1 with no prior XP).
 * = sum of xpToAdvanceLevel(n) for n = 1 to level-1
 */
export function xpThresholdForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let n = 1; n < level; n++) {
    total += xpToAdvanceLevel(n);
  }
  return total;
}

/**
 * Level a player is at given their total accumulated XP.
 * Uses an incremental walk (O(level)) — fast enough for max_level 500.
 * Clamped to max_level.
 */
export function levelFromXP(totalXP: number): number {
  const max = GAME_CONFIG.max_level;
  let level = 1;
  let accumulated = 0;
  while (level < max) {
    const needed = xpToAdvanceLevel(level);
    if (accumulated + needed > totalXP) break;
    accumulated += needed;
    level++;
  }
  return level;
}

/** Combo bonus XP for a given consecutive streak. */
export function getComboBonus(streak: number): number {
  const c = GAME_CONFIG;
  if (streak >= c.combo_tier_4_min) return c.combo_tier_4_bonus;
  if (streak >= c.combo_tier_3_min) return c.combo_tier_3_bonus;
  if (streak >= c.combo_tier_2_min) return c.combo_tier_2_bonus;
  if (streak >= c.combo_tier_1_min) return c.combo_tier_1_bonus;
  return 0;
}

/**
 * Total XP to award for a correct answer, applying combo and super-combo.
 * difficulty: 'easy' | 'medium' | 'hard'
 * streak: current consecutive correct answer count (including this answer)
 */
export function computeAnswerXP(
  difficulty: 'easy' | 'medium' | 'hard',
  streak: number,
): number {
  const c = GAME_CONFIG;
  const base =
    difficulty === 'hard'   ? c.xp_correct_hard   :
    difficulty === 'medium' ? c.xp_correct_medium  :
                              c.xp_correct_easy;
  const combo = getComboBonus(streak);
  const raw   = base + combo;
  if (streak >= c.super_combo_threshold) {
    return Math.floor(raw * c.super_combo_multiplier);
  }
  return raw;
}

/** Coins awarded for completing a session (20 questions), by difficulty. */
export function sessionCompleteCoins(difficulty: 'easy' | 'medium' | 'hard'): number {
  const c = GAME_CONFIG;
  if (difficulty === 'hard')   return c.session_complete_coins_hard;
  if (difficulty === 'medium') return c.session_complete_coins_medium;
  return c.session_complete_coins_easy;
}

/** XP awarded for completing a session, by difficulty. */
export function sessionCompleteXP(difficulty: 'easy' | 'medium' | 'hard'): number {
  const c = GAME_CONFIG;
  if (difficulty === 'hard')   return c.session_complete_xp_hard;
  if (difficulty === 'medium') return c.session_complete_xp_medium;
  return c.session_complete_xp_easy;
}

/** Coins awarded for a perfect game (20/20 correct), by difficulty. Stacks with session completion. */
export function perfectGameCoins(difficulty: 'easy' | 'medium' | 'hard'): number {
  const c = GAME_CONFIG;
  if (difficulty === 'hard')   return c.perfect_coins_hard;
  if (difficulty === 'medium') return c.perfect_coins_medium;
  return c.perfect_coins_easy;
}

/** XP awarded for a perfect game, by difficulty. Stacks with session completion. */
export function perfectGameXP(difficulty: 'easy' | 'medium' | 'hard'): number {
  const c = GAME_CONFIG;
  if (difficulty === 'hard')   return c.perfect_xp_hard;
  if (difficulty === 'medium') return c.perfect_xp_medium;
  return c.perfect_xp_easy;
}

/** Blur amount to show at the start of a question given difficulty. */
export function initialBlur(difficulty: 'easy' | 'medium' | 'hard'): number {
  const c = GAME_CONFIG;
  if (difficulty === 'hard')   return c.initial_blur_hard;
  if (difficulty === 'medium') return c.initial_blur_medium;
  return c.initial_blur_easy;
}

/** New blur amount after a correct answer (blur decreases = image clears). */
export function blurAfterCorrect(currentBlur: number): number {
  return Math.max(0, currentBlur - GAME_CONFIG.clarity_correct_increment);
}

/** New blur amount after a wrong answer (blur increases = image obscures more). */
export function blurAfterWrong(
  currentBlur: number,
  difficulty: 'easy' | 'medium' | 'hard',
): number {
  const c = GAME_CONFIG;
  const penalty =
    difficulty === 'hard'   ? c.clarity_wrong_penalty_hard   :
    difficulty === 'medium' ? c.clarity_wrong_penalty_medium  :
                              c.clarity_wrong_penalty_easy;
  return Math.min(100, currentBlur + penalty);
}
