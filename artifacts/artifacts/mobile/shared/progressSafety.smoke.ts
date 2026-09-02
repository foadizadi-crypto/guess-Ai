import { getDailyWeekPowerUp, STAMINA_UPGRADE_LEVELS } from '@/constants/economy';
import { STARTER_PACK_GRANT } from '@/constants/shopData';
import { SPIN_CONFIG } from '@/constants/spinConfig';
import { keepAtLeast, keepEnergyClock, rankedLeaderboardEntries } from '@/shared/progressSafety';
import { getTodayUTCString, isUtcDayToday } from '@/utils';

function assert(ok: boolean, msg: string): void {
  if (!ok) throw new Error(msg);
}

assert(keepAtLeast(1200, 0) === 1200, 'cloud 0 must not wipe local XP/wallet');
assert(keepAtLeast(10, 50) === 50, 'larger cloud value wins');
assert(keepAtLeast(10, 'x') === 10, 'non-number remote keeps local');
assert(keepEnergyClock(1_700_000_000_000, 0) === 1_700_000_000_000, 'remote 0 clock is ignored');
assert(keepEnergyClock(1, 9) === 9, 'positive remote clock wins');
assert(keepEnergyClock(null, 0) === null, 'both empty stay empty');

const ranked = rankedLeaderboardEntries([
  { userId: 'a', xp: 0, rank: 1 },
  { userId: 'b', xp: 40, rank: 2 },
  { userId: 'c', xp: 0, rank: 3 },
]);
assert(ranked.length === 1 && ranked[0]?.userId === 'b' && ranked[0]?.rank === 1, 'zeros are not ranked');

assert(STAMINA_UPGRADE_LEVELS.map((l) => l.cap).join(',') === '100,150,250,400', 'locked caps');
assert(getDailyWeekPowerUp(0) === 'hint' && getDailyWeekPowerUp(7) === 'reveal-blur', 'daily week cycle');
assert(isUtcDayToday(getTodayUTCString()), 'UTC today helper');
assert(!isUtcDayToday('1999-01-01'), 'stale UTC date is not today');

const gemSlots = SPIN_CONFIG.rewards.filter((r) => r.type === 'gems' || r.type === 'jackpot');
assert(gemSlots.length === 1 && gemSlots[0]?.amount === 50 && gemSlots[0]?.isJackpot === true, 'one 50-gem jackpot');
assert(STARTER_PACK_GRANT.stamina === 100 && STARTER_PACK_GRANT.avatarId === 'avatar_2', 'starter grant');

console.log('progressSafety smoke ok');
