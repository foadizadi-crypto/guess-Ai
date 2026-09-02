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

// XP_CORRECT_* / getDifficultyXP / XP_PER_* aliases were unused duplicates.
// Live settlement is calculateReward — do not reintroduce those constants.

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

// ─── Level system ────────────────────────────────────────────────────────────
// Formula now driven by gameConfig.ts (coefficient × level ^ exponent).
// Global Player Level has no locked product cap yet. GAME_CONFIG.max_level stays
// configurable; null means uncapped until a cap is specified.
export function getMaxLevel(): number | null {
  const max = GAME_CONFIG.max_level;
  if (max == null || !Number.isFinite(max) || max < 1) return null;
  return Math.floor(max);
}

export const MAX_LEVEL: number | null = GAME_CONFIG.max_level;

/** XP required to advance FROM currentLevel TO currentLevel+1. */
export function xpToAdvance(currentLevel: number): number {
  return xpToAdvanceLevel(currentLevel);
}

// ─── Coin earning rates ──────────────────────────────────────────────────────
// DEPRECATED / LEGACY — NOT USED BY MASTER ENGINE.
// Live coin settlement is calculateReward. Do not import these for gameplay payout.
/** @deprecated LEGACY — NOT USED BY MASTER ENGINE */
export const COINS_REWARDED_AD         = 30;  // per rewarded ad watched
/** @deprecated LEGACY — NOT USED BY MASTER ENGINE */
export const COINS_WEEKLY_CHALLENGE    = 500; // weekly challenge completion
/** @deprecated LEGACY — NOT USED BY MASTER ENGINE */
export const COINS_ACHIEVEMENT_MIN     = 50;  // minimum achievement reward
/** @deprecated LEGACY — NOT USED BY MASTER ENGINE */
export const COINS_ACHIEVEMENT_MAX     = 500; // maximum achievement reward
/** @deprecated LEGACY — NOT USED BY MASTER ENGINE */
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
  { day: 1, coins: 15,  bonus: null, icon: 'logo-bitcoin' as const },
  { day: 2, coins: 30,  bonus: null, icon: 'logo-bitcoin' as const },
  { day: 3, coins: 30,  bonus: null, icon: 'logo-bitcoin' as const },
  { day: 4, coins: 60,  bonus: null, icon: 'logo-bitcoin' as const },
  { day: 5, coins: 80,  bonus: null, icon: 'logo-bitcoin' as const },
  { day: 6, coins: 100, bonus: null, icon: 'logo-bitcoin' as const },
  { day: 7, coins: 150, bonus: null, icon: 'logo-bitcoin' as const },
] as const;

export type DailyBonusType = 'hint' | 'reveal' | 'cosmetic' | 'premium_cosmetic';
export type DailyWeekPowerUpId = 'hint' | 'reveal-blur';

/**
 * 2-week daily cycle from the existing streak counter (no new persistence).
 * Week 1 (streak 0–6): Hint every claim. Week 2 (streak 7–13): Reveal. Then repeat.
 */
export function getDailyWeekPowerUp(streak: number): DailyWeekPowerUpId {
  const n = Number.isFinite(streak) ? Math.max(0, Math.floor(streak)) : 0;
  return Math.floor(n / 7) % 2 === 0 ? 'hint' : 'reveal-blur';
}

/** Streak used for the 2-week cycle. A missed day starts week 1 again. */
export function dailyWeekStreak(
  streak: number,
  lastClaimDate: string | null | undefined,
  todayStr: string,
  yesterdayStr: string,
): number {
  const n = Number.isFinite(streak) ? Math.max(0, Math.floor(streak)) : 0;
  if (!lastClaimDate) return n;
  if (lastClaimDate === todayStr || lastClaimDate === yesterdayStr) return n;
  return 0;
}

