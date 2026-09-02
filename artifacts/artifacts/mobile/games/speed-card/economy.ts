import { calculateReward, SPEED_CARD_CONFIG } from '@/shared/economy';
import { mapAnswerToEngineEvents } from '@/shared/economy/playEvents';
import type { GameEvent, RewardResult } from '@/shared/economy';

export const SPEED_CARD_GAME_ID = SPEED_CARD_CONFIG.gameId;

export function speedCardContentLevelCap(): number {
  return SPEED_CARD_CONFIG.contentLevelCap ?? 20;
}

export type SpeedCardPlayEvent =
  | {
      kind: 'answer';
      correct: boolean;
      streakAfter: number;
      superComboJustActivated: boolean;
    }
  | { kind: 'finish' };

export function mapSpeedCardPlayToEngineEvents(play: SpeedCardPlayEvent): GameEvent[] {
  if (play.kind === 'finish') return ['FINISH'];
  return mapAnswerToEngineEvents(play);
}

export function rewardSpeedCardEvent(event: GameEvent, playerLevel: number): RewardResult {
  return calculateReward({
    gameId: SPEED_CARD_GAME_ID,
    event,
    playerLevel,
  });
}

export function rewardSpeedCardEvents(events: GameEvent[], playerLevel: number): RewardResult[] {
  return events.map((event) => rewardSpeedCardEvent(event, playerLevel));
}

export function totalSpeedCardRewards(results: RewardResult[]): { xp: number; coins: number } {
  return results.reduce(
    (acc, result) => ({ xp: acc.xp + result.xp, coins: acc.coins + result.coins }),
    { xp: 0, coins: 0 },
  );
}
