import type { Difficulty, Question } from '@/types';

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; blurPercent: number; multiplier: number; hints: number; color: string }
> = {
  easy: { label: 'Easy', blurPercent: 50, multiplier: 1, hints: 2, color: '#00E676' },
  medium: { label: 'Medium', blurPercent: 80, multiplier: 2, hints: 1, color: '#FFB300' },
  hard: { label: 'Hard', blurPercent: 100, multiplier: 3, hints: 0, color: '#FF1744' },
};

export type AvatarAbility =
  | 'alpha'
  | 'time-master'
  | 'xp-sage'
  | 'visionary'
  | 'blur-buster'
  | 'ad-shield'
  | 'ai-oracle'
  | 'lucky-charm'
  | 'speed-demon'
  | 'coin-magnet';

export const getAvatarAbility = (avatarId: string): AvatarAbility => {
  const abilities: Record<string, AvatarAbility> = {
    avatar_1: 'alpha',
    avatar_2: 'time-master',
    avatar_3: 'xp-sage',
    avatar_4: 'visionary',
    avatar_5: 'ad-shield',
    avatar_6: 'lucky-charm',
    avatar_7: 'speed-demon',
    avatar_8: 'coin-magnet',
    avatar_9: 'blur-buster',
    avatar_10: 'ai-oracle',
  };
  return abilities[avatarId] ?? 'time-master';
};

export const getStartingClarity = (difficulty: Difficulty, ability: AvatarAbility): number =>
  Math.min(100, 100 - DIFFICULTY_CONFIG[difficulty].blurPercent + (ability === 'blur-buster' ? 20 : 0));

export const getStartingTime = (ability: AvatarAbility): number => 120 + (ability === 'time-master' ? 5 : 0);

export const calculateAnswerScore = (
  difficulty: Difficulty,
  timeRemaining: number,
  ability: AvatarAbility,
): number => {
  const base = 10 * DIFFICULTY_CONFIG[difficulty].multiplier;
  const timeBonus = Math.min(5, Math.floor(timeRemaining / 30));
  const abilityBonus = ability === 'visionary' ? 2 : 0;
  return base + timeBonus + abilityBonus;
};

export const getTimerColor = (seconds: number): string => {
  if (seconds < 30) return '#FF1744';
  if (seconds < 60) return '#FFD700';
  return '#FFFFFF';
};

export const shuffleOptions = (question: Question): string[] => [...question.options];