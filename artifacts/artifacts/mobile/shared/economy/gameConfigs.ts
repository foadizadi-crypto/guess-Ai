import type { EnabledRewards, GameConfig } from './types';

const ALL_REWARDS: EnabledRewards = {
  xp: true,
  coin: true,
  combo: true,
  superCombo: true,
  finish: true,
  streak: true,
};

function freezeConfig(config: GameConfig): GameConfig {
  return Object.freeze({
    ...config,
    enabledRewards: Object.freeze({ ...config.enabledRewards }),
  });
}

export const GUESS_AI_CONFIG: GameConfig = freezeConfig({
  gameId: 'guess-ai',
  baseReward: 30,
  rewardWeight: 1,
  enabledRewards: ALL_REWARDS,
});

export const SPEED_CARD_CONFIG: GameConfig = freezeConfig({
  gameId: 'speed-card',
  baseReward: 35,
  rewardWeight: 1,
  contentLevelCap: 20,
  enabledRewards: ALL_REWARDS,
});

export const SIZE_COMPARE_CONFIG: GameConfig = freezeConfig({
  gameId: 'size-compare',
  baseReward: 25,
  rewardWeight: 1,
  enabledRewards: {
    xp: true,
    coin: true,
    combo: true,
    superCombo: false,
    finish: true,
    streak: false,
  },
});

export const SHADOW_MATCH_CONFIG: GameConfig = freezeConfig({
  gameId: 'shadow-match',
  baseReward: 30,
  rewardWeight: 1,
  enabledRewards: ALL_REWARDS,
});

export const ODD_ONE_OUT_CONFIG: GameConfig = freezeConfig({
  gameId: 'odd-one-out',
  baseReward: 30,
  rewardWeight: 1,
  enabledRewards: ALL_REWARDS,
});

export const COUNT_QUICK_CONFIG: GameConfig = freezeConfig({
  gameId: 'count-quick',
  baseReward: 25,
  rewardWeight: 1,
  enabledRewards: ALL_REWARDS,
});

export const LOST_ITEM_CONFIG: GameConfig = freezeConfig({
  gameId: 'lost-item',
  baseReward: 25,
  rewardWeight: 1,
  enabledRewards: ALL_REWARDS,
});

export const FRAGMENT_UNIFY_CONFIG: GameConfig = freezeConfig({
  gameId: 'fragment-unify',
  baseReward: 35,
  rewardWeight: 1,
  enabledRewards: ALL_REWARDS,
});

export const EMOTION_MATCH_CONFIG: GameConfig = freezeConfig({
  gameId: 'emotion-match',
  baseReward: 30,
  rewardWeight: 1,
  enabledRewards: ALL_REWARDS,
});

export const LOGIC_CHAIN_CONFIG: GameConfig = freezeConfig({
  gameId: 'logic-chain',
  baseReward: 35,
  rewardWeight: 1,
  enabledRewards: ALL_REWARDS,
});

export const TIMELINE_BUILDER_CONFIG: GameConfig = freezeConfig({
  gameId: 'timeline-builder',
  baseReward: 35,
  rewardWeight: 1,
  enabledRewards: ALL_REWARDS,
});

/**
 * Minigame economy config ids — NOT lobby category slots 19–25.
 *
 * Playable category order lives in constants/categories.ts:
 * 1–15 blur, 16 speed_card, 17 count_quick, 18 lost_item.
 * A GameConfig here does not make a game playable (no Category, no route).
 * Do not treat this array as games 19–25. Do not implement 19–25 from these stubs.
 */
export const NEW_GAME_IDS = [
  'shadow-match',
  'odd-one-out',
  'count-quick',
  'size-compare',
  'lost-item',
  'fragment-unify',
  'emotion-match',
  'logic-chain',
  'timeline-builder',
] as const;

export type NewGameId = (typeof NEW_GAME_IDS)[number];

const GAME_CONFIGS: Record<string, GameConfig> = {
  [GUESS_AI_CONFIG.gameId]: GUESS_AI_CONFIG,
  [SPEED_CARD_CONFIG.gameId]: SPEED_CARD_CONFIG,
  [SIZE_COMPARE_CONFIG.gameId]: SIZE_COMPARE_CONFIG,
  [SHADOW_MATCH_CONFIG.gameId]: SHADOW_MATCH_CONFIG,
  [ODD_ONE_OUT_CONFIG.gameId]: ODD_ONE_OUT_CONFIG,
  [COUNT_QUICK_CONFIG.gameId]: COUNT_QUICK_CONFIG,
  [LOST_ITEM_CONFIG.gameId]: LOST_ITEM_CONFIG,
  [FRAGMENT_UNIFY_CONFIG.gameId]: FRAGMENT_UNIFY_CONFIG,
  [EMOTION_MATCH_CONFIG.gameId]: EMOTION_MATCH_CONFIG,
  [LOGIC_CHAIN_CONFIG.gameId]: LOGIC_CHAIN_CONFIG,
  [TIMELINE_BUILDER_CONFIG.gameId]: TIMELINE_BUILDER_CONFIG,
};

export function getGameConfig(gameId: string): GameConfig {
  const config = GAME_CONFIGS[gameId];
  if (!config) {
    throw new Error(`No GameConfig registered for gameId="${gameId}"`);
  }
  return {
    ...config,
    enabledRewards: { ...config.enabledRewards },
  };
}

export function listRegisteredGameIds(): string[] {
  return Object.keys(GAME_CONFIGS);
}
