import { ECONOMY_RATES, eventMultiplier, getProgressionMultiplier } from './constants';
import { getGameConfig } from './gameConfigs';
import type { CalculateRewardInput, GameEvent, RewardResult } from './types';

function eventAllowed(event: GameEvent, enabled: ReturnType<typeof getGameConfig>['enabledRewards']): boolean {
  if (event === 'COMBO') return enabled.combo;
  if (event === 'SUPER_COMBO') return enabled.superCombo;
  if (event === 'FINISH') return enabled.finish;
  if (event === 'STREAK') return enabled.streak;
  if (event === 'CORRECT' || event === 'WRONG' || event === 'LEVEL_COMPLETE') return true;
  return false;
}

function sanitize(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

/**
 * Master reward formula:
 * rawReward = baseReward × rewardWeight × eventMultiplier × progressionMultiplier
 * xp    = rawReward × XP_RATE
 * coins = rawReward × COIN_RATE
 * Gems are never produced here.
 */
export function calculateReward(input: CalculateRewardInput): RewardResult {
  const { gameId, event, playerLevel } = input;
  const config = getGameConfig(gameId);

  if (!eventAllowed(event, config.enabledRewards)) {
    return { xp: 0, coins: 0, event };
  }

  const rawReward =
    config.baseReward *
    config.rewardWeight *
    eventMultiplier(event) *
    getProgressionMultiplier(playerLevel);

  const xp = config.enabledRewards.xp ? sanitize(rawReward * ECONOMY_RATES.XP_RATE) : 0;
  const coins = config.enabledRewards.coin ? sanitize(rawReward * ECONOMY_RATES.COIN_RATE) : 0;

  return { xp, coins, event };
}
