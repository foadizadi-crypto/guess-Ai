/**
 * Regression checks for lobby daily-claim and spin-economy guards.
 * Mirrors the userStore / utils rules without importing React Native.
 *
 * Run: node artifacts/artifacts/mobile/scripts/verify-lobby-economy.mjs
 */
import assert from 'node:assert/strict';

const DAILY_REWARD_SCHEDULE = [
  { day: 1, coins: 15, bonus: null },
  { day: 2, coins: 30, bonus: null },
  { day: 3, coins: 30, bonus: 'hint' },
  { day: 4, coins: 60, bonus: null },
  { day: 5, coins: 80, bonus: null },
  { day: 6, coins: 100, bonus: null },
  { day: 7, coins: 150, bonus: 'reveal' },
];

const DAILY_MILESTONE_REWARDS = [
  { streak: 14, coins: 200 },
  { streak: 30, coins: 500 },
];

const ENERGY_DAILY_REWARD = 10;
const MAX_ENERGY = 100;

const SPIN_CONFIG = {
  extraSpinCost: 100,
  extraSpinsPerDay: 5,
  freeSpinsPerDay: 1,
  rewards: [
    { id: 'coins_50', type: 'coins', amount: 50, probability: 30 },
    { id: 'coins_100', type: 'coins', amount: 100, probability: 25 },
    { id: 'error_nullifier', type: 'consumable', amount: 1, probability: 15 },
    { id: 'time_boost', type: 'consumable', amount: 1, probability: 10 },
    { id: 'gems_5', type: 'gems', amount: 5, probability: 8 },
    { id: 'rare_sticker', type: 'cosmetic', amount: 1, probability: 5 },
    { id: 'coins_500', type: 'coins', amount: 500, probability: 5 },
    { id: 'jackpot', type: 'jackpot', amount: 10_000, probability: 2 },
  ],
};

const getTodayUTCString = () => new Date().toISOString().split('T')[0];
const utcDayString = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
};

const hasClaimedDailyRewardToday = (daily) => {
  const today = getTodayUTCString();
  if (daily.lastClaimDate === today) return true;
  if (utcDayString(daily.lastClaimed) === today) return true;
  return false;
};

function claimDailyReward(state) {
  if (hasClaimedDailyRewardToday(state.dailyReward)) return { state, awarded: 0 };

  const currentDayIdx = state.dailyReward.currentDay ?? 0;
  const schedule = DAILY_REWARD_SCHEDULE[currentDayIdx] ?? DAILY_REWARD_SCHEDULE[0];
  let awarded = schedule.coins;
  const nextDayIdx = (currentDayIdx + 1) % DAILY_REWARD_SCHEDULE.length;
  const nextStreak = state.dailyReward.streak + 1;
  const milestone = DAILY_MILESTONE_REWARDS.find((m) => m.streak === nextStreak);
  if (milestone) awarded += milestone.coins;

  const powerUps = { ...state.powerUps };
  if (schedule.bonus === 'hint') powerUps.hint = (powerUps.hint ?? 0) + 1;
  if (schedule.bonus === 'reveal') powerUps['reveal-blur'] = (powerUps['reveal-blur'] ?? 0) + 1;

  return {
    awarded,
    state: {
      ...state,
      coins: state.coins + awarded,
      energy: Math.min(MAX_ENERGY, state.energy + ENERGY_DAILY_REWARD),
      powerUps,
      dailyReward: {
        lastClaimed: new Date().toISOString(),
        lastClaimDate: getTodayUTCString(),
        streak: nextStreak,
        currentDay: nextDayIdx,
      },
    },
  };
}

function performSpin(state, isFree) {
  const todayStr = getTodayUTCString();
  const freeUsedToday = utcDayString(state.lastSpinDate) === todayStr;
  if (isFree && freeUsedToday) return { state, reward: null };

  const extraUsed = state.lastExtraSpinDate === todayStr ? state.extraSpinsToday : 0;
  if (!isFree) {
    if (extraUsed >= SPIN_CONFIG.extraSpinsPerDay) return { state, reward: null };
    if (state.coins < SPIN_CONFIG.extraSpinCost) return { state, reward: null };
  }

  // Deterministic pick for the grant path; weighted RNG is covered separately.
  const reward = SPIN_CONFIG.rewards[0];
  let coins = state.coins;
  if (!isFree) coins -= SPIN_CONFIG.extraSpinCost;
  if (reward.type === 'coins' || reward.type === 'jackpot') coins += reward.amount;

  return {
    reward,
    state: {
      ...state,
      coins,
      extraSpinsToday: isFree ? extraUsed : extraUsed + 1,
      lastExtraSpinDate: isFree ? state.lastExtraSpinDate : todayStr,
      lastSpinDate: isFree ? new Date().toISOString() : state.lastSpinDate,
    },
  };
}

