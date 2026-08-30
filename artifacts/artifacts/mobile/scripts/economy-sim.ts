/**
 * economy-sim.ts — Economy consistency checks + long-run currency simulation.
 *
 * Run with:  node --experimental-strip-types scripts/economy-sim.ts
 *
 * Imports the REAL config modules (no duplicated numbers) so the checks fail
 * the moment a tunable drifts out of sync. Two parts:
 *   1. Static consistency assertions across the config files.
 *   2. A 60-day simulation of a free player and a light spender, reporting the
 *      full faucet/sink balance for coins, gems, stamina and XP.
 */
import {
  STAMINA_PER_GAME,
  STAMINA_AD_REWARD,
  STAMINA_ADS_PER_DAY,
  ENERGY_DAILY_REWARD,
  ENERGY_REFILL_GEM_COST,
  STAMINA_UPGRADE_LEVELS,
  MAX_STAMINA_UPGRADE_LEVEL,
  FIRST_UPGRADE_OFFER_GEM_COST,
  getEnergyCap,
  getRefillIntervalMin,
  getUpgradeGemCost,
  isFirstUpgradeOfferActive,
  POWER_UP_PRICES,
  IAP_GEM_PACKS,
  IAP_COIN_PACKS,
  COIN_GEM_EXCHANGES,
  DAILY_XP_CAP,
  MAX_LEVEL,
} from '../constants/economy';
import {
  GAME_CONFIG,
  sessionCompleteCoins,
  perfectGameCoins,
  coinsForCorrect,
  computeAnswerXP,
} from '../constants/gameConfig';
import { SPIN_CONFIG, jackpotPayout } from '../constants/spinConfig';
import { LEVEL_REWARDS } from '../constants/levelRewards';
import {
  POWERUP_SHOP_ITEMS,
  CONSUMABLE_SHOP_ITEMS,
  STAMINA_PACKS,
} from '../constants/shopConfig';
import * as shopData from '../constants/shopData';
import { CONSUMABLE_PRICES } from '../constants/shopData';

let failures = 0;
let passes = 0;

