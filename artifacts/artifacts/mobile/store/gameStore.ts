import { create } from 'zustand';
import type { AppScreen, Category, Difficulty, GameSession } from '@/types';
import { GAME_CONSTANTS } from '@/constants';
import { DIFFICULTY_CONFIG, getStartingClarity, getStartingTime, getAvatarAbility } from '@/gameEngine';
import { useUserStore } from '@/store/userStore';
import { generateId } from '@/utils';

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
  xpEarned: number;
  doubleCoinsActive: boolean;
  lastGameWasTimedOut: boolean;

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
  activateDoubleCoins: () => void;
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
  doubleCoinsActive: false,
  lastGameWasTimedOut: false,
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
    set((state) => {
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
      doubleCoinsActive: false,
      lastGameWasTimedOut: false,
      };
    }),

  recordAnswer: (correct, points) =>
    set((state) => ({
      score: Math.max(0, state.score + points),
      correctAnswers: state.correctAnswers + (correct ? 1 : 0),
      clarity: Math.min(100, state.clarity + (correct ? 5 : 2)),
      timer: correct ? state.timer : Math.max(0, state.timer - 5),
      xpEarned: state.xpEarned + (correct ? (getAvatarAbility(useUserStore.getState().selectedAvatarId) === 'xp-sage' ? 13 : 10) : 0),
      gameSession: state.gameSession
        ? {
            ...state.gameSession,
            score: Math.max(0, state.score + points),
            questionsAnswered: state.currentQuestionIndex + 1,
          }
        : null,
    })),

  advanceQuestion: () =>
    set((state) => ({ currentQuestionIndex: state.currentQuestionIndex + 1 })),

  activateDoubleCoins: () => set({ doubleCoinsActive: true }),

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
