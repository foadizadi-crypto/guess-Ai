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
import { ACHIEVEMENTS, DEFAULT_AVATARS, DAILY_REWARDS, DEFAULT_POWER_UPS, checkAchievementCondition } from '@/constants';
import type { AchievementDef } from '@/constants/achievements';
import { GEM_SHOP_ITEMS } from '@/constants/shopConfig';
import { COSMETIC_BY_ID, FRAMES, type CosmeticType } from '@/constants/collections';
import {
  SPIN_CONFIG,
  pickRewardIndex,
  type SpinReward,
} from '@/constants/spinConfig';
import { getLevelReward } from '@/constants/levelRewards';
import { GEM_PACKS, type GemPackItem } from '@/constants/shopConfig';
import { type ConsumableId, CONSUMABLE_PRICES } from '@/constants/shopData';
import { getDailyMissions, getTodayUTC, type MissionType } from '@/constants/missions';
import {
  DAILY_XP_CAP,
  COINS_PERFECT_GAME_BONUS,
  FREE_MISSIONS_PER_DAY,
  PREMIUM_MISSIONS_PER_DAY,
  PREMIUM_COIN_MULTIPLIER,
  MAX_LEVEL,
  MAX_ENERGY,
  ENERGY_REFILL_INTERVAL_MIN,
  ENERGY_REFILL_GEM_COST,
  STAMINA_PER_GAME,
  COIN_GEM_EXCHANGES,
  type CoinGemExchangeId,
} from '@/constants/economy';
import { notificationService } from '@/services/NotificationService';
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
  hasNewAchievement: boolean; // red-dot badge on lobby button
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
  checkAndUnlockAchievements: (ctx: { isPerfectGame?: boolean; maxComboThisGame?: number }) => AchievementDef[];
  clearNewAchievementBadge: () => void;
  gemCosmetics: Record<string, { owned: boolean; equipped: boolean }>;
  buyGemCosmetic: (id: string) => boolean;
  equipGemCosmetic: (id: string) => void;
  // ── Phase 2 — Cosmetic collections ────────────────────────────────────
  ownedCosmetics: Record<string, boolean>;
  equippedCosmetics: Partial<Record<CosmeticType, string>>;
  buyCosmetic: (id: string) => boolean;
  equipCosmetic: (id: string) => void;
  grantStarterPack: () => void;
  // ── Phase 3 — Jackpot spin wheel ──────────────────────────────────────
  lastSpinDate:    string | null;  // ISO timestamp of last FREE spin
  extraSpinsToday: number;         // paid spins used today
  lastExtraSpinDate: string | null; // YYYY-MM-DD UTC for daily reset
  canFreeSpin:   () => boolean;
  canExtraSpin:  () => boolean;
  performSpin:   (isFree: boolean) => SpinReward | null;
  // ── Energy / Stamina ──────────────────────────────────────────────────
  //
  // Active stamina (energy): 0–MAX_ENERGY. Refills passively at 1/10 min.
  // Stamina reserve: uncapped. Holds purchased/rewarded/ad stamina.
  // Consumption priority: active first; when active = 0, drain from reserve.
  // Purchased/rewarded stamina always goes into reserve, never directly into active.
  energy: number;
  staminaReserve: number;              // uncapped reserve — purchased/rewarded stamina
  lastEnergyRefillTime: number | null; // Unix ms timestamp when last refill tick was saved
  tickEnergy: () => void;              // lazy-refill based on elapsed time; call on focus
  spendEnergy: (amount?: number) => boolean;
  /** Add stamina to the reserve (not directly to active). */
  addStamina: (amount: number) => void;
  refillEnergyWithGems: () => boolean;
  // ── Gem packs (spendable bundles) ─────────────────────────────────────
  buyGemPack: (packId: string) => boolean;
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
      hasNewAchievement: false,
      gemCosmetics: {},
      ownedCosmetics: {},
      equippedCosmetics: {},
      lastSpinDate:       null,
      extraSpinsToday:    0,
      lastExtraSpinDate:  null,
      energy:               MAX_ENERGY,
      staminaReserve:       0,
      lastEnergyRefillTime: null,
      coinGemExchanges:     {},
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

          // Auto-unlock avatars for any levels crossed
          const newAvatars = state.avatars.map((av) => {
            if (av.unlocked || av.unlockLevel === undefined) return av;
            return av.unlockLevel <= newLevel ? { ...av, unlocked: true } : av;
          });
          // Collector achievement: unlock avatar_10 when 5+ avatars owned
          const ownedCount = newAvatars.filter((a) => a.unlocked).length;
          const finalAvatars =
            ownedCount >= 5 && !newAvatars.find((a) => a.id === 'avatar_10')?.unlocked
              ? newAvatars.map((a) => a.id === 'avatar_10' ? { ...a, unlocked: true } : a)
              : newAvatars;

          // Auto-grant level-unlock frames for any levels crossed
          const frameGrants: Record<string, boolean> = {};
          for (const frame of FRAMES) {
            if (
              frame.unlockType === 'level' &&
              frame.unlockLevel !== undefined &&
              frame.unlockLevel <= newLevel &&
              !state.ownedCosmetics[frame.id]
            ) {
              frameGrants[frame.id] = true;
            }
          }

          return {
            xp: newTotalXP,
            level: newLevel,
            avatars: finalAvatars,
            ownedCosmetics: Object.keys(frameGrants).length > 0
              ? { ...state.ownedCosmetics, ...frameGrants }
              : state.ownedCosmetics,
            dailyXPEarned: currentDailyXP + actualXP,
            dailyXPDate: today,
            unclaimedLevelRewards: newUnclaimed,
          };
        }),

      // ── Avatar ────────────────────────────────────────────────────────

      unlockAvatar: (avatarId) => {
        const { avatars } = get();
        const avatar = avatars.find((a) => a.id === avatarId);
        if (!avatar || avatar.unlocked) return false;
        // Unlock without coin cost — avatars are earned through gameplay
        set((state) => {
          const newAvatars = state.avatars.map((a) =>
            a.id === avatarId ? { ...a, unlocked: true } : a,
          );
          // Check collector achievement: if player now owns 5+ avatars, unlock avatar_10
          const ownedCount = newAvatars.filter((a) => a.unlocked).length;
          const collectorUnlocked = ownedCount >= 5 && !newAvatars.find((a) => a.id === 'avatar_10')?.unlocked;
          const finalAvatars = collectorUnlocked
            ? newAvatars.map((a) => a.id === 'avatar_10' ? { ...a, unlocked: true } : a)
            : newAvatars;
          return { avatars: finalAvatars };
        });
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
        // Reschedule the daily-reward reminder so it fires again tomorrow
        if (get().settings.notifications) {
          notificationService.scheduleDailyReward();
        }
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
          // Grant free gems for milestone levels (10, 25, 50, 100, 150, 300, 500)
          gems: reward.gems ? state.gems + reward.gems : state.gems,
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

      checkAndUnlockAchievements: (ctx) => {
        const { achievements, statistics, avatars, ownedCosmetics } = get();
        const newlyUnlocked: AchievementDef[] = [];
        let coinsToAdd = 0;
        let xpToAdd    = 0;
        let gemsToAdd  = 0;

        const ownedCosmeticsCount = Object.values(ownedCosmetics).filter(Boolean).length;

        const updatedAchievements = achievements.map((stored) => {
          if (stored.unlocked) return stored;
          const def = ACHIEVEMENTS.find((a) => a.id === stored.id);
          if (!def) return stored;
          const conditionMet = checkAchievementCondition(def.id, {
            stats: statistics,
            avatars,
            ownedCosmeticsCount,
            isPerfectGame:    ctx.isPerfectGame,
            maxComboThisGame: ctx.maxComboThisGame,
          });
          if (!conditionMet) return stored;
          coinsToAdd += def.rewardCoins ?? 0;
          xpToAdd    += def.rewardXP    ?? 0;
          gemsToAdd  += def.rewardGems  ?? 0;
          newlyUnlocked.push(def);
          return { ...stored, unlocked: true, unlockedAt: new Date().toISOString() };
        });

        if (newlyUnlocked.length > 0) {
          set((state) => ({
            achievements: updatedAchievements,
            hasNewAchievement: true,
            coins: state.coins + coinsToAdd,
            xp:    state.xp    + xpToAdd,
            gems:  state.gems  + gemsToAdd,
            statistics: {
              ...state.statistics,
              totalCoinsEarned: state.statistics.totalCoinsEarned + coinsToAdd,
            },
          }));
          // Fire an immediate notification for the first newly unlocked achievement
          if (get().settings.notifications && newlyUnlocked[0]) {
            notificationService.fireAchievementCompleted(newlyUnlocked[0].title);
          }
        }

        return newlyUnlocked;
      },

      clearNewAchievementBadge: () => set({ hasNewAchievement: false }),

      // ── Gem cosmetics (Phase 1 §4) ────────────────────────────────────

      buyGemCosmetic: (id) => {
        const item = GEM_SHOP_ITEMS.find((i) => i.id === id);
        if (!item) return false;
        const { gems, gemCosmetics } = get();
        if (gemCosmetics[id]?.owned) return false; // already owned
        if (gems < item.price) return false;
        set((state) => ({
          gems: state.gems - item.price,
          gemCosmetics: { ...state.gemCosmetics, [id]: { owned: true, equipped: false } },
        }));
        return true;
      },

      equipGemCosmetic: (id) => {
        set((state) => {
          if (!state.gemCosmetics[id]?.owned) return state;
          return {
            gemCosmetics: {
              ...state.gemCosmetics,
              [id]: { ...state.gemCosmetics[id], equipped: !state.gemCosmetics[id].equipped },
            },
          };
        });
      },

      // ── Phase 2 — Generic cosmetic collection actions ─────────────────

      buyCosmetic: (id) => {
        const item = COSMETIC_BY_ID.get(id);
        if (!item) return false;
        const state = get();
        if (state.ownedCosmetics[id]) return false; // already owned
        if (item.currency === 'free') {
          set((s) => ({ ownedCosmetics: { ...s.ownedCosmetics, [id]: true } }));
          return true;
        }
        if (item.currency === 'gems') {
          if (state.gems < item.price) return false;
          set((s) => ({
            gems: s.gems - item.price,
            ownedCosmetics: { ...s.ownedCosmetics, [id]: true },
          }));
          return true;
        }
        if (item.currency === 'coins') {
          if (state.coins < item.price) return false;
          set((s) => ({
            coins: s.coins - item.price,
            ownedCosmetics: { ...s.ownedCosmetics, [id]: true },
          }));
          return true;
        }
        return false;
      },

      equipCosmetic: (id) => {
        const item = COSMETIC_BY_ID.get(id);
        if (!item) return;
        const state = get();
        // For free items grant ownership implicitly on first equip
        const isOwned = state.ownedCosmetics[id] || item.currency === 'free';
        if (!isOwned) return;
        set((s) => {
          const alreadyEquipped = s.equippedCosmetics[item.type] === id;
          return {
            equippedCosmetics: {
              ...s.equippedCosmetics,
              [item.type]: alreadyEquipped ? undefined : id,
            },
          };
        });
      },

      grantStarterPack: () => {
        set((s) => ({
          coins: s.coins + 500,
          gems: s.gems + 100,
          ownedCosmetics: { ...s.ownedCosmetics, frame_bronze: true },
        }));
      },

      // ── Energy / Stamina ──────────────────────────────────────────────────
      //
      // ARCHITECTURE:
      //   active (energy)   — 0..MAX_ENERGY, refills passively at 1/10 min
      //   reserve           — uncapped, holds purchased / rewarded / ad stamina
      //
      // Consumption priority: deduct from active first.
      //   If active reaches 0 and more is needed, drain reserve.
      // Incoming stamina (rewards/ads/packs) always enters reserve, never active.
      // The passive refill only fills active; reserve is untouched by time.

      tickEnergy: () => {
        set((s) => {
          if (s.energy >= MAX_ENERGY) return {};
          const refillTime = s.lastEnergyRefillTime ?? Date.now();
          const elapsed    = Date.now() - refillTime;
          const intervalMs = ENERGY_REFILL_INTERVAL_MIN * 60 * 1000;
          const gained     = Math.floor(elapsed / intervalMs);
          if (gained <= 0) return {};
          const newEnergy  = Math.min(MAX_ENERGY, s.energy + gained);
          const remainder  = elapsed % intervalMs;
          // Cancel "stamina full" notification when active stamina reaches max
          if (newEnergy >= MAX_ENERGY && s.settings.notifications) {
            notificationService.cancelStaminaFull();
          }
          return {
            energy: newEnergy,
            lastEnergyRefillTime: newEnergy >= MAX_ENERGY ? null : Date.now() - remainder,
          };
        });
      },

      spendEnergy: (amount = STAMINA_PER_GAME) => {
        // Tick passive refill before checking balance
        get().tickEnergy();
        const { energy, staminaReserve } = get();
        const total = energy + staminaReserve;
        if (total < amount) return false;          // can't afford even with reserve

        set((s) => {
          if (s.energy >= amount) {
            // Happy path: active stamina covers the full cost
            const newEnergy = s.energy - amount;
            return {
              energy: newEnergy,
              lastEnergyRefillTime: s.lastEnergyRefillTime ?? Date.now(),
            };
          }
          // Active ran dry — use it all, then pull the rest from reserve
          const fromReserve = amount - s.energy;
          return {
            energy: 0,
            staminaReserve: s.staminaReserve - fromReserve,
            lastEnergyRefillTime: s.lastEnergyRefillTime ?? Date.now(),
          };
        });

        // Schedule "stamina full" notification based on deficit after spend
        if (get().settings.notifications) {
          const newEnergy = get().energy;
          if (newEnergy < MAX_ENERGY) {
            const deficit = MAX_ENERGY - newEnergy;
            const minutesUntilFull = deficit * ENERGY_REFILL_INTERVAL_MIN;
            notificationService.scheduleStaminaFull(minutesUntilFull);
          }
        }

        return true;
      },

      /** Incoming stamina (ads, events, rewards) goes into reserve — never active. */
      addStamina: (amount) => {
        set((s) => ({ staminaReserve: s.staminaReserve + amount }));
      },

      refillEnergyWithGems: () => {
        const { gems, energy } = get();
        if (energy >= MAX_ENERGY) return false;
        if (gems < ENERGY_REFILL_GEM_COST) return false;
        set({ gems: gems - ENERGY_REFILL_GEM_COST, energy: MAX_ENERGY, lastEnergyRefillTime: null });
        return true;
      },

      // ── Gem Packs (spendable bundles) ───────────────────────────────────────
      buyGemPack: (packId) => {
        const pack: GemPackItem | undefined = GEM_PACKS.find((p) => p.id === packId);
        if (!pack) return false;
        const { gems } = get();
        if (gems < pack.gemCost) return false;

        set((state) => {
          // Pack stamina goes into reserve — not active (reserve is uncapped)
          const newReserve = state.staminaReserve + pack.stamina;

          // Grant cosmetics from the pack (mark owned but not equipped)
          const newOwned = { ...state.ownedCosmetics };
          for (const id of pack.cosmeticIds) {
            newOwned[id] = true;
          }

          return {
            gems:           state.gems - pack.gemCost,
            coins:          state.coins + pack.coins,
            staminaReserve: newReserve,
            ownedCosmetics: newOwned,
            statistics: {
              ...state.statistics,
              totalCoinsEarned: state.statistics.totalCoinsEarned + pack.coins,
            },
          };
        });
        return true;
      },

      // ── Phase 3 — Jackpot spin wheel ──────────────────────────────────

      canFreeSpin: () => {
        const { lastSpinDate } = get();
        if (!lastSpinDate) return true;
        const elapsedHours = (Date.now() - new Date(lastSpinDate).getTime()) / 3_600_000;
        return elapsedHours >= SPIN_CONFIG.freeSpinCooldownHours;
      },

      canExtraSpin: () => {
        const { extraSpinsToday, lastExtraSpinDate } = get();
        const today = getTodayUTCString();
        const usedToday = lastExtraSpinDate === today ? extraSpinsToday : 0;
        return usedToday < SPIN_CONFIG.extraSpinsPerDay;
      },

      performSpin: (isFree) => {
        const s = get();
        const today = getTodayUTCString();

        if (isFree) {
          if (!s.canFreeSpin()) return null;
        } else {
          const usedToday = s.lastExtraSpinDate === today ? s.extraSpinsToday : 0;
          if (usedToday >= SPIN_CONFIG.extraSpinsPerDay) return null;
          if (s.coins < SPIN_CONFIG.extraSpinCost) return null;
        }

        const rewards = SPIN_CONFIG.rewards as readonly SpinReward[];
        const idx    = pickRewardIndex(rewards);
        const reward = { ...rewards[idx] };

        // Jackpot: multiply and cap
        if (reward.isJackpot) {
          reward.amount = Math.min(
            reward.amount * SPIN_CONFIG.jackpotMultiplier,
            SPIN_CONFIG.jackpotMaxReward,
          );
        }

        set((cur) => {
          const usedToday = cur.lastExtraSpinDate === today ? cur.extraSpinsToday : 0;
          let newCoins = cur.coins;
          if (!isFree) newCoins -= SPIN_CONFIG.extraSpinCost;

          // Grant reward
          let newGems  = cur.gems;
          let newStats = cur.statistics;
          let newConsumables = cur.consumables;
          let newOwnedCosmetics = cur.ownedCosmetics;

          if (reward.type === 'coins' || reward.type === 'jackpot') {
            newCoins += reward.amount;
            newStats  = { ...cur.statistics, totalCoinsEarned: cur.statistics.totalCoinsEarned + reward.amount };
          } else if (reward.type === 'gems') {
            newGems += reward.amount;
          } else if (reward.type === 'consumable' && reward.itemId) {
            const cid = reward.itemId as ConsumableId;
            newConsumables = { ...cur.consumables, [cid]: (cur.consumables[cid] ?? 0) + reward.amount };
          } else if (reward.type === 'cosmetic') {
            // Grant sticker_classic as cosmetic spin reward
            newOwnedCosmetics = { ...cur.ownedCosmetics, sticker_classic: true };
          }

          return {
            coins:            newCoins,
            gems:             newGems,
            statistics:       newStats,
            consumables:      newConsumables,
            ownedCosmetics:   newOwnedCosmetics,
            lastSpinDate:     isFree ? new Date().toISOString() : cur.lastSpinDate,
            extraSpinsToday:  isFree ? cur.extraSpinsToday : usedToday + 1,
            lastExtraSpinDate: isFree ? cur.lastExtraSpinDate : today,
          };
        });

        // Schedule "spin ready" notification after a free spin
        if (isFree && get().settings.notifications) {
          notificationService.scheduleSpinReady(SPIN_CONFIG.freeSpinCooldownHours);
        }

        return reward;
      },

      // ── Coin → Gem exchange ────────────────────────────────────────────

      buyCoinGemExchange: (id) => {
        const tier = COIN_GEM_EXCHANGES.find((t) => t.id === id);
        if (!tier) return false;
        const { coins, coinGemExchanges } = get();
        const purchased = coinGemExchanges[id] ?? 0;
        if (purchased >= tier.maxPurchases) return false;  // lifetime cap reached
        if (coins < tier.coins) return false;               // insufficient coins
        set((s) => ({
          coins: s.coins - tier.coins,
          gems:  s.gems  + tier.gems,
          coinGemExchanges: {
            ...s.coinGemExchanges,
            [id]: (s.coinGemExchanges[id] ?? 0) + 1,
          },
        }));
        return true;
      },

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
          hasNewAchievement: false,
          gemCosmetics: {},
          ownedCosmetics: {},
          equippedCosmetics: {},
          lastSpinDate:      null,
          extraSpinsToday:   0,
          lastExtraSpinDate: null,
          energy:               MAX_ENERGY,
          staminaReserve:       0,
          lastEnergyRefillTime: null,
          coinGemExchanges:     {},
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
          achievements: ACHIEVEMENTS.map((def) => {
            const saved_a = (saved.achievements ?? []).find((sa: Achievement) => sa.id === def.id);
            return { ...def, unlocked: saved_a?.unlocked ?? false, unlockedAt: saved_a?.unlockedAt ?? null };
          }),
          hasNewAchievement: false, // always start fresh — badge clears on each app launch
          gemCosmetics:            saved.gemCosmetics            ?? {},
          ownedCosmetics:          saved.ownedCosmetics          ?? {},
          equippedCosmetics:       saved.equippedCosmetics       ?? {},
          lastSpinDate:            saved.lastSpinDate            ?? null,
          extraSpinsToday:         saved.extraSpinsToday         ?? 0,
          lastExtraSpinDate:       saved.lastExtraSpinDate       ?? null,
          gems:                    saved.gems                    ?? 0,
          multiplierSessionsLeft:  saved.multiplierSessionsLeft  ?? 0,
          unclaimedLevelRewards:   saved.unclaimedLevelRewards   ?? [],
          missions:                saved.missions                 ?? [],
          missionsDate:            saved.missionsDate             ?? null,
          dailyXPEarned:           saved.dailyXPEarned            ?? 0,
          dailyXPDate:             saved.dailyXPDate              ?? null,
          isPremium:               saved.isPremium                ?? false,
          energy:                  saved.energy                   ?? MAX_ENERGY,
          staminaReserve:          saved.staminaReserve            ?? 0,
          lastEnergyRefillTime:    saved.lastEnergyRefillTime      ?? null,
          coinGemExchanges:        saved.coinGemExchanges          ?? {},
        };
      },
    },
  ),
);
