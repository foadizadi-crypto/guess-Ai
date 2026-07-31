// ─── BlurQuiz — Central Game Configuration ───────────────────────────────────
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
  xp_correct_easy:           10,
  xp_correct_medium:         15,
  xp_correct_hard:           25,
  xp_wrong:                   2,  // always awarded — prevents frustration on fails

  // ── Game Completion Bonuses ─────────────────────────────────────────────────
  xp_session_complete_bonus:  50,  // awarded for finishing any 20-question session
  xp_perfect_game_bonus:     100,  // awarded for 20/20 correct — stacks with all XP

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

} as const;

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
