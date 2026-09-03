import { calculateReward } from './rewardEngine';
import { getGameConfig, listRegisteredGameIds } from './gameConfigs';
import { EVENT_MULTIPLIERS } from './constants';
import { applyXp } from '../progression/progressionEngine';
import { getXpRequiredForLevel } from '../progression/levelRequirements';
import type { GameEvent } from './types';

function assert(ok: boolean, msg: string): void {
  if (!ok) throw new Error(msg);
}

const events: GameEvent[] = [
  'CORRECT',
  'COMBO',
  'SUPER_COMBO',
  'FINISH',
  'STREAK',
  'WRONG',
  'LEVEL_COMPLETE',
];

const ids = listRegisteredGameIds();
assert(ids.length === 11, `expected 11 configs, got ${ids.length}`);
assert(ids.includes('guess-ai'), 'guess-ai config missing');

for (const gameId of ids) {
  for (const event of events) {
    const reward = calculateReward({ gameId, event, playerLevel: 18 });
    assert(Number.isFinite(reward.xp), `${gameId} ${event} xp not finite`);
    assert(Number.isFinite(reward.coins), `${gameId} ${event} coins not finite`);
    assert(reward.xp !== Infinity && reward.coins !== Infinity, `${gameId} ${event} Infinity`);
    assert(reward.xp >= 0 && reward.coins >= 0, `${gameId} ${event} negative`);
    assert(reward.event === event, `${gameId} event echo`);
  }

  const at1 = calculateReward({ gameId, event: 'CORRECT', playerLevel: 1 });
  const at18 = calculateReward({ gameId, event: 'CORRECT', playerLevel: 18 });
  assert(at1.xp === at18.xp && at1.coins === at18.coins, `${gameId} level must not inflate reward`);
}

const correct = calculateReward({ gameId: 'speed-card', event: 'CORRECT', playerLevel: 1 });
const combo = calculateReward({ gameId: 'speed-card', event: 'COMBO', playerLevel: 1 });
const finish = calculateReward({ gameId: 'speed-card', event: 'FINISH', playerLevel: 1 });
const levelComplete = calculateReward({ gameId: 'speed-card', event: 'LEVEL_COMPLETE', playerLevel: 1 });
const wrong = calculateReward({ gameId: 'speed-card', event: 'WRONG', playerLevel: 1 });

assert(correct.xp === 35 && correct.coins === 18, `speed-card CORRECT expected 35/18 got ${correct.xp}/${correct.coins}`);
assert(combo.xp > correct.xp, 'COMBO must pay more XP than CORRECT');
assert(finish.xp > combo.xp, 'FINISH must pay more XP than COMBO');
assert(levelComplete.xp === 70 && levelComplete.coins === 35, `LEVEL_COMPLETE expected 70/35 got ${levelComplete.xp}/${levelComplete.coins}`);
assert(wrong.xp === 0 && wrong.coins === 0, 'WRONG must pay 0');
assert(EVENT_MULTIPLIERS.CORRECT === 1, 'CORRECT multiplier must stay 1');
assert(EVENT_MULTIPLIERS.STREAK === 1.25, 'STREAK multiplier must be 1.25');
assert(EVENT_MULTIPLIERS.COMBO === 1.5, 'COMBO multiplier must stay 1.5');
assert(EVENT_MULTIPLIERS.LEVEL_COMPLETE === 2, 'LEVEL_COMPLETE multiplier must stay 2');
assert(EVENT_MULTIPLIERS.SUPER_COMBO === 2.5, 'SUPER_COMBO multiplier must stay 2.5');
assert(EVENT_MULTIPLIERS.FINISH === 3, 'FINISH multiplier must stay 3');
assert(EVENT_MULTIPLIERS.WRONG === 0, 'WRONG multiplier must stay 0');
const streak = calculateReward({ gameId: 'speed-card', event: 'STREAK', playerLevel: 1 });
assert(streak.xp === 44 && streak.coins === 22, `speed-card STREAK expected 44/22 got ${streak.xp}/${streak.coins}`);
assert(streak.xp > correct.xp && streak.xp < combo.xp, 'STREAK must sit between CORRECT and COMBO');

const blockedSuper = calculateReward({ gameId: 'tick_lock', event: 'SUPER_COMBO', playerLevel: 1 });
const blockedStreak = calculateReward({ gameId: 'tick_lock', event: 'STREAK', playerLevel: 1 });
assert(blockedSuper.xp === 0 && blockedSuper.coins === 0, 'tick_lock SUPER_COMBO is disabled');
assert(blockedStreak.xp === 0 && blockedStreak.coins === 0, 'tick_lock STREAK is disabled');

const guessAi = calculateReward({ gameId: 'guess-ai', event: 'CORRECT', playerLevel: 5 });
assert(guessAi.xp === 30 && guessAi.coins === 15, `guess-ai CORRECT expected 30/15 got ${guessAi.xp}/${guessAi.coins}`);

const speedCopy = getGameConfig('speed-card');
speedCopy.baseReward = 999;
speedCopy.enabledRewards.combo = false;
assert(getGameConfig('speed-card').baseReward === 35, 'mutating a returned config must not change speed-card');
assert(getGameConfig('guess-ai').baseReward === 30, 'speed-card must not affect guess-ai');
assert(getGameConfig('glitch_spy').baseReward === 35, 'glitch_spy config isolated');

const need1 = getXpRequiredForLevel(1);
assert(need1 > 0, 'level 1 XP required must not be 0');
const leveled = applyXp(1, 0, need1);
assert(leveled.level === 2 && leveled.levelsGained === 1, 'XP must level up globally');
const sameLevel = applyXp(2, 0, need1 - 1);
assert(sameLevel.level === 2 && sameLevel.levelsGained === 0, 'partial XP must not level up');

console.log('economy smoke ok', {
  registered: ids,
  speedCardCorrect: correct,
  speedCardStreak: streak,
  guessAiCorrect: guessAi,
  xpRequiredL1: need1,
});
