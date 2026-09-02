import { GAME_CONSTANTS } from '@/constants';
import { getMaxLevel } from '@/constants/economy';
import { xpToAdvanceLevel, xpThresholdForLevel, levelFromXP as _levelFromXP } from '@/constants/gameConfig';

// ─── ID generation (no uuid package — crashes on iOS/Android) ──────────────

export const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

// ─── Number formatting ─────────────────────────────────────────────────────

export const formatScore = (score: number): string => score.toLocaleString();

export const formatCoins = (coins: number): string => {
  if (coins >= 1_000_000) return `${(coins / 1_000_000).toFixed(1)}M`;
  if (coins >= 1000) return `${(coins / 1000).toFixed(1)}K`;
  return coins.toString();
};

export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}:${s.toString().padStart(2, '0')}`;
  return `${s}s`;
};

// ─── XP / Level — formula: Round( coefficient × N ^ exponent ) per level N ──
// All tunables live in gameConfig.ts (GAME_CONFIG).
// These helpers are thin wrappers so the rest of the codebase doesn't need to
// import from gameConfig directly.

/** Total XP accumulated when a player first reaches `level` (level 1 = 0 XP). */
export const xpAtStartOfLevel = (level: number): number => xpThresholdForLevel(level);

/** Derive the current level from total accumulated XP. Optional cap via GAME_CONFIG.max_level. */
export const calculateLevel = (totalXP: number): number => {
  const level = _levelFromXP(totalXP);
  const cap = getMaxLevel();
  if (cap == null) return Math.max(1, level);
  return Math.min(Math.max(1, level), cap);
};

/** XP earned within the current level (resets to 0 each time you level up). */
export const xpInCurrentLevel = (totalXP: number): number => {
  const level = calculateLevel(totalXP);
  return totalXP - xpAtStartOfLevel(level);
};

/** XP required to advance from `level` to `level + 1`. Infinity only when a cap is set and reached. */
export const xpForCurrentLevel = (level: number): number => {
  const cap = getMaxLevel();
  if (cap != null && level >= cap) return Infinity;
  return xpToAdvanceLevel(level);
};

/**
 * Progress within the current level as a value in [0, 1].
 * Used by the XP progress bar.
 */
export const calculateXPProgress = (totalXP: number): number => {
  const level = calculateLevel(totalXP);
  const cap = getMaxLevel();
  if (cap != null && level >= cap) return 1;
  const xpInLevel = xpInCurrentLevel(totalXP);
  const xpNeeded  = xpForCurrentLevel(level);
  return Math.min(1, xpInLevel / xpNeeded);
};

// ─── Score ─────────────────────────────────────────────────────────────────

export const calculateScore = (
  hintsUsed: number,
  timeLeft: number,
  timeTotal: number,
): number => {
  const hintPenalty = hintsUsed * GAME_CONSTANTS.SCORE_HINT_PENALTY;
  const timeBonus = Math.floor((timeLeft / timeTotal) * GAME_CONSTANTS.SCORE_TIME_BONUS_MAX);
  return Math.max(0, GAME_CONSTANTS.SCORE_BASE - hintPenalty + timeBonus);
};

// ─── Date helpers ──────────────────────────────────────────────────────────

export const isToday = (dateStr: string | null): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/** Returns the current UTC date as YYYY-MM-DD. */
export const getTodayUTCString = (): string =>
  new Date().toISOString().split('T')[0]!;

/** True when a stored YYYY-MM-DD UTC claim/spin date is today (UTC). */
export const isUtcDayToday = (yyyyMmDd: string | null | undefined): boolean =>
  !!yyyyMmDd && yyyyMmDd === getTodayUTCString();

/** Yesterday as YYYY-MM-DD UTC — used to detect a broken daily streak. */
export const getYesterdayUTCString = (): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0]!;
};

// ─── Math helpers ──────────────────────────────────────────────────────────

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;
