/**
 * Achievement definitions — single source of truth.
 * Contains the achievement pool, display metadata, rewards, and condition checkers.
 */
import type { UserStatistics, Avatar } from '@/types';

// ─── Definitions ──────────────────────────────────────────────────────────────

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  rewardCoins: number;
  rewardXP: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-win',
    title: 'First Win',
    description: 'Win your very first game',
    icon: 'trophy-outline',
    color: '#FFD700',
    rewardCoins: 50,
    rewardXP: 100,
  },
  {
    id: 'sharp-eye',
    title: 'Sharp Eye',
    description: 'Get 10 correct answers total',
    icon: 'eye-outline',
    color: '#64B5F6',
    rewardCoins: 30,
    rewardXP: 75,
  },
  {
    id: 'streak-master',
    title: 'Streak Master',
    description: 'Reach a 7-answer combo streak',
    icon: 'flame-outline',
    color: '#FF6B35',
    rewardCoins: 75,
    rewardXP: 150,
  },
  {
    id: 'collector',
    title: 'Collector',
    description: 'Unlock 5 different avatars',
    icon: 'people-outline',
    color: '#CE93D8',
    rewardCoins: 100,
    rewardXP: 200,
  },
  {
    id: 'high-roller',
    title: 'High Roller',
    description: 'Earn 1,000 coins in total',
    icon: 'cash-outline',
    color: '#00E676',
    rewardCoins: 200,
    rewardXP: 300,
  },
  {
    id: 'quiz-veteran',
    title: 'Quiz Veteran',
    description: 'Complete 25 games',
    icon: 'medal-outline',
    color: '#FFD700',
    rewardCoins: 150,
    rewardXP: 250,
  },
  {
    id: 'perfect-game',
    title: 'Perfect Game',
    description: 'Score 20/20 correct in a single game',
    icon: 'star-outline',
    color: '#FFD700',
    rewardCoins: 300,
    rewardXP: 500,
  },
  {
    id: 'combo-king',
    title: 'Combo King',
    description: 'Reach a 12-answer Ultra Combo',
    icon: 'flash-outline',
    color: '#00BFFF',
    rewardCoins: 100,
    rewardXP: 200,
  },
  {
    id: 'century',
    title: 'Century',
    description: 'Answer 100 questions correctly',
    icon: 'checkmark-circle-outline',
    color: '#A5D6A7',
    rewardCoins: 200,
    rewardXP: 400,
  },
  {
    id: 'dedicated',
    title: 'Dedicated',
    description: 'Play 7 days in a row',
    icon: 'calendar-outline',
    color: '#FF8A65',
    rewardCoins: 250,
    rewardXP: 500,
  },
];

// ─── Condition checker ────────────────────────────────────────────────────────

export interface AchievementCheckContext {
  stats: UserStatistics;
  avatars: Pick<Avatar, 'unlocked'>[];
  isPerfectGame?: boolean;
  maxComboThisGame?: number;
}

export function checkAchievementCondition(
  id: string,
  ctx: AchievementCheckContext,
): boolean {
  const { stats, avatars, isPerfectGame, maxComboThisGame } = ctx;
  switch (id) {
    case 'first-win':     return stats.totalWins >= 1;
    case 'sharp-eye':     return stats.totalCorrectAnswers >= 10;
    case 'streak-master': return stats.longestStreak >= 7;
    case 'collector':     return avatars.filter((a) => a.unlocked).length >= 5;
    case 'high-roller':   return stats.totalCoinsEarned >= 1000;
    case 'quiz-veteran':  return stats.totalGamesPlayed >= 25;
    case 'perfect-game':  return !!isPerfectGame;
    case 'combo-king':
      return stats.longestStreak >= 12 || (maxComboThisGame ?? 0) >= 12;
    case 'century':       return stats.totalCorrectAnswers >= 100;
    case 'dedicated':     return (stats.currentStreak ?? 0) >= 7;
    default:              return false;
  }
}
