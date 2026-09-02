// ─── Domain types ──────────────────────────────────────────────────────────

export type GameplayDifficulty = 'easy' | 'medium' | 'hard';
export type Difficulty = GameplayDifficulty | 'extra-hard' | 'max';

export type Category =
  | 'nature'
  | 'animals'
  | 'food'
  | 'landmarks'
  | 'technology'
  | 'art'
  | 'vehicles'
  | 'celebrities'
  | 'history'
  | 'space'
  | 'cities'
  | 'sports'
  | 'movies'
  | 'music'
  | 'science'
  | 'speed_card'
  | 'count_quick'
  | 'lost_item';

export type SessionOutcome = 'perfect' | 'win' | 'lose';

export type AppScreen =
  | 'splash'
  | 'onboarding'
  | 'login'
  | 'lobby'
  | 'levelSelect'
  | 'categorySelect'
  | 'game'
  | 'result'
  | 'shop'
  | 'leaderboard'
  | 'profile'
  | 'dailyReward'
  | 'settings';

export type Language = 'en' | 'fa' | 'ar' | 'tr';

// ─── Game ──────────────────────────────────────────────────────────────────

export interface GameSession {
  id: string;
  difficulty: Difficulty;
  category: Category;
  score: number;
  startTime: number;
  endTime: number | null;
  isComplete: boolean;
  questionsAnswered: number;
  hintsUsed: number;
}

export interface Question {
  id: string;
  imageUrl: string | null;
  answer: string;
  options: string[];
  correctIndex: number;
  funFact: string;
  hints: string[];
  category: Category;
  difficulty: Difficulty;
  blurLevel: number;
}

// ─── User ──────────────────────────────────────────────────────────────────

export interface Avatar {
  id: string;
  name: string;
  imageKey: string;
  unlocked: boolean;
  cost: number;                  // kept for backward-compat; always 0 for level-unlock avatars
  rarity?: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  ability?: string;
  abilityKey?: string;
  unlockLevel?: number;          // required level to auto-unlock (undefined = default or achievement)
  unlockCondition?: string;      // human-readable unlock hint shown in gallery
}

export interface UserStatistics {
  totalGamesPlayed: number;
  totalWins: number;
  totalCoinsEarned: number;
  bestScore: number;
  currentStreak: number;
  longestStreak: number;
  totalCorrectAnswers: number;
  hardGamesPlayed: number;
  favoriteCategory: Category | null;
}

export interface DailyReward {
  lastClaimed: string | null;
  lastClaimDate?: string | null;
  streak: number;
  currentDay?: number;
  nextRewardAmount: number;
}

export interface UserSettings {
  language: Language;
  notifications: boolean;
  vibration: boolean;
  theme: 'dark';
}

// ─── Unified Shop (Phase 1 — §2 Item System) ──────────────────────────────

export type ItemCategory = 'consumable' | 'cosmetic' | 'collectible';
export type ItemRarity   = 'common' | 'rare' | 'epic' | 'legendary';
export type ShopCurrencyType = 'coins' | 'gems';
export type UnlockType   = 'shop' | 'level' | 'achievement' | 'event' | 'season' | 'special';

/** Canonical data-driven item structure. All shop items follow this shape. */
export interface UnifiedShopItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ItemCategory;
  rarity: ItemRarity;
  currencyType: ShopCurrencyType;
  price: number;
  unlockType: UnlockType;
  /** Runtime state — derived from store, never stored in config */
  owned?: boolean;
  equipped?: boolean;
}

// ─── Shop ──────────────────────────────────────────────────────────────────

export type PowerUpId = 'hint' | 'reveal-blur' | 'skip-question' | 'double-xp';

export type ShopItemType = 'hint' | 'avatar' | 'powerup' | 'removeAds';

export interface PowerUpInventory {
  'hint': number;
  'reveal-blur': number;
  'skip-question': number;
  'double-xp': number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color?: string;
  rewardCoins?: number;
  rewardXP?: number;
  unlocked?: boolean;
  unlockedAt?: string | null;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: ShopItemType;
  quantity: number;
  iconKey: string;
}

// ─── Missions ─────────────────────────────────────────────────────────────

export type MissionType =
  | 'play_games'
  | 'correct_answers'
  | 'complete_hard'
  | 'get_combo'
  | 'perfect_game'
  | 'use_powerup'
  | 'play_category';

export interface ActiveMission {
  id: string;
  type: MissionType;
  label: string;
  description: string;
  target: number;
  progress: number;
  reward: number;
  completed: boolean;
  rewardClaimed: boolean;
  param?: string;
}

// ─── Level rewards ────────────────────────────────────────────────────────

export interface LevelUpResult {
  newLevel: number;
  coinsAwarded: number;
  items: Array<{ type: string; id: string; label: string }>;
}

// ─── Leaderboard ───────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  avatarId: string;
  level: number;
}
