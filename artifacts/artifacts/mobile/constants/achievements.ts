/**
 * achievements.ts — Achievement definitions (Phase 3 extended)
 *
 * Single source of truth for all achievement data, rewards, and condition logic.
 * Add / edit entries here — no changes to core game logic required.
 */
import type { UserStatistics } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AchievementCategory = 'beginner' | 'skill' | 'progress' | 'collection';
export type AchievementRarity   = 'common' | 'rare' | 'epic' | 'legendary';
export type AchievementConditionType =
  | 'wins'
  | 'correctAnswers'
  | 'comboStreak'
  | 'gamesPlayed'
  | 'coinsEarned'
  | 'avatarsUnlocked'
  | 'dailyStreak'
  | 'perfectGame'
  | 'cosmeticsOwned'
  | 'perfectCombo';  // maxComboThisGame >= conditionValue

export interface AchievementDef {
  id:               string;
  title:            string;
  description:      string;
  category:         AchievementCategory;
  rarity:           AchievementRarity;
  conditionType:    AchievementConditionType;
  conditionValue:   number;
  icon:             string;
  color:            string;
  rewardCoins:      number;
  rewardXP:         number;
  /** Only set for legendary achievements */
  rewardGems?:      number;
  rewardCosmeticId?: string;
}

// ─── Reward table ─────────────────────────────────────────────────────────────
// Common: 100 coins / 50 XP
// Rare:   500 coins / 200 XP
// Epic:   1000 coins / 500 XP
// Legendary: exclusive cosmetic (no gems — gems are Shop IAP + spin jackpot only)

// ─── Definitions ──────────────────────────────────────────────────────────────

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Beginner ─────────────────────────────────────────────────────────────

  {
    id:             'first-win',
    title:          'First Win',
    description:    'Win your very first game',
    category:       'beginner',
    rarity:         'common',
    conditionType:  'wins',
    conditionValue: 1,
    icon:           'trophy-outline',
    color:          '#FFD700',
    rewardCoins:    100,
    rewardXP:       50,
  },
  {
    id:             'perfect-game',
    title:          'First Perfect Game',
    description:    'Get a perfect score in a single game',
    category:       'beginner',
    rarity:         'common',
    conditionType:  'perfectGame',
    conditionValue: 1,
    icon:           'star-outline',
    color:          '#FFD700',
    rewardCoins:    100,
    rewardXP:       50,
  },
  {
    id:             'first-combo',
    title:          'First Combo',
    description:    'Chain 3 correct answers in a row',
    category:       'beginner',
    rarity:         'common',
    conditionType:  'perfectCombo',
    conditionValue: 3,
    icon:           'git-merge-outline',
    color:          '#A5D6A7',
    rewardCoins:    100,
    rewardXP:       50,
  },

  // ── Skill ─────────────────────────────────────────────────────────────────

  {
    id:             'sharp-eye',
    title:          'Sharp Eye',
    description:    'Get 10 correct answers total',
    category:       'skill',
    rarity:         'common',
    conditionType:  'correctAnswers',
    conditionValue: 10,
    icon:           'eye-outline',
    color:          '#64B5F6',
    rewardCoins:    100,
    rewardXP:       50,
  },
  {
    id:             'combo-king',
    title:          'Combo King',
    description:    'Reach a 12-answer Ultra Combo',
    category:       'skill',
    rarity:         'epic',
    conditionType:  'perfectCombo',
    conditionValue: 12,
    icon:           'flash-outline',
    color:          '#00BFFF',
    rewardCoins:    1000,
    rewardXP:       500,
  },
  {
    id:             'blur-master',
    title:          'Blur Master',
    description:    'Answer 200 questions correctly',
    category:       'skill',
    rarity:         'legendary',
    conditionType:  'correctAnswers',
    conditionValue: 200,
    icon:           'infinite-outline',
    color:          '#FF1744',
    rewardCoins:    0,
    rewardXP:       0,
    rewardCosmeticId: 'frame_cosmic',
  },
  {
    id:             'hard-mode-master',
    title:          'Hard Mode Master',
    description:    'Complete 10 games without skipping',
    category:       'skill',
    rarity:         'epic',
    conditionType:  'gamesPlayed',
    conditionValue: 10,
    icon:           'barbell-outline',
    color:          '#EF5350',
    rewardCoins:    1000,
    rewardXP:       500,
  },
  {
    id:             'streak-master',
    title:          'Streak Master',
    description:    'Reach a 7-answer combo streak',
    category:       'skill',
    rarity:         'rare',
    conditionType:  'comboStreak',
    conditionValue: 7,
    icon:           'flame-outline',
    color:          '#FF6B35',
    rewardCoins:    500,
    rewardXP:       200,
  },

  // ── Progress ──────────────────────────────────────────────────────────────

  {
    id:             'quiz-veteran',
    title:          'Quiz Veteran',
    description:    'Complete 25 games',
    category:       'progress',
    rarity:         'rare',
    conditionType:  'gamesPlayed',
    conditionValue: 25,
    icon:           'medal-outline',
    color:          '#FFD700',
    rewardCoins:    500,
    rewardXP:       200,
  },
  {
    id:             'century',
    title:          'Century',
    description:    'Answer 100 questions correctly',
    category:       'progress',
    rarity:         'rare',
    conditionType:  'correctAnswers',
    conditionValue: 100,
    icon:           'checkmark-circle-outline',
    color:          '#A5D6A7',
    rewardCoins:    500,
    rewardXP:       200,
  },
  {
    id:             'dedicated',
    title:          'Dedicated',
    description:    'Play 7 days in a row',
    category:       'progress',
    rarity:         'rare',
    conditionType:  'dailyStreak',
    conditionValue: 7,
    icon:           'calendar-outline',
    color:          '#FF8A65',
    rewardCoins:    500,
    rewardXP:       200,
  },
  {
    id:             'high-roller',
    title:          'High Roller',
    description:    'Earn 1,000 coins in total',
    category:       'progress',
    rarity:         'common',
    conditionType:  'coinsEarned',
    conditionValue: 1000,
    icon:           'cash-outline',
    color:          '#00E676',
    rewardCoins:    100,
    rewardXP:       50,
  },

  // ── Collection ────────────────────────────────────────────────────────────

  {
    id:             'first-cosmetic',
    title:          'First Cosmetic',
    description:    'Unlock your first cosmetic item',
    category:       'collection',
    rarity:         'common',
    conditionType:  'cosmeticsOwned',
    conditionValue: 1,
    icon:           'color-palette-outline',
    color:          '#CE93D8',
    rewardCoins:    100,
    rewardXP:       50,
  },
  {
    id:             'collector',
    title:          'Collector',
    description:    'Unlock 5 different avatars',
    category:       'collection',
    rarity:         'rare',
    conditionType:  'avatarsUnlocked',
    conditionValue: 5,
    icon:           'people-outline',
    color:          '#CE93D8',
    rewardCoins:    500,
    rewardXP:       200,
  },
  {
    id:             'rare-hunter',
    title:          'Rare Hunter',
    description:    'Own 5 cosmetic items',
    category:       'collection',
    rarity:         'rare',
    conditionType:  'cosmeticsOwned',
    conditionValue: 5,
    icon:           'search-outline',
    color:          '#FF7043',
    rewardCoins:    500,
    rewardXP:       200,
  },
];