function pickRewardIndex(rewards, randUnit) {
  const total = rewards.reduce((sum, r) => sum + r.probability, 0);
  let rand = randUnit * total;
  for (let i = 0; i < rewards.length; i++) {
    rand -= rewards[i].probability;
    if (rand <= 0) return i;
  }
  return rewards.length - 1;
}

let state = {
  coins: 500,
  energy: 10,
  powerUps: { hint: 0, 'reveal-blur': 0 },
  dailyReward: { lastClaimed: null, lastClaimDate: null, streak: 0, currentDay: 0 },
  lastSpinDate: null,
  lastExtraSpinDate: null,
  extraSpinsToday: 0,
};

// Daily: first claim pays day-1 coins + energy; second claim is a no-op.
const first = claimDailyReward(state);
assert.equal(first.awarded, 15);
assert.equal(first.state.coins, 515);
assert.equal(first.state.energy, 20); // 10 starting + 10 daily, cap 100
state = first.state;
const second = claimDailyReward(state);
assert.equal(second.awarded, 0);
assert.equal(second.state.coins, 515);

// Older saves that only have lastClaimed must not pay out again.
const legacy = claimDailyReward({
  ...state,
  dailyReward: { lastClaimed: new Date().toISOString(), lastClaimDate: null, streak: 1, currentDay: 1 },
});
assert.equal(legacy.awarded, 0);

// Day 3 still grants the hint bonus; day 7 grants reveal-blur.
const day3 = claimDailyReward({
  coins: 0,
  energy: 0,
  powerUps: { hint: 0, 'reveal-blur': 0 },
  dailyReward: {
    lastClaimed: '2020-01-01T00:00:00.000Z',
    lastClaimDate: '2020-01-01',
    streak: 2,
    currentDay: 2,
  },
});
assert.equal(day3.awarded, 30);
assert.equal(day3.state.powerUps.hint, 1);

const day7 = claimDailyReward({
  coins: 0,
  energy: 0,
  powerUps: { hint: 0, 'reveal-blur': 0 },
  dailyReward: {
    lastClaimed: '2020-01-01T00:00:00.000Z',
    lastClaimDate: '2020-01-01',
    streak: 6,
    currentDay: 6,
  },
});
assert.equal(day7.awarded, 150);
assert.equal(day7.state.powerUps['reveal-blur'], 1);

const milestone = claimDailyReward({
  coins: 0,
  energy: 0,
  powerUps: { hint: 0, 'reveal-blur': 0 },
  dailyReward: {
    lastClaimed: '2020-01-01T00:00:00.000Z',
    lastClaimDate: '2020-01-01',
    streak: 13,
    currentDay: 0,
  },
});
assert.equal(milestone.awarded, 215);

// Spin economy: 1 free / UTC day, 5 extras at 100 coins, odds stay off-screen.
assert.equal(SPIN_CONFIG.freeSpinsPerDay, 1);
assert.equal(SPIN_CONFIG.extraSpinsPerDay, 5);
assert.equal(SPIN_CONFIG.extraSpinCost, 100);
assert.equal(
  SPIN_CONFIG.rewards.reduce((sum, r) => sum + r.probability, 0),
  100,
);

let spinState = { coins: 500, lastSpinDate: null, lastExtraSpinDate: null, extraSpinsToday: 0 };
const free1 = performSpin(spinState, true);
assert.ok(free1.reward);
spinState = free1.state;
const free2 = performSpin(spinState, true);
assert.equal(free2.reward, null);

const extra1 = performSpin(spinState, false);
assert.ok(extra1.reward);
assert.equal(extra1.state.coins, 500 + 50 - 100 + 50);
spinState = extra1.state;
for (let i = 1; i < 5; i++) {
  const extra = performSpin(spinState, false);
  assert.ok(extra.reward);
  spinState = extra.state;
}
const extraBlocked = performSpin(spinState, false);
assert.equal(extraBlocked.reward, null);

assert.equal(pickRewardIndex(SPIN_CONFIG.rewards, 0.01), 0);
assert.equal(pickRewardIndex(SPIN_CONFIG.rewards, 0.99), SPIN_CONFIG.rewards.length - 1);

console.log('verify-lobby-economy: all checks passed');
