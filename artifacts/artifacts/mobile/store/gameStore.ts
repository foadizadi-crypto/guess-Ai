import { create } from 'zustand';
import type { AppScreen, Category, Difficulty, GameSession, SessionOutcome } from '@/types';
import { GAME_CONSTANTS } from '@/constants';
import { getStartingClarity, getStartingTime, getAvatarAbility, getRevealDelta } from '@/gameEngine';
import { useUserStore } from '@/store/userStore';
import { generateId } from '@/utils';
import { GAME_CONFIG } from '@/constants/gameConfig';
import { speedCardContentLevelCap } from '@/games/speed-card/economy';
import { COUNT_QUICK_QUESTIONS } from '@/games/count-quick/config';
import { LOST_ITEM_QUESTIONS } from '@/games/lost-item/config';
import { applyEngineEvents, gameIdForCategory, mapAnswerToEngineEvents, usesSharedSessionTimer } from '@/shared/economy';
import type { GameEvent } from '@/shared/economy';

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
  sessionOutcome: SessionOutcome | null;
  streak: number;              // consecutive correct answers in this session
  superComboActive: boolean;   // true once streak reaches super_combo_threshold; multiplier XP + clarity protection
  comboShieldActive: boolean;  // wrong answer drops combo 1 tier instead of full reset
  errorNullifierActive: boolean; // next wrong answer won't reduce clarity
  timeBoosted: boolean;        // time_boost consumable was applied this session
  multiplierActive: boolean;   // 2× coins & XP (from multiplier_2x consumable)
  consecutiveWrong: number;
  totalWrong: number;
  maxStreakThisGame: number;   // highest streak reached in this game session

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
  recordAnswer: (correct: boolean, points: number, snap?: boolean) => void;
  advanceQuestion: () => void;
  addTimerSeconds: (seconds: number) => void;
  clearStrikeOut: () => void;
  boostClarity: (delta: number) => void;
  endSession: (options?: { applyFinish?: boolean; sessionOutcome?: SessionOutcome | null }) => void;
  restartSession: (difficulty: Difficulty, category: Category) => void;
  resetRoundProgress: () => void;
  resetGame: (options?: { keepSelection?: boolean }) => void;
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
  sessionOutcome: null,
  streak: 0,
  superComboActive: false,
  comboShieldActive: false,
  errorNullifierActive: false,
  timeBoosted: false,
  multiplierActive: false,
  consecutiveWrong: 0,
  totalWrong: 0,
  maxStreakThisGame: 0,
};

// ─── Store ────────────────────────────────────────────────────────────────

