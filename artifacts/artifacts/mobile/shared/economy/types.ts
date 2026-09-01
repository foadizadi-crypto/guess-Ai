export type GameEvent =
  | 'CORRECT'
  | 'COMBO'
  | 'WRONG'
  | 'SUPER_COMBO'
  | 'FINISH'
  | 'STREAK'
  | 'LEVEL_COMPLETE';

export interface EnabledRewards {
  xp: boolean;
  coin: boolean;
  combo: boolean;
  superCombo: boolean;
  finish: boolean;
  streak: boolean;
}

export interface GameConfig {
  gameId: string;
  baseReward: number;
  rewardWeight: number;
  contentLevelCap?: number;
  enabledRewards: EnabledRewards;
}

export interface CalculateRewardInput {
  gameId: string;
  event: GameEvent;
  playerLevel: number;
}

export interface RewardResult {
  xp: number;
  coins: number;
  event: GameEvent;
}
