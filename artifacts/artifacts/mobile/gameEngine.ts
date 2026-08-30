import type { Difficulty, Question } from '@/types';
import { GAME_CONFIG } from '@/constants/gameConfig';

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

/** How much the reveal % changes per answer (one-image-per-round model).
 *  Correct: easy +5 / medium +3 / hard +1 clarity.
 *  Wrong:   easy −1 / medium −3 / hard −5 clarity.
 *  Values come from GAME_CONFIG so remote config overrides apply automatically.
 */
export const getRevealDelta = (difficulty: Difficulty, correct: boolean): number => {
  const c = GAME_CONFIG;
  if (correct) {
    return difficulty === 'hard'   ? c.clarity_correct_hard   :
           difficulty === 'medium' ? c.clarity_correct_medium :
                                     c.clarity_correct_easy;
  }
  const penalty =
    difficulty === 'hard'   ? c.clarity_wrong_hard   :
    difficulty === 'medium' ? c.clarity_wrong_medium :
                              c.clarity_wrong_easy;
  return -penalty;
};

export const getStartingTime = (ability: AvatarAbility): number => 120 + (ability === 'time-master' ? 5 : 0);

export const calculateAnswerScore = (
  difficulty: Difficulty,
  timeRemaining: number,
  ability: AvatarAbility,
  streak = 0,
): number => {
  const base = 10 * DIFFICULTY_CONFIG[difficulty].multiplier;
  const timeBonus = Math.min(5, Math.floor(timeRemaining / 30));
  const abilityBonus = ability === 'visionary' ? 2 : 0;
  // +1 bonus point per 3 consecutive correct answers (combo)
  const streakBonus = Math.floor(streak / 3);
  return base + timeBonus + abilityBonus + streakBonus;
};

export const getTimerColor = (seconds: number): string => {
  if (seconds < 30) return '#FF1744';
  if (seconds < 60) return '#FFD700';
  return '#FFFFFF';
};

/** Fisher-Yates shuffle. Returns new options array and the updated correctIndex. */
export const shuffleOptions = (question: Question): { options: string[]; correctIndex: number } => {
  const correct = question.options[question.correctIndex] ?? question.options[0];
  const shuffled = [...question.options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return { options: shuffled, correctIndex: shuffled.indexOf(correct) };
};