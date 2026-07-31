import { create } from 'zustand';
import type { AppScreen, Category, Difficulty, GameSession } from '@/types';
import { GAME_CONSTANTS } from '@/constants';
import { DIFFICULTY_CONFIG, getStartingClarity, getStartingTime, getAvatarAbility, getRevealDelta } from '@/gameEngine';
import { useUserStore } from '@/store/userStore';
import { generateId } from '@/utils';
import { getDifficultyXP, getComboBonus, XP_WRONG } from '@/constants/economy';

// ─── State shape ──────────────────────────────────────────────────────────

interface GameState {
  // Navigation
  currentScreen: AppScreen;

  // Session selection
  selectedDifficulty: Difficulty;
  selectedCategory: Category;

  // In-game state
  timer: number;
  score: number;
  blurAmount: number;
  hintsUsed: number;
  isTimerRunning: boolean;
  gameSession: GameSession | null;
  currentQuestionIndex: number;
  correctAnswers: number;
  totalQuestions: number;
  clarity: number;
  xpEarned: number;        // accumulates per-question XP + combo during a session
  coinsEarned: number;     // accumulates 1 coin per correct answer during a session
  doubleXPActive: boolean;
  lastGameWasTimedOut: boolean;
  streak: number;          // consecutive correct answers in this session
  consecutiveWrong: number;
  totalWrong: number;
  maxStreakThisGame: number; // highest streak reached in this game session

  // ─── Actions ────────────────────────────────────────────────────────────

  setCurrentScreen: (screen: AppScreen) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setCategory: (category: Category) => void;
  setTimer: (timer: number) => void;
  decrementTimer: () => void;
  setIsTimerRunning: (running: boolean) => void;
  setScore: (score: number) => void;
  incrementScore: (points: number) => void;
  setBlurAmount: (amount: number) => void;
  useHint: () => void;
  startSession: (difficulty: Difficulty, category: Category) => void;
  recordAnswer: (correct: boolean, points: number) => void;
  advanceQuestion: () => void;
  endSession: () => void;
  resetGame: () => void;
  activateDoubleXP: () => void;
}

const getTimerForDifficulty = (d: Difficulty): number => {
  if (d === 'easy') return GAME_CONSTANTS.TIMER_EASY;
  if (d === 'hard') return GAME_CONSTANTS.TIMER_HARD;
  return GAME_CONSTANTS.TIMER_MEDIUM;
};

const initialState = {
  currentScreen: 'splash' as AppScreen,
  selectedDifficulty: 'easy' as Difficulty,
  selectedCategory: 'animals' as Category,
  timer: GAME_CONSTANTS.TIMER_EASY,
  score: 0,
  blurAmount: GAME_CONSTANTS.MAX_BLUR,
  hintsUsed: 0,
  isTimerRunning: false,
  gameSession: null,
  currentQuestionIndex: 0,
  correctAnswers: 0,
  totalQuestions: GAME_CONSTANTS.TOTAL_QUESTIONS,
  clarity: 50,
  xpEarned: 0,
  coinsEarned: 0,
  doubleXPActive: false,
  lastGameWasTimedOut: false,
  streak: 0,
  consecutiveWrong: 0,
  totalWrong: 0,
  maxStreakThisGame: 0,
};

