import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Achievement,
  ActiveMission,
  Avatar,
  DailyReward,
  Language,
  PowerUpId,
  PowerUpInventory,
  UserSettings,
  UserStatistics,
} from '@/types';
import { ACHIEVEMENTS, DEFAULT_AVATARS, DAILY_REWARDS, DEFAULT_POWER_UPS } from '@/constants';
import { getLevelReward } from '@/constants/levelRewards';
import { type ConsumableId, CONSUMABLE_PRICES } from '@/constants/shopData';
import { getDailyMissions, getTodayUTC, type MissionType } from '@/constants/missions';
import {
  DAILY_XP_CAP,
  COINS_PERFECT_GAME_BONUS,
  FREE_MISSIONS_PER_DAY,
  PREMIUM_MISSIONS_PER_DAY,
  PREMIUM_COIN_MULTIPLIER,
  MAX_LEVEL,
} from '@/constants/economy';
import { calculateLevel, isToday, getTodayUTCString } from '@/utils';

// ─── State shape ──────────────────────────────────────────────────────────

export type ConsumableInventory = Record<ConsumableId, number>;

const DEFAULT_CONSUMABLES: ConsumableInventory = {
  clarity_bomb:     0,
  combo_shield:     0,
  time_boost:       0,
  multiplier_2x:    0,
  error_nullifier:  0,
};

interface UserState {
  // Profile
  username: string;
  coins: number;
  gems: number;                         // premium currency (purchased with real money)
  xp: number;
  level: number;
  isPremium: boolean;
  selectedAvatarId: string;
  avatars: Avatar[];
  powerUps: PowerUpInventory;
  consumables: ConsumableInventory;     // new consumable items (§6)
  multiplierSessionsLeft: number;       // remaining sessions for the 2× multiplier
  avatarFragments: number;

  // Progress
  bestScore: number;
  dailyReward: DailyReward;
  achievements: Achievement[];
  settings: UserSettings;
  statistics: UserStatistics;

  // Anti-farming
  dailyXPEarned: number;
  dailyXPDate: string | null;   // YYYY-MM-DD UTC

  // Level rewards
  unclaimedLevelRewards: number[];

  // Daily missions
  missions: ActiveMission[];
  missionsDate: string | null;  // YYYY-MM-DD UTC — date missions were generated

  // ─── Actions ────────────────────────────────────────────────────────────

  setUsername: (username: string) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addGems: (amount: number) => void;
  spendGems: (amount: number) => boolean;
  addXP: (amount: number) => void;
  unlockAvatar: (avatarId: string) => boolean;
  selectAvatar: (avatarId: string) => void;
  buyPowerUp: (powerUpId: PowerUpId, quantity?: number) => boolean;
  usePowerUp: (powerUpId: PowerUpId) => boolean;
  buyConsumable: (id: ConsumableId, quantity?: number) => boolean;
  useConsumable: (id: ConsumableId) => boolean;
  addConsumable: (id: ConsumableId, quantity?: number) => void; // free grants (level rewards)
  decrementMultiplierSession: () => void;
  mockPurchaseCoins: (amount: number) => void;
  updateBestScore: (score: number) => void;
  claimDailyReward: () => number;
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateLanguage: (language: Language) => void;
  updateStatistics: (stats: Partial<UserStatistics>) => void;
  claimLevelReward: (level: number) => boolean;
  refreshDailyMissions: () => void;
  updateMissionProgress: (type: MissionType, increment: number, param?: string) => void;
  claimMissionReward: (missionId: string) => boolean;
  setPremium: (value: boolean) => void;
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
  nextRewardAmount: 15,
};

