import { GAME_CONSTANTS } from '@/constants';

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

// ─── XP / Level ────────────────────────────────────────────────────────────

export const calculateLevel = (xp: number): number =>
  Math.floor(xp / GAME_CONSTANTS.XP_PER_LEVEL) + 1;

export const calculateXPProgress = (xp: number): number =>
  (xp % GAME_CONSTANTS.XP_PER_LEVEL) / GAME_CONSTANTS.XP_PER_LEVEL;

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

// ─── Math helpers ──────────────────────────────────────────────────────────

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;
