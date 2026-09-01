/**
 * Leaderboard XP must match what gameplay sessions persist.
 *
 * `xp` is the live player total (also mirrored by the client).
 * `totalXpEarned` is the session aggregate written by POST /api/sessions.
 * Ranking uses the larger of the two so a missing/stale `xp` cannot hide
 * XP that already landed in `totalXpEarned`.
 */

export function finiteNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function playerLeaderboardXp(data: { xp?: unknown; totalXpEarned?: unknown }): number {
  return Math.max(finiteNumber(data.xp), finiteNumber(data.totalXpEarned));
}

/** Next totals after one session. `xp` never falls behind `totalXpEarned`. */
export function applySessionXp(
  current: { xp?: unknown; totalXpEarned?: unknown },
  sessionXp: number,
): { xp: number; totalXpEarned: number } {
  const gained = Math.max(0, Math.round(finiteNumber(sessionXp)));
  const totalXpEarned = finiteNumber(current.totalXpEarned) + gained;
  const xp = Math.max(finiteNumber(current.xp), totalXpEarned);
  return { xp, totalXpEarned };
}
