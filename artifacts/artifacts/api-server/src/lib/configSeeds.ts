/**
 * Economy config seeds — mirrors mobile constants/gameConfig.ts.
 * Upserted into Firestore `config` collection on first GET /api/config
 * and via POST /api/config/seed.  Change values here to rebalance without
 * a mobile release.
 */

export interface ConfigSeed {
  key: string;
  value: string;
  description: string;
}

export const CONFIG_SEEDS: ConfigSeed[] = [
  // XP Formula
  { key: "xp_formula_coefficient",        value: "1.2",  description: "Coefficient: coefficient × level ^ exponent" },
  { key: "xp_formula_exponent",           value: "1.4",  description: "Exponent in level XP formula" },

  // XP per answer
  { key: "xp_correct_easy",               value: "10",   description: "XP for a correct answer on Easy" },
  { key: "xp_correct_medium",             value: "15",   description: "XP for a correct answer on Medium" },
  { key: "xp_correct_hard",               value: "25",   description: "XP for a correct answer on Hard" },
  { key: "xp_wrong",                      value: "2",    description: "XP for a wrong answer" },

  // Session bonuses
  { key: "xp_session_complete_bonus",     value: "50",   description: "XP bonus for finishing any session" },
  { key: "xp_perfect_game_bonus",         value: "100",  description: "XP bonus for a perfect game (20/20)" },

  // Combo tiers (streak thresholds)
  { key: "combo_tier_1_min",              value: "3",    description: "Streak for Mini-combo" },
  { key: "combo_tier_1_bonus",            value: "3",    description: "Bonus XP/answer at Mini-combo" },
  { key: "combo_tier_2_min",              value: "5",    description: "Streak for Combo" },
  { key: "combo_tier_2_bonus",            value: "5",    description: "Bonus XP/answer at Combo" },
  { key: "combo_tier_3_min",              value: "8",    description: "Streak for Super Combo" },
  { key: "combo_tier_3_bonus",            value: "8",    description: "Bonus XP/answer at Super Combo" },
  { key: "combo_tier_4_min",              value: "12",   description: "Streak for Ultra Combo" },
  { key: "combo_tier_4_bonus",            value: "12",   description: "Bonus XP/answer at Ultra Combo" },

  // Blur / clarity mechanics
  { key: "clarity_correct_increment",     value: "5",    description: "Blur removed on correct answer" },
  { key: "clarity_wrong_penalty_easy",    value: "3",    description: "Blur added on wrong answer (Easy)" },
  { key: "clarity_wrong_penalty_medium",  value: "5",    description: "Blur added on wrong answer (Medium)" },
  { key: "clarity_wrong_penalty_hard",    value: "7",    description: "Blur added on wrong answer (Hard)" },
  { key: "initial_blur_easy",             value: "50",   description: "Starting blur on Easy (0=clear, 100=fully blurred)" },
  { key: "initial_blur_medium",           value: "80",   description: "Starting blur on Medium" },
  { key: "initial_blur_hard",             value: "100",  description: "Starting blur on Hard" },

  // Ad system
  { key: "daily_ad_cooldown_hours",       value: "4",    description: "Hours between Daily Gift lobby ad claims" },
  { key: "double_reward_session_threshold", value: "3",  description: "Sessions before Double Rewards button appears" },

  // Coin rates
  { key: "coins_per_correct_answer",      value: "1",    description: "Coins per correct answer" },
  { key: "coins_perfect_game_bonus",      value: "25",   description: "Bonus coins for a perfect game" },
  { key: "daily_gift_coins_min",          value: "50",   description: "Min coins from Daily Gift" },
  { key: "daily_gift_coins_max",          value: "150",  description: "Max coins from Daily Gift" },
  { key: "daily_gift_consumable_chance",  value: "0.1",  description: "Probability of bonus consumable from Daily Gift" },

  // Level system
  { key: "max_level",                     value: "500",  description: "Highest achievable player level" },
  { key: "daily_xp_cap",                  value: "500",  description: "Max XP earnable per day (anti-farming)" },
];
