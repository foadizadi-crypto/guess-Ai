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

export const TICK_LOCK_CONFIG: GameConfig = freezeConfig({
  gameId: 'tick_lock',
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

export const GOLD_RUSH_CONFIG: GameConfig = freezeConfig({
  gameId: 'gold_rush',
  baseReward: 30,
  rewardWeight: 1,
  enabledRewards: ALL_REWARDS,
});

export const TWIN_LINK_CONFIG: GameConfig = freezeConfig({
  gameId: 'twin_link',
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

export const FLIP_MIND_CONFIG: GameConfig = freezeConfig({
  gameId: 'flip_mind',
  baseReward: 35,
  rewardWeight: 1,
  enabledRewards: ALL_REWARDS,
});

export const NEON_FLASH_CONFIG: GameConfig = freezeConfig({
  gameId: 'neon_flash',
  baseReward: 30,
  rewardWeight: 1,
  enabledRewards: ALL_REWARDS,
});

export const GLITCH_SPY_CONFIG: GameConfig = freezeConfig({
  gameId: 'glitch_spy',
  baseReward: 35,
  rewardWeight: 1,
  enabledRewards: ALL_REWARDS,
});

export const COLOR_TRAP_CONFIG: GameConfig = freezeConfig({
  gameId: 'color_trap',
  baseReward: 35,
  rewardWeight: 1,
  enabledRewards: ALL_REWARDS,
});

/**
 * Minigame economy config ids.
 *
 * Playable category order lives in constants/categories.ts:
 * 1–15 blur, 16 speed_card, 17 count_quick, 18 lost_item,
 * 19 flip_mind, 20 gold_rush, 21 tick_lock, 22 twin_link,
 * 23 neon_flash, 24 glitch_spy, 25 color_trap.
 */
export const NEW_GAME_IDS = [
  'gold_rush',
  'twin_link',
  'count-quick',
  'tick_lock',
  'lost-item',
  'flip_mind',
  'neon_flash',
  'glitch_spy',
  'color_trap',
] as const;

export type NewGameId = (typeof NEW_GAME_IDS)[number];

const GAME_CONFIGS: Record<string, GameConfig> = {
  [GUESS_AI_CONFIG.gameId]: GUESS_AI_CONFIG,
  [SPEED_CARD_CONFIG.gameId]: SPEED_CARD_CONFIG,
  [TICK_LOCK_CONFIG.gameId]: TICK_LOCK_CONFIG,
  [GOLD_RUSH_CONFIG.gameId]: GOLD_RUSH_CONFIG,
  [TWIN_LINK_CONFIG.gameId]: TWIN_LINK_CONFIG,
  [COUNT_QUICK_CONFIG.gameId]: COUNT_QUICK_CONFIG,
  [LOST_ITEM_CONFIG.gameId]: LOST_ITEM_CONFIG,
  [FLIP_MIND_CONFIG.gameId]: FLIP_MIND_CONFIG,
  [NEON_FLASH_CONFIG.gameId]: NEON_FLASH_CONFIG,
  [GLITCH_SPY_CONFIG.gameId]: GLITCH_SPY_CONFIG,
  [COLOR_TRAP_CONFIG.gameId]: COLOR_TRAP_CONFIG,
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
