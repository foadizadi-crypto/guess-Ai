import { calculateReward } from '@/shared/economy';
import {
  SPEED_CARD_GAME_ID,
  mapSpeedCardPlayToEngineEvents,
  rewardSpeedCardEvent,
  speedCardContentLevelCap,
  totalSpeedCardRewards,
} from './economy';
import type { GameEvent } from '@/shared/economy';

function assert(ok: boolean, msg: string): void {
  if (!ok) throw new Error(msg);
}

const level = 1;
const events: GameEvent[] = [
  'CORRECT',
  'WRONG',
  'COMBO',
  'SUPER_COMBO',
  'STREAK',
  'FINISH',
  'LEVEL_COMPLETE',
];

const expected: Record<GameEvent, { xp: number; coins: number }> = {
  CORRECT: { xp: 35, coins: 18 },
  WRONG: { xp: 0, coins: 0 },
  COMBO: { xp: 53, coins: 26 },
  SUPER_COMBO: { xp: 88, coins: 44 },
  STREAK: { xp: 44, coins: 22 },
  FINISH: { xp: 105, coins: 53 },
  LEVEL_COMPLETE: { xp: 70, coins: 35 },
};

assert(SPEED_CARD_GAME_ID === 'speed-card', 'gameId must be speed-card');
assert(speedCardContentLevelCap() === 20, 'contentLevelCap must stay 20');

for (const event of events) {
  const reward = rewardSpeedCardEvent(event, level);
  const want = expected[event];
  assert(reward.xp === want.xp && reward.coins === want.coins, `${event} expected ${want.xp}/${want.coins} got ${reward.xp}/${reward.coins}`);
  assert(Number.isFinite(reward.xp) && Number.isFinite(reward.coins), `${event} not finite`);
  assert(reward.xp >= 0 && reward.coins >= 0, `${event} negative`);
  assert(reward.event === event, `${event} echo`);
}

const at18 = calculateReward({ gameId: SPEED_CARD_GAME_ID, event: 'CORRECT', playerLevel: 18 });
assert(at18.xp === expected.CORRECT.xp && at18.coins === expected.CORRECT.coins, 'global level must not inflate Speed Card reward');
assert(at18.xp !== speedCardContentLevelCap(), 'content cap is not a reward');

assert(
  JSON.stringify(mapSpeedCardPlayToEngineEvents({ kind: 'answer', correct: true, streakAfter: 1, superComboJustActivated: false })) ===
    JSON.stringify(['CORRECT']),
  'correct maps to CORRECT',
);
assert(
  JSON.stringify(mapSpeedCardPlayToEngineEvents({ kind: 'answer', correct: false, streakAfter: 0, superComboJustActivated: false })) ===
    JSON.stringify(['WRONG']),
  'wrong maps to WRONG',
);
assert(
  JSON.stringify(mapSpeedCardPlayToEngineEvents({ kind: 'answer', correct: true, streakAfter: 3, superComboJustActivated: false })) ===
    JSON.stringify(['CORRECT', 'STREAK']),
  '3-streak maps STREAK',
);
assert(
  JSON.stringify(mapSpeedCardPlayToEngineEvents({ kind: 'answer', correct: true, streakAfter: 5, superComboJustActivated: false })) ===
    JSON.stringify(['CORRECT', 'COMBO']),
  '5-streak maps COMBO',
);
assert(
  JSON.stringify(mapSpeedCardPlayToEngineEvents({
    kind: 'answer',
    correct: true,
    streakAfter: 10,
    superComboJustActivated: true,
  })) === JSON.stringify(['CORRECT', 'SUPER_COMBO']),
  'super combo activation maps SUPER_COMBO',
);
assert(
  JSON.stringify(mapSpeedCardPlayToEngineEvents({ kind: 'finish' })) === JSON.stringify(['FINISH']),
  'round complete maps FINISH',
);

const stacked = totalSpeedCardRewards([
  rewardSpeedCardEvent('CORRECT', 1),
  rewardSpeedCardEvent('STREAK', 1),
]);
assert(stacked.xp === 35 + 44 && stacked.coins === 18 + 22, 'mapped events sum engine outputs only');

console.log('speed-card economy smoke ok', {
  contentLevelCap: speedCardContentLevelCap(),
  samples: expected,
});
