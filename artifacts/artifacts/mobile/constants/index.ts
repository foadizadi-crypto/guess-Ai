import type { ShopItem, Avatar, LeaderboardEntry, PowerUpId, PowerUpInventory } from '@/types';
import { POWER_UP_PRICES } from '@/constants/economy';

// ─── Game rules ────────────────────────────────────────────────────────────

export const GAME_CONSTANTS = {
  MAX_BLUR: 20,
  MIN_BLUR: 0,
  BLUR_REDUCTION_PER_HINT: 4,
  TOTAL_QUESTIONS: 20,
  TIMER: 120,
  TIMER_EASY: 120,
  TIMER_MEDIUM: 120,
  TIMER_HARD: 120,
  MAX_HINTS: 3,
  SCORE_BASE: 1000,
  SCORE_HINT_PENALTY: 200,
  SCORE_TIME_BONUS_MAX: 200,
  COINS_PER_WIN: 50,
  HINT_COST_COINS: 10,
  XP_PER_WIN: 100,
  // XP_PER_LEVEL kept for backward compat but level logic now uses economy.ts formula
  XP_PER_LEVEL: 1000,
  DAILY_REWARD_BASE: 100,
  DAILY_REWARD_STREAK_BONUS: 50,
} as const;

// ─── Categories ────────────────────────────────────────────────────────────

export const CATEGORIES = [
  'animals',
  'nature',
  'food',
  'landmarks',
  'cities',
  'sports',
  'movies',
  'technology',
  'art',
  'vehicles',
  'celebrities',
  'history',
  'space',
  'music',
  'science',
] as const;

// ─── Default avatars ───────────────────────────────────────────────────────

export const DEFAULT_AVATARS: Avatar[] = [
  { id: 'avatar_1',  name: 'Abigail', imageKey: 'abigail', unlocked: true,  cost: 0,    rarity: 'Common',    ability: 'Balanced start',                abilityKey: 'alpha'       },
  { id: 'avatar_2',  name: 'Chlöe',   imageKey: 'chloe',   unlocked: false, cost: 200,  rarity: 'Common',    ability: '+5 seconds at the start',        abilityKey: 'time-master' },
  { id: 'avatar_3',  name: 'Daveigh', imageKey: 'daveigh', unlocked: false, cost: 350,  rarity: 'Rare',      ability: '+25% XP earned',                 abilityKey: 'xp-sage'     },
  { id: 'avatar_4',  name: 'Haley',   imageKey: 'haley',   unlocked: false, cost: 500,  rarity: 'Rare',      ability: '+2 points per correct answer',    abilityKey: 'visionary'   },
  { id: 'avatar_5',  name: 'Heather', imageKey: 'heather', unlocked: false, cost: 650,  rarity: 'Epic',      ability: 'Protected from interruptions',    abilityKey: 'ad-shield'   },
  { id: 'avatar_6',  name: 'Kirsten', imageKey: 'kirsten', unlocked: false, cost: 800,  rarity: 'Epic',      ability: 'Chance for bonus coins',          abilityKey: 'lucky-charm' },
  { id: 'avatar_7',  name: 'Linda',   imageKey: 'linda',   unlocked: false, cost: 950,  rarity: 'Epic',      ability: 'Faster answer streak bonuses',    abilityKey: 'speed-demon' },
  { id: 'avatar_8',  name: 'Marilyn', imageKey: 'marilyn', unlocked: false, cost: 1100, rarity: 'Epic',      ability: '+25% coins from games',           abilityKey: 'coin-magnet' },
  { id: 'avatar_9',  name: 'Patty',   imageKey: 'patty',   unlocked: false, cost: 1300, rarity: 'Legendary', ability: 'Starts with +20% clarity',        abilityKey: 'blur-buster' },
  { id: 'avatar_10', name: 'Sissy',   imageKey: 'sissy',   unlocked: false, cost: 1600, rarity: 'Legendary', ability: 'One answer hint each game',       abilityKey: 'ai-oracle'   },
];

// ─── Storage keys ──────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  USER_DATA: '@blurquiz/user_data',
  GAME_SETTINGS: '@blurquiz/game_settings',
  LEADERBOARD: '@blurquiz/leaderboard',
  ONBOARDING_DONE: '@blurquiz/onboarding_done',
} as const;

export const SECURE_STORE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USERNAME: 'username',
} as const;