export const useGameStore = create<GameState>((set, get) => ({
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
      const userState = useUserStore.getState();
      const consumables = userState.consumables;
      const usesTimer = usesSharedSessionTimer(category);

      // Time Boost only applies to sessions that actually tick the shared timer.
      const timeBoosted = usesTimer && consumables.time_boost > 0;
      const baseTimer   = usesTimer ? getStartingTime(ability) + (timeBoosted ? 20 : 0) : 0;
      const comboShieldActive    = consumables.combo_shield > 0;
      const errorNullifierActive = consumables.error_nullifier > 0;

      let multiplierActive = userState.multiplierSessionsLeft > 0;
      if (!multiplierActive && consumables.multiplier_2x > 0) {
        userState.useConsumable('multiplier_2x');
        useUserStore.setState({ multiplierSessionsLeft: 3 });
        multiplierActive = true;
      }

      if (timeBoosted)         userState.useConsumable('time_boost');
      if (comboShieldActive)   userState.useConsumable('combo_shield');
      if (errorNullifierActive) userState.useConsumable('error_nullifier');

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
        timer: baseTimer,
        isTimerRunning: usesTimer,
        currentQuestionIndex: 0,
        correctAnswers: 0,
        totalQuestions:
          category === 'speed_card'
            ? speedCardContentLevelCap()
            : category === 'count_quick'
              ? COUNT_QUICK_QUESTIONS
              : category === 'lost_item'
                ? LOST_ITEM_QUESTIONS
                : GAME_CONSTANTS.TOTAL_QUESTIONS,
        clarity: getStartingClarity(difficulty, ability),
        xpEarned: 0,
        coinsEarned: 0,
        doubleXPActive: false,
        lastGameWasTimedOut: false,
        sessionOutcome: null,
        streak: 0,
        superComboActive: false,
        comboShieldActive,
        errorNullifierActive,
        timeBoosted,
        multiplierActive,
        consecutiveWrong: 0,
        totalWrong: 0,
        maxStreakThisGame: 0,
      };
    }),

  recordAnswer: (correct, points, _snap = false) =>
    set((state) => {
      // ── Combo Shield: on wrong answer drop 1 tier instead of full reset ─
      let newStreak: number;
      let newComboShieldActive = state.comboShieldActive;
      if (correct) {
        newStreak = state.streak + 1;
      } else if (state.comboShieldActive && state.streak >= GAME_CONFIG.combo_tier_1_min) {
        // Drop streak to start of previous tier
        if (state.streak >= GAME_CONFIG.combo_tier_4_min)      newStreak = GAME_CONFIG.combo_tier_3_min;
        else if (state.streak >= GAME_CONFIG.combo_tier_3_min) newStreak = GAME_CONFIG.combo_tier_2_min;
        else if (state.streak >= GAME_CONFIG.combo_tier_2_min) newStreak = GAME_CONFIG.combo_tier_1_min;
        else                                                    newStreak = 0;
        newComboShieldActive = false; // shield consumed on use
      } else {
        newStreak = 0;
      }

      const newConsecutiveWrong = correct ? 0 : state.consecutiveWrong + 1;
      const newTotalWrong       = correct ? state.totalWrong : state.totalWrong + 1;
      const newMaxStreak        = Math.max(state.maxStreakThisGame, newStreak);

      // ── Super Combo state ───────────────────────────────────────────────
      const wasInSuperCombo     = state.superComboActive;
      const newSuperComboActive = correct
        ? newStreak >= GAME_CONFIG.super_combo_threshold
        : false;

      const engine = applyEngineEvents(
        gameIdForCategory(state.selectedCategory),
        mapAnswerToEngineEvents({
          correct,
          streakAfter: newStreak,
          superComboJustActivated: correct && !wasInSuperCombo && newSuperComboActive,
        }),
        useUserStore.getState().level,
      );
      const sessionMult = state.multiplierActive ? 2 : 1;
      const questionXP = engine.xp * sessionMult;
      const questionCoins = engine.coins * sessionMult;

      // ── Clarity / blur update ───────────────────────────────────────────
      // Suppress penalty when: super combo is broken, or error nullifier is active
      const suppressClarityPenalty = !correct && (wasInSuperCombo || state.errorNullifierActive);
      const revealDelta = suppressClarityPenalty ? 0 : getRevealDelta(state.selectedDifficulty, correct);
      // Error Nullifier is consumed after one wrong-answer protection
      const newErrorNullifierActive = state.errorNullifierActive && (correct || !suppressClarityPenalty || wasInSuperCombo)
        ? state.errorNullifierActive  // super combo handled it; nullifier still available
        : !correct && state.errorNullifierActive
          ? false  // nullifier consumed
          : state.errorNullifierActive;

      return {
        score:               Math.max(0, state.score + points),
        correctAnswers:      state.correctAnswers + (correct ? 1 : 0),
        clarity:             Math.min(100, Math.max(0, state.clarity + revealDelta)),
        streak:              newStreak,
        superComboActive:    newSuperComboActive,
        comboShieldActive:   newComboShieldActive,
        errorNullifierActive: newErrorNullifierActive,
        consecutiveWrong:    newConsecutiveWrong,
        totalWrong:          newTotalWrong,
        maxStreakThisGame:   newMaxStreak,
        xpEarned:            state.xpEarned + questionXP,
        coinsEarned:         state.coinsEarned + questionCoins,
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

  addTimerSeconds: (seconds) =>
    set((state) => ({ timer: Math.max(0, state.timer + seconds), isTimerRunning: true })),

  clearStrikeOut: () => set({ consecutiveWrong: 0 }),

  boostClarity: (delta) =>
    set((state) => ({
      clarity: Math.min(100, Math.max(0, state.clarity + delta)),
    })),

  endSession: (options) =>
    set((state) => {
      if (state.multiplierActive) {
        useUserStore.getState().decrementMultiplierSession();
      }
      const applyFinish = options?.applyFinish !== false;
      const outcome = options?.sessionOutcome ?? state.sessionOutcome;
      const events: GameEvent[] = [];
      if (applyFinish) events.push('FINISH');
      if (applyFinish && (outcome === 'perfect' || outcome === 'win')) {
        events.push('LEVEL_COMPLETE');
      }
      const finish = events.length > 0
        ? applyEngineEvents(
            gameIdForCategory(state.selectedCategory),
            events,
            useUserStore.getState().level,
          )
        : { xp: 0, coins: 0 };
      const sessionMult = state.multiplierActive ? 2 : 1;
      return {
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
        lastGameWasTimedOut: state.timer <= 0 && usesSharedSessionTimer(state.selectedCategory),
        sessionOutcome: outcome,
        xpEarned: state.xpEarned + finish.xp * sessionMult,
        coinsEarned: state.coinsEarned + finish.coins * sessionMult,
      };
    }),

  restartSession: (difficulty, category) => {
    const session = get().gameSession;
    if (session && !session.isComplete) {
      get().endSession({ applyFinish: false, sessionOutcome: 'lose' });
    }
    get().startSession(difficulty, category);
  },

  resetRoundProgress: () =>
    set((state) => ({
      score: 0,
      currentQuestionIndex: 0,
      correctAnswers: 0,
      xpEarned: 0,
      coinsEarned: 0,
      streak: 0,
      superComboActive: false,
      consecutiveWrong: 0,
      totalWrong: 0,
      maxStreakThisGame: 0,
      lastGameWasTimedOut: false,
      sessionOutcome: null,
      gameSession: state.gameSession
        ? { ...state.gameSession, score: 0, questionsAnswered: 0 }
        : null,
    })),

  activateDoubleXP: () => set({ doubleXPActive: true }),

  resetGame: (options) =>
    set((state) => ({
      ...initialState,
      ...(options?.keepSelection
        ? {
            selectedDifficulty: state.selectedDifficulty,
            selectedCategory: state.selectedCategory,
          }
        : {}),
    })),
}));
