/**
 * Shared merge/display helpers for PASS 1–4 source safety.
 * Wallet/XP/energy must not roll back on a remote 0. Leaderboard must not
 * rank nickname-only documents that still have xp: 0.
 */

export function keepAtLeast(local: number, remote: unknown): number {
  return Math.max(local, typeof remote === 'number' && Number.isFinite(remote) ? remote : 0);
}

export function keepEnergyClock(local: unknown, remote: unknown): number | null {
  const remoteN = typeof remote === 'number' && Number.isFinite(remote) && remote > 0 ? remote : null;
  const localN = typeof local === 'number' && Number.isFinite(local) && local > 0 ? local : null;
  return remoteN ?? localN;
}

export function rankedLeaderboardEntries<T extends { xp: number; rank?: number }>(
  entries: readonly T[],
): Array<T & { rank: number }> {
  return entries
    .filter((row) => Number(row.xp) > 0)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}
