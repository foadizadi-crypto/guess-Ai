// ─── Domain types ──────────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard';

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
  | 'science';

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

export type Language = 'en' | 'fa';

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
  imageUrl: string;
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
  cost: number;
  rarity?: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  ability?: string;
  abilityKey?: string;
}

export interface UserStatistics {
  totalGamesPlayed: number;
  totalWins: number;
  totalCoinsEarned: number;
  bestScore: number;
  currentStreak: number;
  longestStreak: number;
  totalCorrectAnswers: number;
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

// ─── Shop ──────────────────────────────────────────────────────────────────

export type PowerUpId = 'extra-time' | 'fifty-fifty' | 'skip-question' | 'double-coins';

export type ShopItemType = 'hint' | 'avatar' | 'powerup' | 'removeAds';

export interface PowerUpInventory {
  'extra-time': number;
  'fifty-fifty': number;
  'skip-question': number;
  'double-coins': number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
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

// ─── Leaderboard ───────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  avatarId: string;
  level: number;
}
