// ─── Economy constants — single source of truth ─────────────────────────────
// All economy values live here. Never hardcode these in UI files.
// Change values here only; never in component files.
// Reference: GUESSAi Game Economy & Progression Design Document v1.0
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
// Spec: max 3 rewarded ads per day for energy (applies to all players)
export const REWARDED_ADS_DAILY_FREE    = 3;
export const REWARDED_ADS_DAILY_PREMIUM = 3;

// ─── Level gem milestones — DEPRECATED ───────────────────────────────────────
// Spec v1.0.0: gems are earned through IAP only. Level rewards do not grant gems.
// This table is retained for backward-compat reference but is NOT read by any
// active code path. Do not import or act on these values.
/** @deprecated Gems via level rewards violate spec v1.0.0. Use IAP only. */
export const LEVEL_GEM_REWARDS: Readonly<Record<number, number>> = {};

// ─── IAP gem packs — spec v1.0.0 ─────────────────────────────────────────────
// 100 gems @ $1.99 | 500 gems @ $4.99 | 1 200 gems @ $9.99
export const IAP_GEM_PACKS = [
  { id: 'gems-100',  sku: 'com.aiblur.quiz.gems_100',  amount:  100, price: '$1.99' },
  { id: 'gems-500',  sku: 'com.aiblur.quiz.gems_500',  amount:  500, price: '$4.99' },
  { id: 'gems-1200', sku: 'com.aiblur.quiz.gems_1200', amount: 1200, price: '$9.99' },
] as const;

export type IAPGemPackId = typeof IAP_GEM_PACKS[number]['id'];

// ─── Coin → Gem exchange ──────────────────────────────────────────────────────
// Players can convert accumulated coins into a small gem grant.
// Each tier has a lifetime purchase cap to preserve the gem economy.
export const COIN_GEM_EXCHANGES = [
  { id: 'coin_gem_30k',  coins: 30_000,  gems: 5,  maxPurchases: 2, label: '5 💎 for 30,000 🪙' },
  { id: 'coin_gem_100k', coins: 100_000, gems: 25, maxPurchases: 1, label: '25 💎 for 100,000 🪙' },
] as const;
export type CoinGemExchangeId = typeof COIN_GEM_EXCHANGES[number]['id'];

// ─── Energy / Stamina ─────────────────────────────────────────────────────────
// Spec (v2.0 — single upgradable source):
//   ONE stamina source (the reserve pool was removed). Base cap: 50, cost per
//   game: 5, base refill: 1 energy / 20 min (72/day ≈ 14 games).
//   The source is upgradable up to 3 levels — gems only — via the Upgrade
//   panel on the Customization screen. Each level raises both the cap and the
//   refill speed. Stamina from ads/packs/daily rewards can OVERFLOW above the
//   cap (never wasted); timed refill pauses while above the cap.
export const STAMINA_PER_GAME    = 5; // cost per game round
export const STAMINA_AD_REWARD   = 5; // stamina per rewarded ad watch
export const STAMINA_ADS_PER_DAY = 3; // max rewarded ads for stamina/day
export const ENERGY_DAILY_REWARD = 10; // energy granted on daily reward claim
export const ENERGY_REFILL_GEM_COST = 10; // gems to instantly refill to cap

export interface StaminaUpgradeLevel {
  level: number;
  /** Gems required to unlock this level (0 = base, free). */
  gemCost: number;
  /** Max stamina the source holds via timed refill. */
  cap: number;
  /** Minutes per +1 stamina from the timed refill. */
  refillIntervalMin: number;
}

export const STAMINA_UPGRADE_LEVELS: readonly StaminaUpgradeLevel[] = [
  { level: 0, gemCost: 0,   cap: 50,  refillIntervalMin: 20 }, // base: 72/day
  { level: 1, gemCost: 50,  cap: 60,  refillIntervalMin: 18 }, // 80/day
  { level: 2, gemCost: 100, cap: 75,  refillIntervalMin: 15 }, // 96/day
  { level: 3, gemCost: 200, cap: 100, refillIntervalMin: 12 }, // 120/day
] as const;

export const MAX_STAMINA_UPGRADE_LEVEL = STAMINA_UPGRADE_LEVELS.length - 1;

// ─── First-upgrade launch offer ───────────────────────────────────────────────
// Level 1 is half price for the first 48 hours after the account is created —
// a cheap first taste of the gem economy converts far better than full price.
export const FIRST_UPGRADE_OFFER_HOURS     = 48;
export const FIRST_UPGRADE_OFFER_GEM_COST  = 25;

/** True while the level-1 launch discount is still valid for this account. */
export function isFirstUpgradeOfferActive(
  accountCreatedAt: string | number | null | undefined,
  staminaSourceLevel: number,
  now: number = Date.now(),
): boolean {
  if (staminaSourceLevel !== 0) return false;
  if (!accountCreatedAt) return false;
  const created = typeof accountCreatedAt === 'number'
    ? accountCreatedAt
    : Date.parse(accountCreatedAt);
  if (!Number.isFinite(created)) return false;
  return now - created < FIRST_UPGRADE_OFFER_HOURS * 60 * 60 * 1000;
}

/** Gem cost to reach `targetLevel`, accounting for the launch discount. */
export function getUpgradeGemCost(
  targetLevel: number,
  accountCreatedAt: string | number | null | undefined,
  currentLevel: number,
  now: number = Date.now(),
): number {
  const level = clampUpgradeLevel(targetLevel);
  if (level === 1 && isFirstUpgradeOfferActive(accountCreatedAt, currentLevel, now)) {
    return FIRST_UPGRADE_OFFER_GEM_COST;
  }
  return STAMINA_UPGRADE_LEVELS[level].gemCost;
}

function clampUpgradeLevel(level: number): number {
  if (!Number.isFinite(level)) return 0;
  return Math.min(MAX_STAMINA_UPGRADE_LEVEL, Math.max(0, Math.floor(level)));
}

/** Stamina cap for the given upgrade level (0–3). */
export function getEnergyCap(level: number): number {
  return STAMINA_UPGRADE_LEVELS[clampUpgradeLevel(level)].cap;
}

/** Minutes per +1 stamina for the given upgrade level (0–3). */
export function getRefillIntervalMin(level: number): number {
  return STAMINA_UPGRADE_LEVELS[clampUpgradeLevel(level)].refillIntervalMin;
}

/** Base stamina cap (upgrade level 0). Kept for existing imports. */
export const MAX_ENERGY = STAMINA_UPGRADE_LEVELS[0].cap;
/** Base refill interval (upgrade level 0). Kept for existing imports. */
export const ENERGY_REFILL_INTERVAL_MIN = STAMINA_UPGRADE_LEVELS[0].refillIntervalMin;
