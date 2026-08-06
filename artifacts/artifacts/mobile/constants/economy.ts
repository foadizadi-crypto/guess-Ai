// ─── Economy constants — single source of truth ─────────────────────────────
// All economy values live here. Never hardcode these in UI files.
// Change values here only; never in component files.
// Reference: BlurQuiz Game Economy & Progression Design Document v1.0
//
// ⚠️  Core tunables now live in gameConfig.ts (GAME_CONFIG).
//     This file re-exports them as named constants so existing imports keep working.
// ─────────────────────────────────────────────────────────────────────────────
import {
  GAME_CONFIG,
  getComboBonus as _getComboBonus,
  xpToAdvanceLevel,
} from './gameConfig';

// ─── XP per answer ──────────────────────────────────────────────────────────
export const XP_CORRECT_EASY   = GAME_CONFIG.xp_correct_easy;
export const XP_CORRECT_MEDIUM = GAME_CONFIG.xp_correct_medium;
export const XP_CORRECT_HARD   = GAME_CONFIG.xp_correct_hard;
export const XP_WRONG          = GAME_CONFIG.xp_wrong;

// ─── Game completion bonuses ─────────────────────────────────────────────────
export const XP_COMPLETION_BONUS = GAME_CONFIG.xp_session_complete_bonus;
export const XP_PERFECT_BONUS   = GAME_CONFIG.xp_perfect_game_bonus;

// ─── Combo thresholds ────────────────────────────────────────────────────────
// Consecutive correct answers within one session earn bonus XP per question.
// Bonuses do NOT stack — higher streak tier REPLACES the previous bonus.
// Combo resets to 0 on any wrong answer.
export const COMBO_TIERS = [
  { minStreak: GAME_CONFIG.combo_tier_4_min, bonusXP: GAME_CONFIG.combo_tier_4_bonus }, // Ultra Combo
  { minStreak: GAME_CONFIG.combo_tier_3_min, bonusXP: GAME_CONFIG.combo_tier_3_bonus }, // Super Combo
  { minStreak: GAME_CONFIG.combo_tier_2_min, bonusXP: GAME_CONFIG.combo_tier_2_bonus }, // Combo
  { minStreak: GAME_CONFIG.combo_tier_1_min, bonusXP: GAME_CONFIG.combo_tier_1_bonus }, // Mini-combo
] as const;

/** Returns the combo bonus XP for the given consecutive streak. */
export function getComboBonus(streak: number): number {
  return _getComboBonus(streak);
}

/** Returns base XP for a correct answer based on difficulty. */
export function getDifficultyXP(difficulty: 'easy' | 'medium' | 'hard'): number {
  if (difficulty === 'hard')   return XP_CORRECT_HARD;
  if (difficulty === 'medium') return XP_CORRECT_MEDIUM;
  return XP_CORRECT_EASY;
}

// ─── Level system ────────────────────────────────────────────────────────────
// Formula now driven by gameConfig.ts (coefficient × level ^ exponent × 100).
// max_level: 500 per Final Implementation Prompt (change GAME_CONFIG.max_level to 100
// if capping at 100 per Economy Patch 1.1.1).
export const MAX_LEVEL = GAME_CONFIG.max_level;

/** XP required to advance FROM currentLevel TO currentLevel+1. */
export function xpToAdvance(currentLevel: number): number {
  return xpToAdvanceLevel(currentLevel);
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

// ─── Energy / Stamina ─────────────────────────────────────────────────────────
// Players start at MAX_ENERGY. Each game costs STAMINA_PER_GAME. Refills passively.
// Active players can play ~12-15 rounds per day (50 base ÷ 10 cost = 5 rounds,
// plus up to 2 more from rewarded ads (25 stamina / 10 per round)).
export const MAX_ENERGY                 = 50;  // full stamina bar
export const STAMINA_PER_GAME          = 10;  // cost per game round
export const ENERGY_REFILL_INTERVAL_MIN = 10;  // 1 stamina every 10 minutes
export const STAMINA_AD_REWARD         = 5;   // stamina per rewarded ad watch
export const STAMINA_ADS_PER_DAY       = 5;   // max rewarded ads for stamina/day
export const ENERGY_REFILL_GEM_COST    = 30;  // gems to instantly refill to max