// ─── Condition checker ────────────────────────────────────────────────────────

export interface AchievementCheckContext {
  stats:              UserStatistics;
  avatars:            Array<{ unlocked: boolean }>;
  ownedCosmeticsCount: number;
  isPerfectGame?:     boolean;
  maxComboThisGame?:  number;
  dailyLoginStreak?:  number;
}

export function checkAchievementCondition(
  id:  string,
  ctx: AchievementCheckContext,
): boolean {
  const { stats, avatars, ownedCosmeticsCount, isPerfectGame, maxComboThisGame, dailyLoginStreak } = ctx;
  switch (id) {
    // Beginner
    case 'first-win':        return stats.totalWins >= 1;
    case 'perfect-game':     return !!isPerfectGame;
    case 'first-combo':      return stats.longestStreak >= 3 || (maxComboThisGame ?? 0) >= 3;
    // Skill
    case 'sharp-eye':        return stats.totalCorrectAnswers >= 10;
    case 'combo-king':       return stats.longestStreak >= 12 || (maxComboThisGame ?? 0) >= 12;
    case 'blur-master':      return stats.totalCorrectAnswers >= 200;
    case 'hard-mode-master': return stats.hardGamesPlayed >= 10;
    case 'streak-master':    return stats.longestStreak >= 7 || (maxComboThisGame ?? 0) >= 7;
    // Progress
    case 'quiz-veteran':     return stats.totalGamesPlayed >= 25;
    case 'century':          return stats.totalCorrectAnswers >= 100;
    case 'dedicated':        return (ctx.dailyLoginStreak ?? stats.currentStreak ?? 0) >= 7;
    case 'high-roller':      return stats.totalCoinsEarned >= 1000;
    // Collection
    case 'first-cosmetic':   return ownedCosmeticsCount >= 1;
    case 'collector':        return avatars.filter((a) => a.unlocked).length >= 5;
    case 'rare-hunter':      return ownedCosmeticsCount >= 5;
    default:                 return false;
  }
}
