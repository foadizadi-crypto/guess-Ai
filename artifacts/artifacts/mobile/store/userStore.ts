import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Achievement,
  Avatar,
  DailyReward,
  Language,
  PowerUpId,
  PowerUpInventory,
  UserSettings,
  UserStatistics,
} from '@/types';
import { ACHIEVEMENTS, DEFAULT_AVATARS, DAILY_REWARDS, GAME_CONSTANTS } from '@/constants';
import { calculateLevel, isToday } from '@/utils';

// ─── State shape ──────────────────────────────────────────────────────────

interface UserState {
  // Profile
  username: string;
  coins: number;
  xp: number;
  level: number;
  selectedAvatarId: string;
  avatars: Avatar[];
  powerUps: PowerUpInventory;
  avatarFragments: number;

  // Progress
  bestScore: number;
  dailyReward: DailyReward;
  achievements: Achievement[];
  settings: UserSettings;
  statistics: UserStatistics;

  // ─── Actions ────────────────────────────────────────────────────────────

  setUsername: (username: string) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addXP: (amount: number) => void;
  unlockAvatar: (avatarId: string) => boolean;
  selectAvatar: (avatarId: string) => void;
  buyPowerUp: (powerUpId: PowerUpId, quantity?: number) => boolean;
  usePowerUp: (powerUpId: PowerUpId) => boolean;
  mockPurchaseCoins: (amount: number) => void;
  updateBestScore: (score: number) => void;
  claimDailyReward: () => number;
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateLanguage: (language: Language) => void;
  updateStatistics: (stats: Partial<UserStatistics>) => void;
  resetUser: () => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────

const defaultSettings: UserSettings = {
  language: 'en',
  notifications: true,
  vibration: true,
  theme: 'dark',
};

const defaultStatistics: UserStatistics = {
  totalGamesPlayed: 0,
  totalWins: 0,
  totalCoinsEarned: 0,
  bestScore: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalCorrectAnswers: 0,
  favoriteCategory: null,
};

const defaultDailyReward: DailyReward = {
  lastClaimed: null,
  lastClaimDate: null,
  streak: 0,
  currentDay: 0,
  nextRewardAmount: GAME_CONSTANTS.DAILY_REWARD_BASE,
};

const defaultPowerUps: PowerUpInventory = {
  'extra-time': 0,
  'fifty-fifty': 0,
  'skip-question': 0,
  'double-coins': 0,
};

// ─── Store ────────────────────────────────────────────────────────────────

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      username: '',
      coins: 500,
      xp: 0,
      level: 1,
      selectedAvatarId: 'avatar_1',
      avatars: DEFAULT_AVATARS.map((a) => ({ ...a })),
      powerUps: { ...defaultPowerUps },
      avatarFragments: 0,
      bestScore: 0,
      dailyReward: { ...defaultDailyReward },
      achievements: ACHIEVEMENTS.map((achievement) => ({ ...achievement, icon: achievement.icon })),
      settings: { ...defaultSettings },
      statistics: { ...defaultStatistics },

      setUsername: (username) => set({ username }),

      addCoins: (amount) =>
        set((state) => ({ coins: state.coins + amount })),

      spendCoins: (amount) => {
        const { coins } = get();
        if (coins < amount) return false;
        set({ coins: coins - amount });
        return true;
      },

      addXP: (amount) =>
        set((state) => {
          const newXP = state.xp + amount;
          return { xp: newXP, level: calculateLevel(newXP) };
        }),

      unlockAvatar: (avatarId) => {
        const { avatars, coins } = get();
        const avatar = avatars.find((a) => a.id === avatarId);
        if (!avatar || avatar.unlocked) return false;
        if (coins < avatar.cost) return false;
        set((state) => ({
          coins: state.coins - avatar.cost,
          avatars: state.avatars.map((a) =>
            a.id === avatarId ? { ...a, unlocked: true } : a,
          ),
        }));
        return true;
      },

      selectAvatar: (avatarId) => {
        const { avatars } = get();
        const avatar = avatars.find((a) => a.id === avatarId);
        if (avatar?.unlocked) {
          set({ selectedAvatarId: avatarId });
        }
      },