// ─── Store ────────────────────────────────────────────────────────────────

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setCurrentScreen: (screen) => set({ currentScreen: screen }),

  setDifficulty: (difficulty) =>
    set({ selectedDifficulty: difficulty, timer: getTimerForDifficulty(difficulty) }),

  setCategory: (category) => set({ selectedCategory: category }),

  setTimer: (timer) => set({ timer }),

  decrementTimer: () =>
    set((state) => ({ timer: Math.max(0, state.timer - 1) })),

  setIsTimerRunning: (running) => set({ isTimerRunning: running }),

  setScore: (score) => set({ score }),

  incrementScore: (points) =>
    set((state) => ({ score: state.score + points })),

  setBlurAmount: (amount) =>
    set({ blurAmount: Math.max(GAME_CONSTANTS.MIN_BLUR, Math.min(GAME_CONSTANTS.MAX_BLUR, amount)) }),

  useHint: () =>
    set((state) => ({
      hintsUsed: Math.min(state.hintsUsed + 1, GAME_CONSTANTS.MAX_HINTS),
      blurAmount: Math.max(0, state.blurAmount - GAME_CONSTANTS.BLUR_REDUCTION_PER_HINT),
    })),

  startSession: (difficulty, category) =>
    set(() => {
      const ability = getAvatarAbility(useUserStore.getState().selectedAvatarId);
      return {
        gameSession: {
          id: generateId(),
          difficulty,
          category,
          score: 0,
          startTime: Date.now(),
          endTime: null,
          isComplete: false,
          questionsAnswered: 0,
          hintsUsed: 0,
        },
        score: 0,
        hintsUsed: 0,
        blurAmount: GAME_CONSTANTS.MAX_BLUR - Math.round(getStartingClarity(difficulty, ability) / 5),
        timer: getStartingTime(ability),
        isTimerRunning: true,
        currentQuestionIndex: 0,
        correctAnswers: 0,
        totalQuestions: GAME_CONSTANTS.TOTAL_QUESTIONS,
        clarity: getStartingClarity(difficulty, ability),
        xpEarned: 0,
        coinsEarned: 0,
        doubleXPActive: false,
        lastGameWasTimedOut: false,
        streak: 0,
        consecutiveWrong: 0,
        totalWrong: 0,
        maxStreakThisGame: 0,
      };
    }),

  recordAnswer: (correct, points) =>
    set((state) => {
      const newStreak = correct ? state.streak + 1 : 0;
      const newConsecutiveWrong = correct ? 0 : state.consecutiveWrong + 1;
      const newTotalWrong = correct ? state.totalWrong : state.totalWrong + 1;
      const newMaxStreak = Math.max(state.maxStreakThisGame, newStreak);

      // ── XP calculation per spec ─────────────────────────────────────────
      // Correct: base difficulty XP + combo bonus (applied to new streak)
      // Wrong:   XP_WRONG (always awarded)
      const baseXP   = correct ? getDifficultyXP(state.selectedDifficulty) : XP_WRONG;
      const bonusXP  = correct ? getComboBonus(newStreak) : 0;
      // XP Sage avatar gives +25% XP (rounded up)
      const avatarAbility = getAvatarAbility(useUserStore.getState().selectedAvatarId);
      const xpMultiplier  = avatarAbility === 'xp-sage' ? 1.25 : 1;
      const questionXP    = Math.ceil((baseXP + bonusXP) * xpMultiplier);

      // ── Coin calculation per spec ───────────────────────────────────────
      // 1 coin per correct answer; Coin Magnet avatar gives +25%
      const coinMultiplier = avatarAbility === 'coin-magnet' ? 1.25 : 1;
      const questionCoins  = correct ? Math.ceil(1 * coinMultiplier) : 0;

      const revealDelta = getRevealDelta(state.selectedDifficulty, correct);

      return {
        score: Math.max(0, state.score + points),
        correctAnswers: state.correctAnswers + (correct ? 1 : 0),
        clarity: Math.min(100, Math.max(0, state.clarity + revealDelta)),
        streak: newStreak,
        consecutiveWrong: newConsecutiveWrong,
        totalWrong: newTotalWrong,
        maxStreakThisGame: newMaxStreak,
        xpEarned: state.xpEarned + questionXP,
        coinsEarned: state.coinsEarned + questionCoins,
        gameSession: state.gameSession
          ? {
              ...state.gameSession,
              score: Math.max(0, state.score + points),
              questionsAnswered: state.currentQuestionIndex + 1,
            }
          : null,
      };
    }),

  advanceQuestion: () =>
    set((state) => ({ currentQuestionIndex: state.currentQuestionIndex + 1 })),

  activateDoubleXP: () => set({ doubleXPActive: true }),

  endSession: () =>
    set((state) => ({
      gameSession: state.gameSession
        ? {
            ...state.gameSession,
            isComplete: true,
            endTime: Date.now(),
            score: state.score,
            hintsUsed: state.hintsUsed,
          }
        : null,
      isTimerRunning: false,
      lastGameWasTimedOut: state.timer <= 0,
    })),

  resetGame: () => set({ ...initialState }),
}));
