import { GAME_CONFIG } from '@/constants/gameConfig';
import type { Category } from '@/types';
import { calculateReward } from './rewardEngine';
import type { GameEvent, RewardResult } from './types';

export function gameIdForCategory(category: Category): string {
  if (category === 'speed_card') return 'speed-card';
  if (category === 'count_quick') return 'count-quick';
  if (category === 'lost_item') return 'lost-item';
  if (category === 'flip_mind') return 'flip_mind';
  if (category === 'gold_rush') return 'gold_rush';
  if (category === 'tick_lock') return 'tick_lock';
  if (category === 'twin_link') return 'twin_link';
  if (category === 'neon_flash') return 'neon_flash';
  if (category === 'glitch_spy') return 'glitch_spy';
  if (category === 'color_trap') return 'color_trap';
  return 'guess-ai';
}

export function isBlurCategory(category: Category): boolean {
  return gameIdForCategory(category) === 'guess-ai';
}

export function usesSharedSessionTimer(category: Category): boolean {
  return isBlurCategory(category) || category === 'speed_card';
}

export function mapAnswerToEngineEvents(input: {
  correct: boolean;
  streakAfter: number;
  superComboJustActivated: boolean;
}): GameEvent[] {
  if (!input.correct) return ['WRONG'];
  const events: GameEvent[] = ['CORRECT'];
  if (input.streakAfter === GAME_CONFIG.combo_tier_1_min) events.push('STREAK');
  if (input.streakAfter === GAME_CONFIG.combo_tier_2_min) events.push('COMBO');
  if (input.superComboJustActivated) events.push('SUPER_COMBO');
  return events;
}

export function rewardEvents(gameId: string, events: GameEvent[], playerLevel: number): RewardResult[] {
  return events.map((event) => calculateReward({ gameId, event, playerLevel }));
}

export function totalEngineRewards(results: RewardResult[]): { xp: number; coins: number } {
  return results.reduce(
    (acc, result) => ({ xp: acc.xp + result.xp, coins: acc.coins + result.coins }),
    { xp: 0, coins: 0 },
  );
}

export function applyEngineEvents(
  gameId: string,
  events: GameEvent[],
  playerLevel: number,
): { xp: number; coins: number } {
  return totalEngineRewards(rewardEvents(gameId, events, playerLevel));
}