// ─── Store ────────────────────────────────────────────────────────────────

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      username: '',
      coins: 500,
      gems: 0,
      xp: 0,
      level: 1,
      isPremium: false,
      selectedAvatarId: 'avatar_1',
      avatars: DEFAULT_AVATARS.map((a) => ({ ...a })),
      powerUps: { ...DEFAULT_POWER_UPS },
      consumables: { ...DEFAULT_CONSUMABLES },
      multiplierSessionsLeft: 0,
      avatarFragments: 0,
      bestScore: 0,
      dailyReward: { ...defaultDailyReward },
      achievements: ACHIEVEMENTS.map((a) => ({ ...a, unlocked: false, unlockedAt: null })),
      settings: { ...defaultSettings },
      statistics: { ...defaultStatistics },
      dailyXPEarned: 0,
      dailyXPDate: null,
      unclaimedLevelRewards: [],
      missions: [],
      missionsDate: null,

      // ── Basic setters ──────────────────────────────────────────────────

      setUsername: (username) => set({ username }),

      addCoins: (amount) =>
        set((state) => ({
          coins: state.coins + amount,
          statistics: {
            ...state.statistics,
            totalCoinsEarned: state.statistics.totalCoinsEarned + amount,
          },
        })),

      spendCoins: (amount) => {
        const { coins } = get();
        if (coins < amount) return false;
        set({ coins: coins - amount });
        return true;
      },

      addGems: (amount) => set((state) => ({ gems: state.gems + amount })),

      spendGems: (amount) => {
        const { gems } = get();
        if (gems < amount) return false;
        set({ gems: gems - amount });
        return true;
      },

      // ── Consumables ────────────────────────────────────────────────────

      buyConsumable: (id, quantity = 1) => {
        const price = CONSUMABLE_PRICES[id];
        if (price === undefined) return false;
        const cost = price * quantity;
        const { coins } = get();
        if (coins < cost) return false;
        set((state) => ({
          coins: state.coins - cost,
          consumables: {
            ...state.consumables,
            [id]: state.consumables[id] + quantity,
          },
        }));
        return true;
      },

      useConsumable: (id) => {
        if (get().consumables[id] < 1) return false;
        set((state) => ({
          consumables: {
            ...state.consumables,
            [id]: Math.max(0, state.consumables[id] - 1),
          },
          // Activate multiplier sessions when multiplier_2x is used
          ...(id === 'multiplier_2x' ? { multiplierSessionsLeft: state.multiplierSessionsLeft + 3 } : {}),
        }));
        return true;
      },

      addConsumable: (id, quantity = 1) =>
        set((state) => ({
          consumables: {
            ...state.consumables,
            [id]: state.consumables[id] + quantity,
          },
        })),

      decrementMultiplierSession: () =>
        set((state) => ({
          multiplierSessionsLeft: Math.max(0, state.multiplierSessionsLeft - 1),
        })),

      // ── XP with daily cap + level-up detection ─────────────────────────

      addXP: (amount) =>
        set((state) => {
          // Reset daily XP counter if it's a new UTC day
          const today = getTodayUTCString();
          const isNewDay = state.dailyXPDate !== today;
          const currentDailyXP = isNewDay ? 0 : state.dailyXPEarned;

          // Apply daily cap
          const remaining = Math.max(0, DAILY_XP_CAP - currentDailyXP);
          const actualXP = Math.min(amount, remaining);

          if (actualXP <= 0) {
            return { dailyXPDate: today, dailyXPEarned: currentDailyXP };
          }

          const newTotalXP = state.xp + actualXP;
          const oldLevel   = state.level;
          const newLevel   = calculateLevel(newTotalXP);

          // Queue unclaimed rewards for any levels crossed
          const newUnclaimed = [...state.unclaimedLevelRewards];
          for (let l = oldLevel + 1; l <= newLevel; l++) {
            if (l <= MAX_LEVEL && !newUnclaimed.includes(l)) {
              newUnclaimed.push(l);
            }
          }

          return {
            xp: newTotalXP,
            level: newLevel,
            dailyXPEarned: currentDailyXP + actualXP,
            dailyXPDate: today,
            unclaimedLevelRewards: newUnclaimed,
          };
        }),

      // ── Avatar ────────────────────────────────────────────────────────

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

      // ── Power-ups — prices from economy.ts via POWER_UPS constant ──────

      buyPowerUp: (powerUpId, quantity = 1) => {
        const priceMap: Record<PowerUpId, number> = {
          'hint':          50,
          'reveal-blur':   80,
          'skip-question': 40,
          'double-xp':     200,
        };
        const cost = (priceMap[powerUpId] ?? 80) * quantity;
        const { coins } = get();
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
        set((state) => ({
          coins: state.coins + amount,
          statistics: {
            ...state.statistics,
            totalCoinsEarned: state.statistics.totalCoinsEarned + amount,
          },
        })),

      updateBestScore: (score) =>
        set((state) => ({
          bestScore: Math.max(state.bestScore, score),
          statistics: {
            ...state.statistics,
            bestScore: Math.max(state.statistics.bestScore, score),
          },
        })),

      // ── Daily reward ──────────────────────────────────────────────────

      claimDailyReward: () => {
        const { dailyReward, isPremium } = get();
        if (isToday(dailyReward.lastClaimed)) return 0;

        const isConsecutive =
          dailyReward.lastClaimed !== null &&
          (() => {
            const last = new Date(dailyReward.lastClaimed!);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return last.toDateString() === yesterday.toDateString();
          })();

        const newStreak  = isConsecutive ? dailyReward.streak + 1 : 1;
        const cycleDay   = ((newStreak - 1) % 7) + 1; // 1-7 repeating cycle
        const scheduled  = DAILY_REWARDS[cycleDay - 1];
        const baseCoins  = scheduled?.coins ?? 15;
        // Premium doubles daily login coins
        const reward     = isPremium ? baseCoins * PREMIUM_COIN_MULTIPLIER : baseCoins;
        // Day 3 bonus hint, Day 7 bonus reveal
        const bonusHint    = cycleDay === 3 ? 1 : 0;
        const bonusReveal  = cycleDay === 7 ? 1 : 0;

        set((state) => ({
          coins: state.coins + reward,
          powerUps: {
            ...state.powerUps,
            'hint':        state.powerUps['hint']        + bonusHint,
            'reveal-blur': state.powerUps['reveal-blur'] + bonusReveal,
          },
          dailyReward: {
            lastClaimed:       new Date().toISOString(),
            lastClaimDate:     new Date().toISOString(),
            streak:            newStreak,
            currentDay:        cycleDay,
            nextRewardAmount:  DAILY_REWARDS[(cycleDay % 7)]?.coins ?? 15,
          },
          statistics: {
            ...state.statistics,
            totalCoinsEarned: state.statistics.totalCoinsEarned + reward,
            longestStreak: Math.max(state.statistics.longestStreak, newStreak),
          },
        }));
        return reward;
      },

      // ── Level reward claiming ─────────────────────────────────────────

      claimLevelReward: (level) => {
        const { unclaimedLevelRewards } = get();
        if (!unclaimedLevelRewards.includes(level)) return false;

        const reward = getLevelReward(level);
        if (!reward) return false;

        // Tally up any free consumables included in this reward
        const nullifiersGranted = reward.items.filter(i => i.type === 'error_nullifier')
          .reduce((sum, i) => sum + (i.quantity ?? 1), 0);

        set((state) => ({
          coins: state.coins + reward.coins,
          unclaimedLevelRewards: state.unclaimedLevelRewards.filter((l) => l !== level),
          consumables: nullifiersGranted > 0
            ? { ...state.consumables, error_nullifier: state.consumables.error_nullifier + nullifiersGranted }
            : state.consumables,
          statistics: {
            ...state.statistics,
            totalCoinsEarned: state.statistics.totalCoinsEarned + reward.coins,
          },
        }));
        return true;
      },

      // ── Daily missions ────────────────────────────────────────────────

      refreshDailyMissions: () => {
        const { missionsDate, isPremium } = get();
        const today = getTodayUTC();
        if (missionsDate === today) return; // already refreshed today

        const count    = isPremium ? PREMIUM_MISSIONS_PER_DAY : FREE_MISSIONS_PER_DAY;
        const defs     = getDailyMissions(count, today);
        const missions: ActiveMission[] = defs.map((d) => ({
          id:            d.id,
          type:          d.type,
          label:         d.label,
          description:   d.description,
          target:        d.target,
          reward:        d.reward,
          param:         d.param,
          progress:      0,
          completed:     false,
          rewardClaimed: false,
        }));

        set({ missions, missionsDate: today });
      },

      updateMissionProgress: (type, increment, param) =>
        set((state) => ({
          missions: state.missions.map((m) => {
            if (m.completed) return m;
            if (m.type !== type) return m;
            // play_category missions require param to match
            if (type === 'play_category' && param !== undefined && m.param !== param) return m;
            const newProgress = m.progress + increment;
            return {
              ...m,
              progress:  newProgress,
              completed: newProgress >= m.target,
            };
          }),
        })),

      claimMissionReward: (missionId) => {
        const mission = get().missions.find((m) => m.id === missionId);
        if (!mission || !mission.completed || mission.rewardClaimed) return false;
        set((state) => ({
          coins: state.coins + mission.reward,
          missions: state.missions.map((m) =>
            m.id === missionId ? { ...m, rewardClaimed: true } : m,
          ),
          statistics: {
            ...state.statistics,
            totalCoinsEarned: state.statistics.totalCoinsEarned + mission.reward,
          },
        }));
        return true;
      },

      // ── Achievement checking ──────────────────────────────────────────
      // Called from result screen after updateStatistics

      // ── Settings ──────────────────────────────────────────────────────

      updateSettings: (settings) =>
        set((state) => ({ settings: { ...state.settings, ...settings } })),

      updateLanguage: (language) =>
        set((state) => ({ settings: { ...state.settings, language } })),

      updateStatistics: (stats) =>
        set((state) => ({ statistics: { ...state.statistics, ...stats } })),

      setPremium: (value) => set({ isPremium: value }),

      // ── Reset ─────────────────────────────────────────────────────────

      resetUser: () =>
        set({
          username: '',
          coins: 500,
          gems: 0,
          xp: 0,
          level: 1,
          isPremium: false,
          selectedAvatarId: 'avatar_1',
          avatars: DEFAULT_AVATARS.map((a) => ({ ...a })),
          powerUps: { ...DEFAULT_POWER_UPS },
          consumables: { ...DEFAULT_CONSUMABLES },
          multiplierSessionsLeft: 0,
          avatarFragments: 0,
          bestScore: 0,
          dailyReward: { ...defaultDailyReward },
          achievements: ACHIEVEMENTS.map((a) => ({ ...a, unlocked: false, unlockedAt: null })),
          settings: { ...defaultSettings },
          statistics: { ...defaultStatistics },
          dailyXPEarned: 0,
          dailyXPDate: null,
          unclaimedLevelRewards: [],
          missions: [],
          missionsDate: null,
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
          powerUps:   { ...DEFAULT_POWER_UPS,    ...(saved.powerUps   ?? {}) },
          consumables: { ...DEFAULT_CONSUMABLES, ...(saved.consumables ?? {}) },
          dailyReward:  { ...defaultDailyReward,  ...(saved.dailyReward  ?? {}) },
          statistics:   { ...defaultStatistics,   ...(saved.statistics   ?? {}) },
          achievements: saved.achievements?.length
            ? saved.achievements
            : ACHIEVEMENTS.map((a) => ({ ...a, unlocked: false, unlockedAt: null })),
          gems:                    saved.gems                    ?? 0,
          multiplierSessionsLeft:  saved.multiplierSessionsLeft  ?? 0,
          unclaimedLevelRewards:   saved.unclaimedLevelRewards   ?? [],
          missions:                saved.missions                 ?? [],
          missionsDate:            saved.missionsDate             ?? null,
          dailyXPEarned:           saved.dailyXPEarned            ?? 0,
          dailyXPDate:             saved.dailyXPDate              ?? null,
          isPremium:               saved.isPremium                ?? false,
        };
      },
    },
  ),
);