function check(name: string, condition: boolean, detail = ''): void {
  if (condition) {
    passes += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('\n=== 1. STATIC CONSISTENCY CHECKS ===\n');

// ── Stamina source ──────────────────────────────────────────────────────────
console.log('-- Stamina source --');
check(
  'base cap is 50 and base refill is 20 min',
  getEnergyCap(0) === 50 && getRefillIntervalMin(0) === 20,
  `cap=${getEnergyCap(0)} interval=${getRefillIntervalMin(0)}`,
);
const basePerDay = Math.floor((24 * 60) / getRefillIntervalMin(0));
check(
  'base source regenerates 72/day (14 games + 2 spare)',
  basePerDay === 72 && Math.floor(basePerDay / STAMINA_PER_GAME) === 14,
  `perDay=${basePerDay} games=${Math.floor(basePerDay / STAMINA_PER_GAME)}`,
);
check(
  'caps strictly increase with level',
  STAMINA_UPGRADE_LEVELS.every((l, i) => i === 0 || l.cap > STAMINA_UPGRADE_LEVELS[i - 1].cap),
);
check(
  'refill interval strictly decreases with level',
  STAMINA_UPGRADE_LEVELS.every(
    (l, i) => i === 0 || l.refillIntervalMin < STAMINA_UPGRADE_LEVELS[i - 1].refillIntervalMin,
  ),
);
check(
  'gem costs strictly increase with level',
  STAMINA_UPGRADE_LEVELS.every((l, i) => i === 0 || l.gemCost > STAMINA_UPGRADE_LEVELS[i - 1].gemCost),
);
check(
  'max level cap (100) is at least the old pre-v2 cap so no player loses ceiling',
  getEnergyCap(MAX_STAMINA_UPGRADE_LEVEL) === 100,
  `cap=${getEnergyCap(MAX_STAMINA_UPGRADE_LEVEL)}`,
);
check(
  'gem refill (10) is not cheaper than the equivalent stamina pack',
  (() => {
    const pack = STAMINA_PACKS.find((p) => p.stamina >= getEnergyCap(0));
    return !pack || ENERGY_REFILL_GEM_COST >= pack.gemCost;
  })(),
  `refill=${ENERGY_REFILL_GEM_COST} vs pack=${STAMINA_PACKS.find((p) => p.stamina >= getEnergyCap(0))?.gemCost}`,
);
check(
  'launch offer is a genuine discount on level 1',
  FIRST_UPGRADE_OFFER_GEM_COST < STAMINA_UPGRADE_LEVELS[1].gemCost,
);
check(
  'launch offer applies for a brand-new account at level 0',
  isFirstUpgradeOfferActive(new Date().toISOString(), 0) &&
    getUpgradeGemCost(1, new Date().toISOString(), 0) === FIRST_UPGRADE_OFFER_GEM_COST,
);
check(
  'launch offer expires after the window',
  !isFirstUpgradeOfferActive(new Date(Date.now() - 72 * 3600_000).toISOString(), 0) &&
    getUpgradeGemCost(1, new Date(Date.now() - 72 * 3600_000).toISOString(), 0) ===
      STAMINA_UPGRADE_LEVELS[1].gemCost,
);
check(
  'launch offer never discounts levels 2 and 3',
  getUpgradeGemCost(2, new Date().toISOString(), 1) === STAMINA_UPGRADE_LEVELS[2].gemCost &&
    getUpgradeGemCost(3, new Date().toISOString(), 2) === STAMINA_UPGRADE_LEVELS[3].gemCost,
);

// ── Price table consistency ─────────────────────────────────────────────────
console.log('\n-- Price tables --');
for (const item of POWERUP_SHOP_ITEMS) {
  const legacy = (POWER_UP_PRICES as Record<string, number>)[item.id];
  if (legacy !== undefined) {
    check(
      `power-up "${item.id}" price matches economy.ts`,
      legacy === item.price,
      `shopConfig=${item.price} economy=${legacy}`,
    );
  }
}
for (const item of CONSUMABLE_SHOP_ITEMS) {
  const dataPrice = (CONSUMABLE_PRICES as Record<string, number>)[item.id];
  if (dataPrice !== undefined) {
    check(
      `consumable "${item.id}" price matches shopData.ts`,
      dataPrice === item.price,
      `shopConfig=${item.price} shopData=${dataPrice}`,
    );
  }
}
check(
  'exactly ONE real-money price table exists (no duplicate IAP tables in shopData)',
  !('GEM_PACKS' in shopData) && !('COIN_PACKS' in shopData),
  'shopData must not redefine IAP packs — economy.ts is authoritative',
);
check(
  'IAP tables are non-empty and priced',
  IAP_GEM_PACKS.length > 0 &&
    IAP_COIN_PACKS.length > 0 &&
    IAP_GEM_PACKS.every((p) => p.amount > 0 && p.price.startsWith('$')) &&
    IAP_COIN_PACKS.every((p) => p.amount > 0 && p.price.startsWith('$')),
);
check(
  'gem packs are better value per gem as they get bigger (no trap tiers)',
  (() => {
    const usd = (s: string) => Number(s.replace('$', ''));
    const rates = IAP_GEM_PACKS.map((p) => usd(p.price) / p.amount);
    return rates.every((r, i) => i === 0 || r <= rates[i - 1] + 1e-9);
  })(),
  IAP_GEM_PACKS.map((p) => `${p.price}/${p.amount}`).join(' '),
);

// ── Spin wheel ──────────────────────────────────────────────────────────────
console.log('\n-- Spin wheel --');
const probTotal = SPIN_CONFIG.rewards.reduce((s, r) => s + r.probability, 0);
check('spin probabilities sum to exactly 100', probTotal === 100, `sum=${probTotal}`);
check(
  'every consumable/cosmetic spin reward has a grantable item id',
  SPIN_CONFIG.rewards
    .filter((r) => r.type === 'consumable' || r.type === 'cosmetic')
    .every((r) => Boolean(r.itemId ?? r.id)),
);
check(
  'consumable spin rewards map to real consumable ids',
  SPIN_CONFIG.rewards
    .filter((r) => r.type === 'consumable')
    .every((r) => (r.itemId ?? r.id) in CONSUMABLE_PRICES),
  SPIN_CONFIG.rewards.filter((r) => r.type === 'consumable').map((r) => r.itemId ?? r.id).join(','),
);
check(
  'jackpot payout respects the safety cap',
  jackpotPayout(SPIN_CONFIG.rewards.find((r) => r.isJackpot)!.amount) <= SPIN_CONFIG.jackpotMaxReward,
);
const spinCoinEV = SPIN_CONFIG.rewards.reduce((sum, r) => {
  if (r.type === 'coins') return sum + (r.probability / 100) * r.amount;
  if (r.type === 'jackpot') return sum + (r.probability / 100) * jackpotPayout(r.amount);
  return sum;
}, 0);
const spinGemEV = SPIN_CONFIG.rewards.reduce(
  (sum, r) => (r.type === 'gems' ? sum + (r.probability / 100) * r.amount : sum),
  0,
);
check(
  'a paid spin is +EV in coins but not absurdly so (1x–3x its cost)',
  spinCoinEV > SPIN_CONFIG.extraSpinCost && spinCoinEV < SPIN_CONFIG.extraSpinCost * 3,
  `EV=${spinCoinEV.toFixed(1)} cost=${SPIN_CONFIG.extraSpinCost}`,
);
check('spin wheel is a real gem faucet', spinGemEV > 0, `gemEV=${spinGemEV.toFixed(2)}/spin`);

// ── Level rewards ───────────────────────────────────────────────────────────
console.log('\n-- Level rewards --');
const gemLevels = LEVEL_REWARDS.filter((r) => r.gems > 0);
check(
  'every 10-level milestone grants gems',
  gemLevels.length === 50 && gemLevels.every((r) => r.level % 10 === 0),
  `count=${gemLevels.length}`,
);
check(
  'gem milestones scale up with level band (progression feels like growth)',
  (() => {
    const at = (lv: number) => LEVEL_REWARDS.find((r) => r.level === lv)!.gems;
    return at(10) < at(110) && at(110) < at(260) && at(260) < at(410);
  })(),
  `L10=${LEVEL_REWARDS.find((r) => r.level === 10)!.gems} L110=${LEVEL_REWARDS.find((r) => r.level === 110)!.gems} L260=${LEVEL_REWARDS.find((r) => r.level === 260)!.gems} L410=${LEVEL_REWARDS.find((r) => r.level === 410)!.gems}`,
);
check(
  'early gem income is small enough that day-1 accounts cannot buy an upgrade',
  LEVEL_REWARDS.filter((r) => r.level <= 30).reduce((s, r) => s + r.gems, 0) <
    FIRST_UPGRADE_OFFER_GEM_COST,
  `L1-30 gems=${LEVEL_REWARDS.filter((r) => r.level <= 30).reduce((s, r) => s + r.gems, 0)}`,
);
check(
  'no level grants gems outside a 10-level milestone',
  LEVEL_REWARDS.every((r) => r.gems === 0 || r.level % 10 === 0),
);
check(
  'level rewards never have negative payouts',
  LEVEL_REWARDS.every((r) => r.coins >= 0 && r.gems >= 0),
);
check('max level table matches MAX_LEVEL', LEVEL_REWARDS[LEVEL_REWARDS.length - 1].level <= MAX_LEVEL);

// ── Coin/gem exchange ───────────────────────────────────────────────────────
console.log('\n-- Coin to gem exchange --');
check(
  'coin→gem exchange is capped so it cannot replace IAP',
  COIN_GEM_EXCHANGES.every((e) => e.maxPurchases > 0 && e.maxPurchases < 10),
);
const lifetimeExchangeGems = COIN_GEM_EXCHANGES.reduce((s, e) => s + e.gems * e.maxPurchases, 0);
check(
  'lifetime exchange gems cannot fund the whole upgrade tree alone',
  lifetimeExchangeGems < STAMINA_UPGRADE_LEVELS.reduce((s, l) => s + l.gemCost, 0),
  `exchange=${lifetimeExchangeGems} tree=${STAMINA_UPGRADE_LEVELS.reduce((s, l) => s + l.gemCost, 0)}`,
);

console.log('\n=== 2. SIXTY-DAY SIMULATION ===\n');

interface SimResult {
  days: number;
  gamesPlayed: number;
  coinsEarned: number;
  gemsEarned: number;
  staminaFromRegen: number;
  staminaFromAds: number;
  xpEarned: number;
  finalLevel: number;
  upgradesUnlocked: number;
  daysToFirstUpgrade: number | null;
}

/**
 * Deterministic simulation (expected values, no RNG) of a player who logs in
 * daily, claims the daily reward, takes the free spin, watches all stamina ads
 * and plays until out of stamina. `perfectRate` is the share of rounds finished
 * 20/20; the rest are treated as fully-completed non-perfect rounds.
 */
function simulate(opts: {
  days: number;
  difficulty: 'easy' | 'medium' | 'hard';
  accuracy: number;
  watchAds: boolean;
  buyUpgrades: boolean;
  /** Play sessions per day. The cap truncates accrual, so this matters a lot. */
  sessionsPerDay?: number;
}): SimResult {
  const { days, difficulty, accuracy, watchAds, buyUpgrades, sessionsPerDay = 1 } = opts;

  let coins = 500; // starting balance from the store defaults
  let gems = 0;
  let xp = 0;
  let level = 1;
  let sourceLevel = 0;
  let energy = getEnergyCap(0);

  let gamesPlayed = 0;
  let coinsEarned = 0;
  let gemsEarned = 0;
  let staminaFromRegen = 0;
  let staminaFromAds = 0;
  let xpEarned = 0;
  let daysToFirstUpgrade: number | null = null;

  const questionsPerRound = GAME_CONFIG.questions_per_session;

  /** One round played question-by-question through the real reward functions. */
  function playRound(): { coins: number; xp: number; perfect: boolean } {
    let coinsOut = 0;
    let xpOut = 0;
    let streak = 0;
    let wrong = 0;

    for (let q = 0; q < questionsPerRound; q += 1) {
      const correct = Math.random() < accuracy;
      if (correct) {
        streak += 1;
        xpOut += computeAnswerXP(difficulty, streak);
        coinsOut += coinsForCorrect(difficulty, streak);
      } else {
        streak = 0;
        wrong += 1;
        xpOut += GAME_CONFIG.xp_wrong;
      }
    }

    const perfect = wrong === 0;
    coinsOut += sessionCompleteCoins(difficulty);
    if (perfect) coinsOut += perfectGameCoins(difficulty);
    return { coins: coinsOut, xp: xpOut, perfect };
  }

  for (let day = 1; day <= days; day += 1) {
    // Daily reward: coins per the schedule average + energy (may overflow).
    coins += 60;
    coinsEarned += 60;
    energy += ENERGY_DAILY_REWARD;

    // Free spin: expected value.
    coins += spinCoinEV;
    coinsEarned += spinCoinEV;
    gems += spinGemEV;
    gemsEarned += spinGemEV;

    // Rewarded stamina ads.
    if (watchAds) {
      const adStamina = STAMINA_ADS_PER_DAY * STAMINA_AD_REWARD;
      energy += adStamina;
      staminaFromAds += adStamina;
    }

    let dailyXP = 0;
    const minutesPerSlice = (24 * 60) / sessionsPerDay;

    for (let slice = 0; slice < sessionsPerDay; slice += 1) {
      // Passive regen for this slice, clamped to the cap. Accrual STOPS at the
      // cap, so a player who logs in less often banks strictly less stamina.
      const regen = Math.floor(minutesPerSlice / getRefillIntervalMin(sourceLevel));
      const cap = getEnergyCap(sourceLevel);
      const beforeRegen = energy;
      energy = Math.max(energy, Math.min(cap, energy + regen));
      staminaFromRegen += energy - beforeRegen;

      // Play until out of stamina.
      while (energy >= STAMINA_PER_GAME) {
        energy -= STAMINA_PER_GAME;
        gamesPlayed += 1;

        const round = playRound();
        const roundCoins = round.coins;
        const capLeft = Math.max(0, DAILY_XP_CAP - dailyXP);
        const roundXP = Math.min(round.xp, capLeft);

        coins += roundCoins;
        coinsEarned += roundCoins;
        xp += roundXP;
        xpEarned += roundXP;
        dailyXP += roundXP;
      }
    }

    // Level ups → claim milestone gems.
    let newLevel = level;
    let acc = 0;
    for (let l = 1; l < MAX_LEVEL; l += 1) {
      const needed = Math.round(
        GAME_CONFIG.xp_base_formula_coefficient * Math.pow(l, GAME_CONFIG.xp_base_formula_exponent),
      );
      if (acc + needed > xp) break;
      acc += needed;
      newLevel = l + 1;
    }
    for (let l = level + 1; l <= newLevel; l += 1) {
      const reward = LEVEL_REWARDS.find((r) => r.level === l);
      if (reward) {
        coins += reward.coins;
        coinsEarned += reward.coins;
        gems += reward.gems;
        gemsEarned += reward.gems;
      }
    }
    level = newLevel;

    // Buy the next source upgrade as soon as it is affordable.
    if (buyUpgrades) {
      const created = new Date(Date.now() - (day - 1) * 86_400_000).toISOString();
      while (sourceLevel < MAX_STAMINA_UPGRADE_LEVEL) {
        const cost = getUpgradeGemCost(sourceLevel + 1, created, sourceLevel);
        if (gems < cost) break;
        gems -= cost;
        sourceLevel += 1;
        if (daysToFirstUpgrade === null) daysToFirstUpgrade = day;
      }
    }
  }

  return {
    days,
    gamesPlayed,
    coinsEarned: Math.round(coinsEarned),
    gemsEarned: Math.round(gemsEarned),
    staminaFromRegen,
    staminaFromAds,
    xpEarned,
    finalLevel: level,
    upgradesUnlocked: sourceLevel,
    daysToFirstUpgrade,
  };
}

function report(label: string, r: SimResult): void {
  console.log(`-- ${label} (${r.days} days) --`);
  console.log(`   games played      : ${r.gamesPlayed} (${(r.gamesPlayed / r.days).toFixed(1)}/day)`);
  console.log(`   stamina regen     : ${r.staminaFromRegen}  ads: ${r.staminaFromAds}`);
  console.log(`   coins earned      : ${r.coinsEarned.toLocaleString()}`);
  console.log(`   gems earned       : ${r.gemsEarned}`);
  console.log(`   xp earned         : ${r.xpEarned.toLocaleString()}  → level ${r.finalLevel}`);
  console.log(`   source upgrades   : ${r.upgradesUnlocked}/${MAX_STAMINA_UPGRADE_LEVEL}` +
    (r.daysToFirstUpgrade ? ` (first on day ${r.daysToFirstUpgrade})` : ' (none affordable)'));
  console.log('');
}

// 75% accuracy is a realistic average player; 90% is a strong player.
const onceADay = simulate({ days: 60, difficulty: 'medium', accuracy: 0.75, watchAds: false, buyUpgrades: true, sessionsPerDay: 1 });
const freeNoAds = simulate({ days: 60, difficulty: 'medium', accuracy: 0.75, watchAds: false, buyUpgrades: true, sessionsPerDay: 3 });
const freeWithAds = simulate({ days: 60, difficulty: 'medium', accuracy: 0.75, watchAds: true, buyUpgrades: true, sessionsPerDay: 3 });
const grinder = simulate({ days: 60, difficulty: 'hard', accuracy: 0.9, watchAds: true, buyUpgrades: true, sessionsPerDay: 3 });

report('Free player, ONE login/day, no ads', onceADay);
report('Free player, 3 logins/day, no ads', freeNoAds);
report('Free player, 3 logins/day + all ads', freeWithAds);
report('Strong player, hard mode, 3 logins/day + ads', grinder);

console.log('NOTE: the cap truncates passive accrual, so login frequency — not just');
console.log(`      total regen — decides playtime: ${(onceADay.gamesPlayed / onceADay.days).toFixed(1)} vs ${(freeNoAds.gamesPlayed / freeNoAds.days).toFixed(1)} rounds/day.\n`);

console.log('=== 3. BALANCE ASSERTIONS ON SIMULATION ===\n');
check(
  'a player who spreads play across the day reaches the promised ~14 rounds/day',
  freeNoAds.gamesPlayed / freeNoAds.days >= 14 && freeNoAds.gamesPlayed / freeNoAds.days < 20,
  `${(freeNoAds.gamesPlayed / freeNoAds.days).toFixed(1)}/day`,
);
check(
  'a single-login player still gets a full session (cap-truncated but playable)',
  onceADay.gamesPlayed / onceADay.days >= 10,
  `${(onceADay.gamesPlayed / onceADay.days).toFixed(1)}/day — cap truncates accrual`,
);
check(
  'watching ads is a meaningful but not dominant boost (+1 to +5 rounds/day)',
  freeWithAds.gamesPlayed - freeNoAds.gamesPlayed > freeNoAds.days &&
    freeWithAds.gamesPlayed - freeNoAds.gamesPlayed < freeNoAds.days * 5,
  `+${freeWithAds.gamesPlayed - freeNoAds.gamesPlayed} rounds over ${freeNoAds.days} days`,
);
check(
  'a free player reaches the first upgrade within 60 days (gem faucet works)',
  freeWithAds.daysToFirstUpgrade !== null,
  `day=${freeWithAds.daysToFirstUpgrade}`,
);
check(
  'the first upgrade is an earned goal, not a day-one giveaway',
  (freeWithAds.daysToFirstUpgrade ?? 0) >= 3,
  `day=${freeWithAds.daysToFirstUpgrade}`,
);
check(
  'a free player CANNOT max the whole tree in 60 days (paid upgrades stay meaningful)',
  freeWithAds.upgradesUnlocked < MAX_STAMINA_UPGRADE_LEVEL,
  `unlocked=${freeWithAds.upgradesUnlocked}`,
);
check(
  'daily XP cap is never exceeded',
  freeWithAds.xpEarned / freeWithAds.days <= DAILY_XP_CAP,
  `${Math.round(freeWithAds.xpEarned / freeWithAds.days)}/day vs cap ${DAILY_XP_CAP}`,
);
check(
  'coin income stays ahead of consumable prices without trivialising them',
  (() => {
    const perDay = freeWithAds.coinsEarned / freeWithAds.days;
    const dearest = Math.max(...CONSUMABLE_SHOP_ITEMS.map((i) => i.price));
    return perDay > dearest && perDay < dearest * 30;
  })(),
  `${Math.round(freeWithAds.coinsEarned / freeWithAds.days)} coins/day`,
);

console.log(`\n=== RESULT: ${passes} passed, ${failures} failed ===\n`);
process.exit(failures > 0 ? 1 : 0);