      buyPowerUp: (powerUpId, quantity = 1) => {
        const { coins } = get();
        const costs: Record<PowerUpId, number> = {
          'extra-time': 75,
          'fifty-fifty': 100,
          'skip-question': 125,
          'double-coins': 175,
        };
        const cost = costs[powerUpId] * quantity;
        if (coins < cost) return false;
        set((state) => ({
          coins: state.coins - cost,
          powerUps: {
            ...state.powerUps,
            [powerUpId]: state.powerUps[powerUpId] + quantity,
          },
        }));
        return true;
      },

      usePowerUp: (powerUpId) => {
        if (get().powerUps[powerUpId] < 1) return false;
        set((state) => ({
          powerUps: {
            ...state.powerUps,
            [powerUpId]: Math.max(0, state.powerUps[powerUpId] - 1),
          },
        }));
        return true;
      },

      mockPurchaseCoins: (amount) =>
        set((state) => ({ coins: state.coins + amount })),

      updateBestScore: (score) =>
        set((state) => ({
          bestScore: Math.max(state.bestScore, score),
          statistics: {
            ...state.statistics,
            bestScore: Math.max(state.statistics.bestScore, score),
          },
        })),

      claimDailyReward: () => {
        const { dailyReward } = get();
        if (isToday(dailyReward.lastClaimed)) return 0;
        const isConsecutive =
          dailyReward.lastClaimed !== null &&
          (() => {
            const last = new Date(dailyReward.lastClaimed!);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return last.toDateString() === yesterday.toDateString();
          })();
        const newStreak = isConsecutive ? dailyReward.streak + 1 : 1;
        const currentDay = ((dailyReward.currentDay ?? dailyReward.streak) % 7) + 1;
        const scheduledReward = DAILY_REWARDS[currentDay - 1];
        const reward = scheduledReward.coins;
        set((state) => ({
          coins: state.coins + reward,
          avatarFragments: state.avatarFragments + (currentDay === 4 ? 1 : 0),
          dailyReward: {
            lastClaimed: new Date().toISOString(),
            lastClaimDate: new Date().toISOString(),
            streak: newStreak,
            currentDay,
            nextRewardAmount: GAME_CONSTANTS.DAILY_REWARD_BASE + (newStreak + 1) * GAME_CONSTANTS.DAILY_REWARD_STREAK_BONUS,
          },
        }));
        return reward || (currentDay === 4 ? 1 : 0);
      },

      updateSettings: (settings) =>
        set((state) => ({ settings: { ...state.settings, ...settings } })),

      updateLanguage: (language) =>
        set((state) => ({ settings: { ...state.settings, language } })),

      updateStatistics: (stats) =>
        set((state) => ({ statistics: { ...state.statistics, ...stats } })),

      resetUser: () =>
        set({
          username: '',
          coins: 500,
          xp: 0,
          level: 1,
          selectedAvatarId: 'avatar_1',
          avatars: DEFAULT_AVATARS.map((a) => ({ ...a })),
          powerUps: { ...defaultPowerUps },
          avatarFragments: 0,
          bestScore: 0,
          dailyReward: { ...defaultDailyReward },
          achievements: ACHIEVEMENTS.map((achievement) => ({ ...achievement, icon: achievement.icon })),
          settings: { ...defaultSettings },
          statistics: { ...defaultStatistics },
        }),
    }),
    {
      name: 'blurquiz-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persisted, current) => {
        const saved = persisted as Partial<UserState>;
        return {
          ...current,
          ...saved,
          avatars: DEFAULT_AVATARS.map((avatar) => ({
            ...avatar,
            ...(saved.avatars ?? []).find((item) => item.id === avatar.id),
          })),
          powerUps: { ...defaultPowerUps, ...(saved.powerUps ?? {}) },
          dailyReward: { ...defaultDailyReward, ...(saved.dailyReward ?? {}) },
          statistics: { ...defaultStatistics, ...(saved.statistics ?? {}) },
          achievements: saved.achievements?.length
            ? saved.achievements
            : ACHIEVEMENTS.map((achievement) => ({ ...achievement, icon: achievement.icon })),
        };
      },
    },
  ),
);