// ─── Shop items ────────────────────────────────────────────────────────────

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'hint_pack_1',
    name: '3 Hints',
    description: 'Get 3 extra hints for tough images',
    cost: 50,
    type: 'hint',
    quantity: 3,
    iconKey: 'hint',
  },
  {
    id: 'hint_pack_2',
    name: '10 Hints',
    description: 'Bulk hint pack — best value',
    cost: 150,
    type: 'hint',
    quantity: 10,
    iconKey: 'hint',
  },
  {
    id: 'remove_ads',
    name: 'Remove Ads',
    description: 'Play without any interruptions',
    cost: 500,
    type: 'removeAds',
    quantity: 1,
    iconKey: 'star',
  },
];

// ─── Power-ups — prices from economy.ts ───────────────────────────────────
// Prices are read from economy.ts; only name/description/icon live here.

export const POWER_UPS: Array<{
  id: PowerUpId;
  name: string;
  description: string;
  cost: number;
  icon: string;
}> = [
  {
    id: 'hint',
    name: 'Hint',
    description: 'Shows the first letter of the answer',
    cost: POWER_UP_PRICES['hint'],
    icon: 'bulb-outline',
  },
  {
    id: 'reveal-blur',
    name: 'Reveal Blur',
    description: 'Removes one blur layer instantly',
    cost: POWER_UP_PRICES['reveal-blur'],
    icon: 'eye-outline',
  },
  {
    id: 'skip-question',
    name: 'Skip Question',
    description: 'Move past a tricky image with no XP penalty',
    cost: POWER_UP_PRICES['skip-question'],
    icon: 'play-skip-forward-outline',
  },
  {
    id: 'double-xp',
    name: 'Double XP',
    description: 'Double XP earned for the next 30 minutes',
    cost: POWER_UP_PRICES['double-xp'],
    icon: 'flash-outline',
  },
];

// ─── Coin packages — spec pricing ─────────────────────────────────────────

export const COIN_PACKAGES = [
  { id: 'coins-100',  amount:  100, price: '$0.99' },
  { id: 'coins-500',  amount:  600, price: '$4.99' },
  { id: 'coins-1200', amount: 1500, price: '$9.99' },
  { id: 'coins-2500', amount: 3500, price: '$19.99' },
] as const;

// ─── Mock leaderboard ──────────────────────────────────────────────────────

const LEADERBOARD_NAMES = [
  'Aria', 'Marco', 'Lena', 'Josh', 'Yuki', 'Sam', 'Noah', 'Priya', 'Leo', 'Chloe',
  'Maya', 'Owen', 'Zara', 'Kai', 'Nora', 'Milo', 'Iris', 'Theo', 'Ava', 'Eli',
  'Sofia', 'Finn', 'Luca', 'Mina', 'Ezra', 'Ruby', 'Adam', 'Nia', 'Remy', 'Tara',
  'Juno', 'Max', 'Lily', 'Omar', 'Cleo', 'Ravi', 'Belle', 'Jonah', 'Skye', 'Wren',
  'Nova', 'Alex', 'Sage', 'Mia', 'Ben', 'Kira', 'Zane', 'Elle', 'Drew', 'Lola',
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = LEADERBOARD_NAMES.map((username, index) => ({
  rank: index + 1,
  userId: `u${index + 1}`,
  username,
  score: Math.max(650, 9850 - index * 177 + (index % 4) * 31),
  avatarId: `avatar_${(index % 10) + 1}`,
  level: Math.max(2, 15 - Math.floor(index / 4)),
}));

// ─── Daily rewards — spec schedule ────────────────────────────────────────
// Cycle: days 1-7 repeat. Milestones (14, 30) fire on those exact streak days.

export const DAILY_REWARDS = [
  { day: 1, label: '15 coins',        coins: 15,  icon: 'logo-bitcoin'  as const },
  { day: 2, label: '30 coins',        coins: 30,  icon: 'logo-bitcoin'  as const },
  { day: 3, label: '30 coins + Hint', coins: 30,  icon: 'bulb-outline'  as const },
  { day: 4, label: '60 coins',        coins: 60,  icon: 'logo-bitcoin'  as const },
  { day: 5, label: '80 coins',        coins: 80,  icon: 'logo-bitcoin'  as const },
  { day: 6, label: '100 coins',       coins: 100, icon: 'logo-bitcoin'  as const },
  { day: 7, label: '150 coins + Reveal', coins: 150, icon: 'gift-outline' as const },
] as const;

// ─── Default power-up inventory ────────────────────────────────────────────

export const DEFAULT_POWER_UPS: PowerUpInventory = {
  'hint': 3,           // starter pack: 3 hints
  'reveal-blur': 3,    // starter pack: 3 reveals
  'skip-question': 0,
  'double-xp': 0,
};

// ─── Achievements — re-exported from dedicated module ─────────────────────────
export { ACHIEVEMENTS } from '@/constants/achievements';
export type { AchievementDef, AchievementCheckContext } from '@/constants/achievements';
export { checkAchievementCondition } from '@/constants/achievements';
