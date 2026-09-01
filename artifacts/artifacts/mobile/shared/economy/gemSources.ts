/**
 * Weekly leaderboard Gem lookup. Table amounts are LOCKED — do not change them.
 *
 * Rank 1 = 50, 2 = 20, 3 = 10, 4–7 = 3, 8–10 = 1, else 0.
 *
 * This is NOT a payout and must not be treated as one:
 * - Gameplay settlement never grants Gems (GEM_GAMEPLAY_AMOUNT = 0).
 * - calculateReward does not emit gems.
 * - The leaderboard screen does not call addGems with these values.
 * - No client or API path currently credits this table to a player wallet.
 *
 * TODO: Product must decide if/when weekly rank Gems are actually granted.
 * Do not invent a payout here.
 */
export function weeklyLeaderboardGems(rank: number): number {
  if (rank === 1) return 50;
  if (rank === 2) return 20;
  if (rank === 3) return 10;
  if (rank >= 4 && rank <= 7) return 3;
  if (rank >= 8 && rank <= 10) return 1;
  return 0;
}

/** Gameplay never grants gems. Other sources exist; weekly pack contents are not specified. */
export const GEM_GAMEPLAY_AMOUNT = 0;