export function getDailyWeekPowerUpLabel(streak: number): string {
  return getDailyWeekPowerUp(streak) === 'hint' ? 'Hint' : 'Reveal';
}

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
// Unused leftover from an older spec draft. Live lobby ads use STAMINA_ADS_PER_DAY (5).
/** @deprecated LEGACY — NOT USED BY MASTER ENGINE. Live cap is STAMINA_ADS_PER_DAY. */
export const REWARDED_ADS_DAILY_FREE    = 3;
/** @deprecated LEGACY — NOT USED BY MASTER ENGINE. Live cap is STAMINA_ADS_PER_DAY. */
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
// Removed from the live shop. Constants kept so persisted purchase counts still hydrate.
export const COIN_GEM_EXCHANGES = [
  { id: 'coin_gem_30k',  coins: 30_000,  gems: 5,  maxPurchases: 2, label: '5 💎 for 30,000 🪙' },
  { id: 'coin_gem_100k', coins: 100_000, gems: 25, maxPurchases: 1, label: '25 💎 for 100,000 🪙' },
] as const;
export type CoinGemExchangeId = typeof COIN_GEM_EXCHANGES[number]['id'];

// ─── Energy / Stamina ─────────────────────────────────────────────────────────
// ONE stamina source. Base cap 100, play cost 10, refill 1 / 12 min at EVERY
// level. L1/L2/L3 raise capacity only (bonus vs base: +50 / +150 / +300).
// L1 can be paid with coins OR gems; L2 and L3 are gems only.
// Ads/packs/daily rewards can OVERFLOW above the cap; timed refill pauses
// while above the cap.
export const STAMINA_PER_GAME    = 10;
export const STAMINA_AD_REWARD   = 10;
export const STAMINA_ADS_PER_DAY = 5;
/** Global per-player in-game loss/retry ads (all games share this cap). Each grants STAMINA_AD_REWARD. */
export const IN_GAME_RETRY_ADS_PER_DAY = 5;
export const ENERGY_DAILY_REWARD = 10;
export const ENERGY_REFILL_GEM_COST = 10;

export interface StaminaUpgradeLevel {
  level: number;
  /** Gem price. null = not purchasable with gems (base level). */
  gemCost: number | null;
  /** Coin alternative. null = gems only. */
  coinCost: number | null;
  cap: number;
  refillIntervalMin: number;
}

// Approved PASS 4 product lock (bonus vs base): 100 / 150 / 250 / 400.
// The older "100 → 150 → 200 → 350" line in `fix and test.md` is superseded.
export const STAMINA_UPGRADE_LEVELS: readonly StaminaUpgradeLevel[] = [
  { level: 0, gemCost: null, coinCost: null,  cap: 100, refillIntervalMin: 12 },
  { level: 1, gemCost: 50,   coinCost: 25_000, cap: 150, refillIntervalMin: 12 },
  { level: 2, gemCost: 150,  coinCost: null,  cap: 250, refillIntervalMin: 12 },
  { level: 3, gemCost: 250,  coinCost: null,  cap: 400, refillIntervalMin: 12 },
];

export const MAX_STAMINA_UPGRADE_LEVEL = STAMINA_UPGRADE_LEVELS.length - 1;

// Retired: a 25-gem L1 launch discount would conflict with the live 50-gem L1
// price. Keep the symbols so old imports compile; they must not set a live price.
export const FIRST_UPGRADE_OFFER_HOURS     = 48;
export const FIRST_UPGRADE_OFFER_GEM_COST  = 50;

/** Launch discount is retired so the UI cannot show a 25-gem L1 price. */
export function isFirstUpgradeOfferActive(
  _accountCreatedAt?: string | number | null,
  _staminaSourceLevel?: number,
  _now?: number,
): boolean {
  return false;
}

/** Gem cost to reach `targetLevel`. null for the base row. */
export function getUpgradeGemCost(
  targetLevel: number,
  _accountCreatedAt?: string | number | null,
  _currentLevel?: number,
  _now?: number,
): number | null {
  return STAMINA_UPGRADE_LEVELS[clampUpgradeLevel(targetLevel)].gemCost;
}

/** Coin cost to reach `targetLevel`. null when that level is gems-only. */
export function getUpgradeCoinCost(targetLevel: number): number | null {
  return STAMINA_UPGRADE_LEVELS[clampUpgradeLevel(targetLevel)].coinCost;
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
