import { GAME_CONSTANTS } from '@/constants';
import { MAX_LEVEL, xpToAdvance } from '@/constants/economy';

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

// ─── XP / Level — formula: xpToAdvance(L) = 500 + L×150 ───────────────────
//
// Cumulative XP to reach level L from level 1:
//   cumXP(L) = Σ(l=1 to L-1) xpToAdvance(l) = (L-1)×500 + 75×(L-1)×L
//
// Closed-form level from total XP (via quadratic formula):
//   75m² + 575m - totalXP = 0, where m = level - 1
//   m = (-575 + sqrt(575² + 4×75×totalXP)) / (2×75)
//   level = floor(m) + 1, clamped to [1, MAX_LEVEL]

/** Total XP accumulated when a player first reaches `level`. */
export const xpAtStartOfLevel = (level: number): number => {
  if (level <= 1) return 0;
  return (level - 1) * 500 + 75 * (level - 1) * level;
};

/** Derive the current level from total accumulated XP. */
export const calculateLevel = (totalXP: number): number => {
  if (totalXP <= 0) return 1;
  const discriminant = 575 * 575 + 4 * 75 * totalXP; // = 330625 + 300×XP
  const m = (-575 + Math.sqrt(discriminant)) / 150;
  return Math.min(Math.max(1, Math.floor(m) + 1), MAX_LEVEL);
};

/** XP earned within the current level (resets each time you level up). */
export const xpInCurrentLevel = (totalXP: number): number => {
  const level = calculateLevel(totalXP);
  return totalXP - xpAtStartOfLevel(level);
};

/** XP required to advance from `level` to `level + 1`. Returns Infinity at MAX_LEVEL. */
export const xpForCurrentLevel = (level: number): number => {
  if (level >= MAX_LEVEL) return Infinity;
  return xpToAdvance(level);
};

/**
 * Progress within the current level as a value in [0, 1].
 * Used by the XP progress bar.
 */
export const calculateXPProgress = (totalXP: number): number => {
  const level = calculateLevel(totalXP);
  if (level >= MAX_LEVEL) return 1;
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

// ─── Math helpers ──────────────────────────────────────────────────────────

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;
