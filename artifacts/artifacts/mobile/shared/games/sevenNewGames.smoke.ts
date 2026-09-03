import { MINIGAME_RAW_CONFIGS } from '@/shared/games/registry';
import { getGameConfig, NEW_GAME_IDS } from '@/shared/economy/gameConfigs';
import { getFateSettings } from '@/games/GoldRush/config';
import { getMatchSettings } from '@/games/TwinLink/config';
import { getClickSettings } from '@/games/TickLock/config';
import { getReactionSettings } from '@/games/FlipMind/config';
import { getSimonSettings } from '@/games/NeonFlash/config';
import { getDifferenceSettings } from '@/games/GlitchSpy/config';
import { getDifficultySettings } from '@/games/ColorTrap/config';
import { calculateClickScore } from '@/games/TickLock/engine';

function assert(ok: boolean, msg: string): void {
  if (!ok) throw new Error(msg);
}

const sevenIds = [
  'flip_mind',
  'gold_rush',
  'tick_lock',
  'twin_link',
  'neon_flash',
  'glitch_spy',
  'color_trap',
] as const;

for (const id of sevenIds) {
  assert((NEW_GAME_IDS as readonly string[]).includes(id), `${id} in NEW_GAME_IDS`);
  assert(MINIGAME_RAW_CONFIGS.some((config) => config.gameId === id), `${id} in registry`);
  assert(MINIGAME_RAW_CONFIGS.find((config) => config.gameId === id)?.models.length === 50, `${id} has 50 models`);
}

assert(getGameConfig('gold_rush').baseReward === 30, 'gold_rush baseReward 30');
assert(getGameConfig('twin_link').baseReward === 30, 'twin_link baseReward 30');
assert(getGameConfig('tick_lock').baseReward === 25, 'tick_lock baseReward 25');
assert(getGameConfig('tick_lock').enabledRewards.superCombo === false, 'tick_lock superCombo off');
assert(getGameConfig('tick_lock').enabledRewards.streak === false, 'tick_lock streak off');
assert(getGameConfig('flip_mind').baseReward === 35, 'flip_mind baseReward 35');
assert(getGameConfig('neon_flash').baseReward === 30, 'neon_flash baseReward 30');
assert(getGameConfig('glitch_spy').baseReward === 35, 'glitch_spy baseReward 35');
assert(getGameConfig('color_trap').baseReward === 35, 'color_trap baseReward 35');

assert(JSON.stringify(getReactionSettings('easy')) === JSON.stringify({ maxRounds: 10, timeLimit: 5.0 }), 'flip_mind easy');
assert(JSON.stringify(getReactionSettings('medium')) === JSON.stringify({ maxRounds: 20, timeLimit: 3.0 }), 'flip_mind medium');
assert(JSON.stringify(getReactionSettings('hard')) === JSON.stringify({ maxRounds: 30, timeLimit: 1.5 }), 'flip_mind hard');

assert(JSON.stringify(getFateSettings('easy')) === JSON.stringify({ totalCards: 5, bombCount: 1, multiplierCount: 1 }), 'gold_rush easy');
assert(JSON.stringify(getFateSettings('medium')) === JSON.stringify({ totalCards: 5, bombCount: 2, multiplierCount: 0 }), 'gold_rush medium');
assert(JSON.stringify(getFateSettings('hard')) === JSON.stringify({ totalCards: 6, bombCount: 3, multiplierCount: 0 }), 'gold_rush hard');

assert(JSON.stringify(getClickSettings('easy')) === JSON.stringify({ targetTime: 1.00, hideTime: 9.99, tolerance: 0.15 }), 'tick_lock easy');
assert(JSON.stringify(getClickSettings('medium')) === JSON.stringify({ targetTime: 1.00, hideTime: 0.5, tolerance: 0.08 }), 'tick_lock medium');
assert(JSON.stringify(getClickSettings('hard')) === JSON.stringify({ targetTime: 1.50, hideTime: 0.4, tolerance: 0.04 }), 'tick_lock hard');
assert(calculateClickScore(1.00, 1.00, 0.15) === 100, 'tick_lock exact score');
assert(calculateClickScore(1.20, 1.00, 0.15) === 0, 'tick_lock miss outside tolerance');

assert(JSON.stringify(getMatchSettings('easy')) === JSON.stringify({ pairCount: 4 }), 'twin_link easy');
assert(JSON.stringify(getMatchSettings('medium')) === JSON.stringify({ pairCount: 6 }), 'twin_link medium');
assert(JSON.stringify(getMatchSettings('hard')) === JSON.stringify({ pairCount: 12 }), 'twin_link hard');

assert(JSON.stringify(getSimonSettings('easy')) === JSON.stringify({ maxRounds: 4, speed: 500 }), 'neon_flash easy');
assert(JSON.stringify(getSimonSettings('medium')) === JSON.stringify({ maxRounds: 6, speed: 400 }), 'neon_flash medium');
assert(JSON.stringify(getSimonSettings('hard')) === JSON.stringify({ maxRounds: 8, speed: 250 }), 'neon_flash hard');

assert(JSON.stringify(getDifferenceSettings('easy')) === JSON.stringify({ gridCount: 4, timeLimit: 8.0 }), 'glitch_spy easy');
assert(JSON.stringify(getDifferenceSettings('medium')) === JSON.stringify({ gridCount: 9, timeLimit: 5.0 }), 'glitch_spy medium');
assert(JSON.stringify(getDifferenceSettings('hard')) === JSON.stringify({ gridCount: 16, timeLimit: 3.0 }), 'glitch_spy hard');

assert(JSON.stringify(getDifficultySettings('easy')) === JSON.stringify({ maxQuestions: 5, timeLimit: 4.0 }), 'color_trap easy');
assert(JSON.stringify(getDifficultySettings('medium')) === JSON.stringify({ maxQuestions: 8, timeLimit: 2.5 }), 'color_trap medium');
assert(JSON.stringify(getDifficultySettings('hard')) === JSON.stringify({ maxQuestions: 12, timeLimit: 1.5 }), 'color_trap hard');

console.log('seven new games smoke ok', { sevenIds: [...sevenIds] });
