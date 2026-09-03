import { STAMINA_ADS_PER_DAY, STAMINA_AD_REWARD, STAMINA_PER_GAME, STAMINA_UPGRADE_LEVELS, IN_GAME_RETRY_ADS_PER_DAY, getMaxLevel, getUpgradeGemCost } from '@/constants/economy';
import { DIFFICULTY_IDS, isDifficultyOpen } from '@/shared/difficulty';
import { BLUR_CATEGORIES, CATEGORY_LAYOUT, NEW_PLAYABLE_CATEGORIES } from '@/constants/categories';
import { calculateReward, gameIdForCategory, GEM_GAMEPLAY_AMOUNT, getGameConfig, listRegisteredGameIds, NEW_GAME_IDS, weeklyLeaderboardGems } from '@/shared/economy';
import { CHALLENGE_SLOT_COUNT } from '@/shared/games/rawConfig';
import { MINIGAME_RAW_CONFIGS } from '@/shared/games/registry';
import { restartGate } from '@/shared/stamina/restartGate';

function assert(ok: boolean, msg: string): void {
  if (!ok) throw new Error(msg);
}

assert(DIFFICULTY_IDS.length === 5, 'five difficulties');
assert(isDifficultyOpen('easy') && isDifficultyOpen('hard'), 'open tiers');
assert(!isDifficultyOpen('extra-hard') && !isDifficultyOpen('max'), 'locked tiers');

assert(listRegisteredGameIds().length === 11, '11 game configs');
assert(listRegisteredGameIds().includes('speed-card'), 'speed-card is an existing game config');
assert(gameIdForCategory('animals') === 'guess-ai', 'blur maps to guess-ai');
assert(BLUR_CATEGORIES.length === 15, '15 blur categories');
assert(NEW_PLAYABLE_CATEGORIES.length === 10, '10 playable independent games');
assert(CATEGORY_LAYOUT.length === 25, '15 blur + 10 independent games');
assert(CATEGORY_LAYOUT[15] === 'speed_card', 'category 16 is Speed Card');
assert(CATEGORY_LAYOUT[16] === 'count_quick', 'category 17 is Count Quick');
assert(CATEGORY_LAYOUT[17] === 'lost_item', 'category 18 is Lost Item');
assert(CATEGORY_LAYOUT[18] === 'flip_mind', 'category 19 is Flip Mind');
assert(CATEGORY_LAYOUT[19] === 'gold_rush', 'category 20 is Gold Rush');
assert(CATEGORY_LAYOUT[20] === 'tick_lock', 'category 21 is Tick Lock');
assert(CATEGORY_LAYOUT[21] === 'twin_link', 'category 22 is Twin Link');
assert(CATEGORY_LAYOUT[22] === 'neon_flash', 'category 23 is Neon Flash');
assert(CATEGORY_LAYOUT[23] === 'glitch_spy', 'category 24 is Glitch Spy');
assert(CATEGORY_LAYOUT[24] === 'color_trap', 'category 25 is Color Trap');
for (const category of BLUR_CATEGORIES) {
  assert(gameIdForCategory(category) === 'guess-ai', `${category} must settle as guess-ai`);
}
assert(gameIdForCategory('speed_card') === 'speed-card', 'speed card maps');
assert(gameIdForCategory('count_quick') === 'count-quick', 'count quick maps');
assert(gameIdForCategory('lost_item') === 'lost-item', 'lost item maps');
assert(gameIdForCategory('flip_mind') === 'flip_mind', 'flip mind maps');
assert(gameIdForCategory('gold_rush') === 'gold_rush', 'gold rush maps');
assert(gameIdForCategory('tick_lock') === 'tick_lock', 'tick lock maps');
assert(gameIdForCategory('twin_link') === 'twin_link', 'twin link maps');
assert(gameIdForCategory('neon_flash') === 'neon_flash', 'neon flash maps');
assert(gameIdForCategory('glitch_spy') === 'glitch_spy', 'glitch spy maps');
assert(gameIdForCategory('color_trap') === 'color_trap', 'color trap maps');
assert(getGameConfig('lost-item').baseReward === 25, 'lost-item baseReward 25');
assert(!(NEW_GAME_IDS as readonly string[]).includes('angle-spotter'), 'angle-spotter was replaced');
assert((NEW_GAME_IDS as readonly string[]).includes('lost-item'), 'lost-item replaced angle-spotter');
assert(!(NEW_GAME_IDS as readonly string[]).includes('shadow-match'), 'shadow-match was replaced');
assert((NEW_GAME_IDS as readonly string[]).includes('gold_rush'), 'gold_rush replaced shadow-match');
assert((NEW_GAME_IDS as readonly string[]).includes('twin_link'), 'twin_link replaced odd-one-out');
assert((NEW_GAME_IDS as readonly string[]).includes('tick_lock'), 'tick_lock replaced size-compare');
assert((NEW_GAME_IDS as readonly string[]).includes('flip_mind'), 'flip_mind replaced fragment-unify');
assert((NEW_GAME_IDS as readonly string[]).includes('neon_flash'), 'neon_flash replaced emotion-match');
assert((NEW_GAME_IDS as readonly string[]).includes('glitch_spy'), 'glitch_spy replaced logic-chain');
assert((NEW_GAME_IDS as readonly string[]).includes('color_trap'), 'color_trap replaced timeline-builder');

