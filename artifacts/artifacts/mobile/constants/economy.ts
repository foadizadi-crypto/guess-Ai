// ─── Economy constants — single source of truth ─────────────────────────────
// All economy values live here. Never hardcode these in UI files.
// Change values here only; never in component files.
// Reference: BlurQuiz Game Economy & Progression Design Document v1.0

// ─── XP per answer ──────────────────────────────────────────────────────────
export const XP_CORRECT_EASY   = 10;
export const XP_CORRECT_MEDIUM = 15;
export const XP_CORRECT_HARD   = 25;
export const XP_WRONG          = 2;   // always awarded; prevents frustration

// ─── Game completion bonuses ─────────────────────────────────────────────────
export const XP_COMPLETION_BONUS = 50;  // every completed 20-question game
export const XP_PERFECT_BONUS   = 100; // 20/20 correct; stacks with all other XP

// ─── Combo thresholds ────────────────────────────────────────────────────────
// Consecutive correct answers within one session earn bonus XP per question.
// Bonuses do NOT stack — higher streak tier REPLACES the previous bonus.
// Combo resets to 0 on any wrong answer.
export const COMBO_TIERS = [
  { minStreak: 12, bonusXP: 30 }, // Ultra Combo
  { minStreak:  8, bonusXP: 20 }, // Super Combo
  { minStreak:  5, bonusXP: 10 }, // Combo
  { minStreak:  3, bonusXP:  5 }, // Mini-combo
] as const;

/** Returns the combo bonus XP for the given consecutive streak. */
export function getComboBonus(streak: number): number {
  for (const tier of COMBO_TIERS) {
    if (streak >= tier.minStreak) return tier.bonusXP;
  }
  return 0;
}

/** Returns base XP for a correct answer based on difficulty. */
export function getDifficultyXP(difficulty: 'easy' | 'medium' | 'hard'): number {
  if (difficulty === 'hard')   return XP_CORRECT_HARD;
  if (difficulty === 'medium') return XP_CORRECT_MEDIUM;
  return XP_CORRECT_EASY;
}

// ─── Level system ────────────────────────────────────────────────────────────
// Formula: xpToAdvance(currentLevel) = 500 + currentLevel × 150
// Level 1→2: 650 XP | Level 50→51: 8,000 XP | Level 99→100: 15,350 XP
export const MAX_LEVEL = 100;

/** XP required to advance FROM currentLevel TO currentLevel+1. */
export function xpToAdvance(currentLevel: number): number {
  return 500 + currentLevel * 150;
}

// ─── Coin earning rates ──────────────────────────────────────────────────────
export const COINS_PER_CORRECT_ANSWER = 1;   // every correct answer
export const COINS_PERFECT_GAME_BONUS  = 25;  // 20/20 correct
export const COINS_REWARDED_AD         = 30;  // per rewarded ad watched
export const COINS_WEEKLY_CHALLENGE    = 500; // weekly challenge completion
export const COINS_ACHIEVEMENT_MIN     = 50;  // minimum achievement reward
export const COINS_ACHIEVEMENT_MAX     = 500; // maximum achievement reward
export const COINS_LEVEL_MILESTONE     = 200; // every 10-level milestone

// ─── Anti-farming ────────────────────────────────────────────────────────────
export const DAILY_XP_CAP            = 10_000; // max XP per UTC calendar day
export const REPLAY_COOLDOWN_MINUTES = 60;     // same category+difficulty slot

// ─── Shop prices (coin costs) ────────────────────────────────────────────────
// Update here to rebalance; shop UI reads from this map.
export const POWER_UP_PRICES = {
  'hint':        50,  // Show first letter of answer
  'reveal-blur': 80,  // Remove one blur layer instantly
  'skip-question': 40, // Skip with no XP penalty
  'double-xp':   200, // Double XP for next 30 minutes
} as const;

export type PowerUpShopId = keyof typeof POWER_UP_PRICES;

// ─── IAP coin packs ──────────────────────────────────────────────────────────
export const IAP_COIN_PACKS = [
  { id: 'coins-100',  amount:  100, price: '$0.99' },
  { id: 'coins-500',  amount:  600, price: '$4.99' },
  { id: 'coins-1200', amount: 1500, price: '$9.99' },
  { id: 'coins-2500', amount: 3500, price: '$19.99' },
] as const;

// ─── Daily reward schedule ───────────────────────────────────────────────────
// The 7-day cycle repeats. Milestone days (14, 30) fire on those exact streak days.
export const DAILY_REWARD_SCHEDULE = [
  { day: 1, coins: 15,  bonus: null,              icon: 'logo-bitcoin' as const },
  { day: 2, coins: 30,  bonus: null,              icon: 'logo-bitcoin' as const },
  { day: 3, coins: 30,  bonus: 'hint' as const,   icon: 'bulb-outline' as const },
  { day: 4, coins: 60,  bonus: null,              icon: 'logo-bitcoin' as const },
  { day: 5, coins: 80,  bonus: null,              icon: 'logo-bitcoin' as const },
  { day: 6, coins: 100, bonus: null,              icon: 'logo-bitcoin' as const },
  { day: 7, coins: 150, bonus: 'reveal' as const, icon: 'gift-outline' as const },
] as const;

export type DailyBonusType = 'hint' | 'reveal' | 'cosmetic' | 'premium_cosmetic';

// Milestone days that fire special rewards on top of the cycle
export const DAILY_MILESTONE_REWARDS = [
  { streak: 14, coins: 200, bonus: 'cosmetic' as const },
  { streak: 30, coins: 500, bonus: 'premium_cosmetic' as const },
] as const;

// ─── Premium / BlurPass ──────────────────────────────────────────────────────
export const PREMIUM_PRICE_MONTHLY      = '$3.99';
export const PREMIUM_MISSIONS_PER_DAY   = 5; // vs FREE_MISSIONS_PER_DAY for free users
export const FREE_MISSIONS_PER_DAY      = 3;
export const PREMIUM_COIN_MULTIPLIER    = 2; // applied to daily login coins
export const REWARDED_ADS_DAILY_FREE    = 5;
export const REWARDED_ADS_DAILY_PREMIUM = 10;