assert(MINIGAME_RAW_CONFIGS.length === 9, '9 confirmed new minigame configs');
assert(NEW_GAME_IDS.length === 9, '9 new game ids');
assert(
  !(NEW_GAME_IDS as readonly string[]).includes('speed-card'),
  'speed-card is not a new-game id',
);
assert(
  MINIGAME_RAW_CONFIGS.every((config) => config.gameId !== 'speed-card'),
  'speed-card is not a new-game slot',
);
for (const config of MINIGAME_RAW_CONFIGS) {
  assert(config.models.length === 5 * CHALLENGE_SLOT_COUNT, `${config.gameId} must have 50 models`);
  assert(config.difficulties['extra-hard'].open === false, `${config.gameId} extra-hard locked`);
}

assert(STAMINA_PER_GAME === 10, 'stamina cost 10');
assert(STAMINA_AD_REWARD === 10 && STAMINA_ADS_PER_DAY === 5, 'lobby ads 5x10');
assert(IN_GAME_RETRY_ADS_PER_DAY === 5, 'in-game retry ads 5/day global');
assert(
  (STAMINA_ADS_PER_DAY + IN_GAME_RETRY_ADS_PER_DAY) * STAMINA_AD_REWARD === 100,
  'lobby 50 + in-game 50 = 100 stamina/day from ads',
);
assert(
  STAMINA_UPGRADE_LEVELS.map((l) => l.cap).join(',') === '100,150,250,400',
  'stamina caps',
);
assert(STAMINA_UPGRADE_LEVELS.every((l) => l.refillIntervalMin === 12), 'regen 12 min');
assert(STAMINA_UPGRADE_LEVELS[1].gemCost === 50 && STAMINA_UPGRADE_LEVELS[1].coinCost === 25_000, 'L1 dual pay');
assert(STAMINA_UPGRADE_LEVELS[2].gemCost === 150 && STAMINA_UPGRADE_LEVELS[2].coinCost == null, 'L2 gems only');
assert(STAMINA_UPGRADE_LEVELS[3].gemCost === 250 && STAMINA_UPGRADE_LEVELS[3].coinCost == null, 'L3 gems only');
assert(getUpgradeGemCost(1, new Date().toISOString(), 0) === 50, 'L1 gem cost is 50');
assert(getMaxLevel() == null, 'global player level cap is unset');
assert(restartGate(10, 10, 0) === 'stamina', 'restart spends stamina when available');
assert(restartGate(0, 10, 0) === 'retry-ad', 'restart uses ad when empty');
assert(restartGate(0, 10, 5) === 'blocked', 'retry ads daily cap');

assert(GEM_GAMEPLAY_AMOUNT === 0, 'gameplay gems are 0');
assert(weeklyLeaderboardGems(1) === 50 && weeklyLeaderboardGems(10) === 1, 'weekly leaderboard gems');
assert(weeklyLeaderboardGems(11) === 0, 'rank 11 pays 0 gems');

const reward = calculateReward({ gameId: 'guess-ai', event: 'CORRECT', playerLevel: 1 });
assert(reward.xp > 0 && reward.coins > 0, 'guess-ai CORRECT pays');
assert(!('gems' in reward), 'reward engine does not emit gems');

console.log('master architecture smoke ok');
