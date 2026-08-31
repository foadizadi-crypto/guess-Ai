/**
 * artifacts/artifacts/mobile/store/userStore.ts
 * Global State Management Store for GUESSAi Game Engine.
 * Fully expanded production-grade implementation containing all complex game logic,
 * level-up equations, achievement tracking matrices, daily mission loops, 
 * atomic double-spending security updates, and multi-state network controls.
 */

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
  jackpotPayout,
  type SpinReward,
} from '@/constants/spinConfig';
import { getLevelReward } from '@/constants/levelRewards';
import { GEM_PACKS, STAMINA_PACKS, type GemPackItem } from '@/constants/shopConfig';
import { type ConsumableId, CONSUMABLE_PRICES } from '@/constants/shopData';
import { getDailyMissions, type MissionType } from '@/constants/missions';
import {
  DAILY_XP_CAP,
  COINS_PERFECT_GAME_BONUS,
  FREE_MISSIONS_PER_DAY,
  PREMIUM_MISSIONS_PER_DAY,
  PREMIUM_COIN_MULTIPLIER,
  MAX_LEVEL,
  MAX_ENERGY,
  ENERGY_DAILY_REWARD,
  STAMINA_PER_GAME,
  MAX_STAMINA_UPGRADE_LEVEL,
  getEnergyCap,
  getRefillIntervalMin,
  getUpgradeGemCost,
  COIN_GEM_EXCHANGES,
  type CoinGemExchangeId,
} from '@/constants/economy';
import { notificationService } from '@/services/NotificationService';
import { calculateLevel, isToday, getTodayUTCString } from '@/utils';
import { WING_SOURCES } from '@/constants/characterSources';

const DEFAULT_NETWORK_MODE: 'auto' | 'online' | 'offline' =
  process.env.EXPO_PUBLIC_USE_ONLINE_AI === 'true' ? 'online' : 'auto';

export type ConsumableInventory = Record<ConsumableId, number>;

const DEFAULT_CONSUMABLES: ConsumableInventory = {
  clarity_bomb:     0,
  combo_shield:     0,
  time_boost:       0,
  multiplier_2x:    0,
  error_nullifier:  0,
};

interface UserState {
  // Profile State Attributes
  username: string;
  // The UID this `username` was verified for (via server-confirmed nickname
  // registration/lookup). A device that previously played as account A and
  // now signs in as account B must never treat A's leftover `username` as
  // B's registered nickname — every read of `username` for gating purposes
  // must first check `nicknameUid === current uid`.
  nicknameUid: string | null;
  coins: number;
  gems: number;
  xp: number;
  level: number;
  isPremium: boolean;
  selectedAvatarId: string;
  avatars: Avatar[];
  powerUps: PowerUpInventory;
  consumables: ConsumableInventory;
  multiplierSessionsLeft: number;
  avatarFragments: number;

  // Network Topology Controllers
  networkMode: 'auto' | 'online' | 'offline';
  setNetworkMode: (mode: 'auto' | 'online' | 'offline') => void;

  // Game Engine Statistics Tracking
  bestScore: number;
  dailyReward: DailyReward;
  achievements: Achievement[];
  hasNewAchievement: boolean;
  settings: UserSettings;
  statistics: UserStatistics;

  // Security Anti-Farming State Metrics
  dailyXPEarned: number;
  dailyXPDate: string | null;

  // Progression Milestones
  unclaimedLevelRewards: number[];

  // Daily Mission Engine Vectors
  missions: ActiveMission[];
  missionsDate: string | null;

  // Collections Cosmetics Matrices
  gemCosmetics: Record<string, { owned: boolean; equipped: boolean }>;
  ownedCosmetics: Record<string, boolean>;
  equippedCosmetics: Partial<Record<CosmeticType, string>>;
  coinGemExchanges: Record<CoinGemExchangeId, number>;

  // Spin Wheel Probability State Elements
  lastSpinDate:    string | null;
  extraSpinsToday: number;
  lastExtraSpinDate: string | null;

  // Single upgradable stamina source (reserve pool removed in economy v2).
  // energy may OVERFLOW above the cap via ads/packs/rewards; timed refill
  // pauses while above the cap. staminaSourceLevel: 0 (base) … 3.
  energy: number;
  staminaSourceLevel: number;
  lastEnergyRefillTime: number | null;
  /** ISO timestamp of first launch — drives the 48 h first-upgrade discount. */
  accountCreatedAt: string | null;

  // Wings Cosmetic Inventory
  ownedWings: string[];
  equippedWing: string | null;

  // Store & Progression Actions Pipelines
  setUsername: (username: string) => void;
  /** Records a nickname as verified for a specific uid (see `nicknameUid`). */
  setVerifiedNickname: (uid: string, nickname: string) => void;
  /** True only if `username` was verified for exactly this uid. */
  isNicknameVerifiedFor: (uid: string | null) => boolean;
  /** Apply the existing backend profile to this signed-in UID's local state. */
  hydrateFromBackend: (uid: string, profile: {
    username?: string;
    coins?: number;
    gems?: number;
    xp?: number;
    level?: number;
    isPremium?: boolean;
    selectedAvatarId?: string;
    totalGamesPlayed?: number;
    totalWins?: number;
    statistics?: Partial<UserStatistics>;
    achievements?: Array<{ id: string; unlocked?: boolean; unlockedAt?: string | null }>;
    avatars?: Array<{ id: string; unlocked: boolean }>;
    powerUps?: PowerUpInventory;
    consumables?: Record<string, number>;
    multiplierSessionsLeft?: number;
    avatarFragments?: number;
    bestScore?: number;
    dailyReward?: DailyReward;
    gemCosmetics?: Record<string, { owned: boolean; equipped: boolean }>;
    ownedCosmetics?: Record<string, boolean>;
    equippedCosmetics?: Partial<Record<CosmeticType, string>>;
    coinGemExchanges?: Record<string, number>;
    lastSpinDate?: string | null;
    extraSpinsToday?: number;
    lastExtraSpinDate?: string | null;
    energy?: number;
    staminaSourceLevel?: number;
    lastEnergyRefillTime?: number | null;
    ownedWings?: string[];
    equippedWing?: string | null;
    dailyXPEarned?: number;
    dailyXPDate?: string | null;
    unclaimedLevelRewards?: number[];
    missions?: ActiveMission[];
    missionsDate?: string | null;
    accountCreatedAt?: string | null;
  }) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addGems: (amount: number) => void;
  spendGems: (amount: number) => boolean;
  addXP: (amount: number) => void;
  unlockAvatar: (avatarId: string) => boolean;
  buyAvatar: (avatarId: string, coinCost: number) => boolean;
  selectAvatar: (avatarId: string) => void;
  buyPowerUp: (powerUpId: PowerUpId, coinCost: number) => boolean;
  usePowerUp: (powerUpId: PowerUpId) => boolean;
  buyConsumable: (id: ConsumableId, coinCost: number) => boolean;
  useConsumable: (id: ConsumableId) => boolean;
  addConsumable: (id: ConsumableId, quantity?: number) => void;
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
  buyGemCosmetic: (id: string, gemCost: number) => boolean;
  equipGemCosmetic: (id: string) => void;
  buyCosmetic: (id: string, coinCost: number) => boolean;
  equipCosmetic: (id: string) => void;
  grantStarterPack: () => void;
  canFreeSpin:   () => boolean;
  canExtraSpin:  () => boolean;
  performSpin:   (isFree: boolean) => SpinReward | null;
  tickEnergy: () => void;
  spendEnergy: (amount?: number) => boolean;
  addStamina: (amount: number) => void;
  refillEnergyWithGems: (gemCost: number) => boolean;
  /** Unlock the next stamina source level with gems. Returns false when maxed or unaffordable. */
  upgradeStaminaSource: () => boolean;
  buyGemPack: (packId: string) => boolean;
  buyCoinGemExchange: (id: CoinGemExchangeId) => boolean;
  purchaseWing: (wingId: string, gemCost: number) => boolean;
  equipWing: (wingId: string | null) => void;
}

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
  hardGamesPlayed: 0,
  favoriteCategory: null,
};

const defaultDailyReward: DailyReward = {
  lastClaimed: null,
  lastClaimDate: null,
  streak: 0,
  currentDay: 0,
  nextRewardAmount: 15,
};

const defaultCoinGemExchanges: Record<CoinGemExchangeId, number> = {
  coin_gem_30k: 0,
  coin_gem_100k: 0,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      username: '',
      nicknameUid: null,
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
      coinGemExchanges: { ...defaultCoinGemExchanges },
      lastSpinDate:       null,
      extraSpinsToday:    0,
      lastExtraSpinDate:  null,
      energy:               MAX_ENERGY,
      staminaSourceLevel:   0,
      lastEnergyRefillTime: null,
      accountCreatedAt:     new Date().toISOString(),
      ownedWings:   [],
      equippedWing: null,
      settings: { ...defaultSettings },
      statistics: { ...defaultStatistics },
      dailyXPEarned: 0,
      dailyXPDate: null,
      unclaimedLevelRewards: [],
      missions: [],
      missionsDate: null,

      networkMode: DEFAULT_NETWORK_MODE,
      setNetworkMode: (mode) => set({ networkMode: mode }),

      setUsername: (username) => set({ username }),
      setVerifiedNickname: (uid, nickname) => set({ username: nickname, nicknameUid: uid }),
      isNicknameVerifiedFor: (uid) => {
        const state = get();
        return !!uid && state.nicknameUid === uid && !!state.username;
      },
      hydrateFromBackend: (uid, profile) => set((state) => {
        const remoteAchievements = profile.achievements;
        const mergedAchievements = remoteAchievements?.length
          ? state.achievements.map((local) => {
              const remote = remoteAchievements.find((a) => a.id === local.id);
              if (!remote?.unlocked) return local;
              return {
                ...local,
                unlocked: true,
                unlockedAt: remote.unlockedAt ?? local.unlockedAt,
              };
            })
          : state.achievements;

        const mergedAvatars = Array.isArray(profile.avatars)
          ? state.avatars.map((local) => {
              const remote = profile.avatars?.find((a) => a.id === local.id);
              return remote ? { ...local, unlocked: !!remote.unlocked } : local;
            })
          : state.avatars;

        return {
          username: profile.username?.trim() || state.username,
          nicknameUid: profile.username?.trim() ? uid : state.nicknameUid,
          coins: typeof profile.coins === 'number' ? profile.coins : state.coins,
          gems: typeof profile.gems === 'number' ? profile.gems : state.gems,
          xp: typeof profile.xp === 'number' ? profile.xp : state.xp,
          level: typeof profile.level === 'number' ? profile.level : state.level,
          isPremium: typeof profile.isPremium === 'boolean' ? profile.isPremium : state.isPremium,
          selectedAvatarId: profile.selectedAvatarId || state.selectedAvatarId,
          achievements: mergedAchievements,
          avatars: mergedAvatars,
          powerUps: profile.powerUps ?? state.powerUps,
          consumables: profile.consumables
            ? { ...state.consumables, ...profile.consumables }
            : state.consumables,
          multiplierSessionsLeft: typeof profile.multiplierSessionsLeft === 'number'
            ? profile.multiplierSessionsLeft : state.multiplierSessionsLeft,
          avatarFragments: typeof profile.avatarFragments === 'number'
            ? profile.avatarFragments : state.avatarFragments,
          bestScore: typeof profile.bestScore === 'number' ? profile.bestScore : state.bestScore,
          dailyReward: profile.dailyReward ?? state.dailyReward,
          gemCosmetics: profile.gemCosmetics ?? state.gemCosmetics,
          ownedCosmetics: profile.ownedCosmetics ?? state.ownedCosmetics,
          equippedCosmetics: profile.equippedCosmetics ?? state.equippedCosmetics,
          coinGemExchanges: profile.coinGemExchanges
            ? { ...defaultCoinGemExchanges, ...profile.coinGemExchanges }
            : state.coinGemExchanges,
          lastSpinDate: profile.lastSpinDate !== undefined ? profile.lastSpinDate : state.lastSpinDate,
          extraSpinsToday: typeof profile.extraSpinsToday === 'number'
            ? profile.extraSpinsToday : state.extraSpinsToday,
          lastExtraSpinDate: profile.lastExtraSpinDate !== undefined
            ? profile.lastExtraSpinDate : state.lastExtraSpinDate,
          energy: typeof profile.energy === 'number' ? profile.energy : state.energy,
          staminaSourceLevel: typeof profile.staminaSourceLevel === 'number'
            ? profile.staminaSourceLevel : state.staminaSourceLevel,
          lastEnergyRefillTime: profile.lastEnergyRefillTime !== undefined
            ? profile.lastEnergyRefillTime : state.lastEnergyRefillTime,
          ownedWings: Array.isArray(profile.ownedWings) ? profile.ownedWings : state.ownedWings,
          equippedWing: profile.equippedWing !== undefined ? profile.equippedWing : state.equippedWing,
          dailyXPEarned: typeof profile.dailyXPEarned === 'number'
            ? profile.dailyXPEarned : state.dailyXPEarned,
          dailyXPDate: profile.dailyXPDate !== undefined ? profile.dailyXPDate : state.dailyXPDate,
          unclaimedLevelRewards: Array.isArray(profile.unclaimedLevelRewards)
            ? profile.unclaimedLevelRewards : state.unclaimedLevelRewards,
          missions: Array.isArray(profile.missions) ? profile.missions : state.missions,
          missionsDate: profile.missionsDate !== undefined ? profile.missionsDate : state.missionsDate,
          accountCreatedAt: profile.accountCreatedAt ?? state.accountCreatedAt,
          statistics: {
            ...state.statistics,
            ...(profile.statistics ?? {}),
            totalGamesPlayed: typeof profile.totalGamesPlayed === 'number'
              ? profile.totalGamesPlayed
              : (profile.statistics?.totalGamesPlayed ?? state.statistics.totalGamesPlayed),
            totalWins: typeof profile.totalWins === 'number'
              ? profile.totalWins
              : (profile.statistics?.totalWins ?? state.statistics.totalWins),
          },
        };
      }),
      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
      
      spendCoins: (amount) => {
        let success = false;
        set((state) => {
          if (state.coins >= amount) {
            success = true;
            return { coins: state.coins - amount };
          }
          return {};
        });
        return success;
      },

      addGems: (amount) => set((state) => ({ gems: state.gems + amount })),
      
      spendGems: (amount) => {
        let success = false;
        set((state) => {
          if (state.gems >= amount) {
            success = true;
            return { gems: state.gems - amount };
          }
          return {};
        });
        return success;
      },

      // --- ADVANCED PROGRESION VECTOR ENGINE ---
      addXP: (amount) => set((state) => {
        const todayStr = getTodayUTCString();
        let currentDailyXP = state.dailyXPDate === todayStr ? state.dailyXPEarned : 0;
        
        if (currentDailyXP >= DAILY_XP_CAP) {
          console.log('[Anti-Farming Security] Daily XP limit hit.');
          return {};
        }

        const allowedXP = Math.min(amount, DAILY_XP_CAP - currentDailyXP);
        const finalXP = state.xp + allowedXP;
        const finalDailyXP = currentDailyXP + allowedXP;

        const calculatedLevel = calculateLevel(finalXP);
        let updatedUnclaimedRewards = [...state.unclaimedLevelRewards];

        if (calculatedLevel > state.level) {
          for (let l = state.level + 1; l <= calculatedLevel; l++) {
            if (l <= MAX_LEVEL) {
              updatedUnclaimedRewards.push(l);
              notificationService.scheduleLocalNotification({
                title: 'Level Up! 🎉',
                body: `Congratulations, you reached Level ${l}! Claim items in profile screen now.`,
                trigger: null
              });
            }
          }
        }

        const newLevel = Math.min(MAX_LEVEL, calculatedLevel);
        const unlockedAvatars = state.avatars.map((a) =>
          !a.unlocked && a.unlockLevel !== undefined && a.unlockLevel <= newLevel
            ? { ...a, unlocked: true }
            : a
        );

        return {
          xp: finalXP,
          level: newLevel,
          dailyXPEarned: finalDailyXP,
          dailyXPDate: todayStr,
          unclaimedLevelRewards: updatedUnclaimedRewards,
          avatars: unlockedAvatars,
        };
      }),

      unlockAvatar: (avatarId) => {
        let success = false;
        set((state) => {
          const exists = state.avatars.some((a) => a.id === avatarId);
          if (exists) {
            success = true;
            return {
              avatars: state.avatars.map((a) => a.id === avatarId ? { ...a, unlocked: true } : a)
            };
          }
          return {};
        });
        return success;
      },

      // --- SECURE ATOMIC TRANSACTION PIPELINES ---
      buyAvatar: (avatarId, coinCost) => {
        let success = false;
        set((state) => {
          if (state.coins >= coinCost) {
            const current = state.avatars.find((a) => a.id === avatarId);
            if (current && !current.unlocked) {
              success = true;
              return {
                coins: state.coins - coinCost,
                avatars: state.avatars.map((a) => a.id === avatarId ? { ...a, unlocked: true } : a)
              };
            }
          }
          return {};
        });
        return success;
      },

      selectAvatar: (avatarId) => set({ selectedAvatarId: avatarId }),

      buyPowerUp: (powerUpId, coinCost) => {
        let success = false;
        set((state) => {
          if (state.coins >= coinCost) {
            success = true;
            return {
              coins: state.coins - coinCost,
              powerUps: {
                ...state.powerUps,
                [powerUpId]: (state.powerUps[powerUpId] || 0) + 1
              }
            };
          }
          return {};
        });
        return success;
      },

      usePowerUp: (powerUpId) => {
        let success = false;
        set((state) => {
          const current = state.powerUps[powerUpId] || 0;
          if (current > 0) {
            success = true;
            return {
              powerUps: {
                ...state.powerUps,
                [powerUpId]: current - 1
              }
            };
          }
          return {};
        });
        return success;
      },

      buyConsumable: (id, coinCost) => {
        let success = false;
        set((state) => {
          if (state.coins >= coinCost) {
            success = true;
            return {
              coins: state.coins - coinCost,
              consumables: {
                ...state.consumables,
                [id]: (state.consumables[id] || 0) + 1
              }
            };
          }
          return {};
        });
        return success;
      },

      useConsumable: (id) => {
        let success = false;
        set((state) => {
          const current = state.consumables[id] || 0;
          if (current > 0) {
            success = true;
            return {
              consumables: {
                ...state.consumables,
                [id]: current - 1
              }
            };
          }
          return {};
        });
        return success;
      },

      addConsumable: (id, quantity = 1) => set((state) => ({
        consumables: {
          ...state.consumables,
          [id]: (state.consumables[id] || 0) + quantity
        }
      })),

      decrementMultiplierSession: () => set((state) => ({
        multiplierSessionsLeft: Math.max(0, state.multiplierSessionsLeft - 1)
      })),

      mockPurchaseCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
      updateBestScore: (score) => set({ bestScore: score }),
      
      // --- CALIBRATED DAILY STREAK SCHEDULER ---
      claimDailyReward: () => {
        const todayStr = getTodayUTCString();
        if (get().dailyReward.lastClaimDate === todayStr) {
          console.log('[Daily Streak Engine] Reward already claimed for today.');
          return 0;
        }
        const currentDayIdx = get().dailyReward.currentDay ?? 0;
        const amt = DAILY_REWARDS[currentDayIdx]?.coins ?? DAILY_REWARDS[0].coins;

        set((state) => {
          if (state.dailyReward.lastClaimDate === todayStr) return {};

          const nextDayIdx = (currentDayIdx + 1) % DAILY_REWARDS.length;
          const configNextAmount = DAILY_REWARDS[nextDayIdx].coins;
          const currentStreak = state.dailyReward.streak;

          // Daily reward grants +10 energy — allowed to overflow above the cap
          // so the reward is never wasted (timed refill pauses above the cap).
          const newEnergy = state.energy + ENERGY_DAILY_REWARD;
          return {
            coins: state.coins + amt,
            energy: newEnergy,
            dailyReward: {
              lastClaimed: new Date().toISOString(),
              lastClaimDate: todayStr,
              streak: currentStreak + 1,
              currentDay: nextDayIdx,
              nextRewardAmount: configNextAmount
            }
          };
        });
        return amt;
      },

      updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
      updateLanguage: (language) => set((state) => ({ settings: { ...state.settings, language } })),
      updateStatistics: (stats) => set((state) => ({ statistics: { ...state.statistics, ...stats } })),
      
      claimLevelReward: (level) => {
        let success = false;
        let rewardBonusXP = 0;

        set((state) => {
          if (!state.unclaimedLevelRewards.includes(level)) return {};
          success = true;
          const configurationPack = getLevelReward(level);
          if (!configurationPack) {
            return { unclaimedLevelRewards: state.unclaimedLevelRewards.filter((l) => l !== level) };
          }

          // Economy v2: 10-level milestones grant +5 gems (free-player gem faucet)
          const newGems = state.gems + (configurationPack.gems ?? 0);
          let newCoins = state.coins + configurationPack.coins;
          const newConsumables = { ...state.consumables };
          const newOwnedCosmetics = { ...state.ownedCosmetics };
          const avatarsToUnlock: string[] = [];
          rewardBonusXP = configurationPack.bonusXP ?? 0;

          for (const item of configurationPack.items) {
            switch (item.type) {
              case 'avatar':
                avatarsToUnlock.push(item.id);
                break;
              case 'extra_coins':
              case 'coins':
                // already included in configurationPack.coins via buildLevelRewards
                break;
              case 'error_nullifier':
              case 'consumable': {
                const rawId = item.id.startsWith('error_nullifier') ? 'error_nullifier' : item.id;
                const consId = rawId as ConsumableId;
                newConsumables[consId] = (newConsumables[consId] ?? 0) + (item.quantity ?? 1);
                break;
              }
              default:
                // avatar_frame, animated_frame, badge, silver_badge, crown, title,
                // legendary_skin, skin, skin_piece, rare_sticker, game_theme,
                // particle_effect, entrance_effect → grant as owned cosmetic
                newOwnedCosmetics[item.id] = true;
                break;
            }
          }

          // Unlock known avatars; unknown ids are kept as owned cosmetics so the grant is never dropped.
          let newAvatars = state.avatars;
          if (avatarsToUnlock.length > 0) {
            const known = new Set(state.avatars.map((av) => av.id));
            newAvatars = state.avatars.map((av) =>
              avatarsToUnlock.includes(av.id) ? { ...av, unlocked: true } : av
            );
            for (const id of avatarsToUnlock) {
              if (!known.has(id)) newOwnedCosmetics[id] = true;
            }
          }

          return {
            coins: newCoins,
            gems: newGems,
            consumables: newConsumables,
            ownedCosmetics: newOwnedCosmetics,
            avatars: newAvatars,
            unclaimedLevelRewards: state.unclaimedLevelRewards.filter((l) => l !== level),
          };
        });

        // Grant bonus XP outside set() — addXP recalculates level from XP
        if (success && rewardBonusXP > 0) {
          get().addXP(rewardBonusXP);
        }
        return success;
      },

      // --- MISSION LOGISTICS ENGINE ---
      refreshDailyMissions: () => set((state) => {
        const todayStr = getTodayUTCString();
        if (state.missionsDate === todayStr && state.missions.length > 0) return {};

        // getDailyMissions(count, dateStr) — free players get 3 missions/day,
        // premium 5 (see constants/missions.ts).
        const missionCount = state.isPremium ? 5 : 3;
        const operationalMissions = getDailyMissions(missionCount, todayStr);
        const mappedActiveMissions: ActiveMission[] = operationalMissions.map((m) => ({
          id: m.id,
          type: m.type,
          label: m.label,
          description: m.description,
          target: m.target,
          progress: 0,
          // The mission pool only defines a coin reward; gems and XP are not
          // part of the daily-mission economy.
          reward: m.reward,
          completed: false,
          rewardClaimed: false,
          param: m.param
        }));

        return {
          missions: mappedActiveMissions,
          missionsDate: todayStr
        };
      }),

      updateMissionProgress: (type, increment, param) => set((state) => {
        const updatedMissions = state.missions.map((m) => {
          if (m.type !== type || m.completed) return m;
          if (param && m.param !== param) return m;

          const updatedCurrent = Math.min(m.target, m.progress + increment);
          const isNowCompleted = updatedCurrent >= m.target;

          if (isNowCompleted && !m.completed) {
            notificationService.scheduleLocalNotification({
              title: 'Mission Complete! 🎯',
              body: `Your mission "${m.description}" is finished. Open lobby to claim rewards!`,
              trigger: null
            });
          }

          return {
            ...m,
            progress: updatedCurrent,
            completed: isNowCompleted
          };
        });

        return { missions: updatedMissions };
      }),

      claimMissionReward: (missionId) => {
        let success = false;
        set((state) => {
          const targetMission = state.missions.find((m) => m.id === missionId);
          if (targetMission && targetMission.completed && !targetMission.rewardClaimed) {
            success = true;
            return {
              coins: state.coins + targetMission.reward,
              missions: state.missions.map((m) =>
                m.id === missionId ? { ...m, rewardClaimed: true } : m
              )
            };
          }
          return {};
        });

        return success;
      },

      setPremium: (value) => set({ isPremium: value }),
      
      resetUser: () => set({
        username: '',
        nicknameUid: null,
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
        unclaimedLevelRewards: [],
        missions: [],
        missionsDate: null,
        gemCosmetics: {},
        ownedCosmetics: {},
        equippedCosmetics: {},
        coinGemExchanges: { ...defaultCoinGemExchanges },
        lastSpinDate: null,
        extraSpinsToday: 0,
        lastExtraSpinDate: null,
        energy: MAX_ENERGY,
        staminaSourceLevel: 0,
        lastEnergyRefillTime: null,
        accountCreatedAt: new Date().toISOString(),
        ownedWings: [],
        equippedWing: null,
        statistics: { ...defaultStatistics },
        dailyXPEarned: 0,
        dailyXPDate: null,
      }),

      // --- CRITICAL AUDIT EVALUATOR ---
      checkAndUnlockAchievements: (ctx) => {
        const state = get();
        const stats = state.statistics;
        const ownedCosmeticsCount = Object.keys(state.ownedCosmetics).length;
        const currentAchievements = state.achievements;
        const newlyUnlocked: AchievementDef[] = [];
        let coinGrant = 0;
        let xpGrant = 0;
        let gemGrant = 0;
        const cosmeticGrants: string[] = [];

        const modifiedAchievements = currentAchievements.map((ach) => {
          if (ach.unlocked) return ach;

          const achievementCtx = {
            stats,
            avatars: state.avatars,
            ownedCosmeticsCount,
            isPerfectGame: ctx.isPerfectGame,
            maxComboThisGame: ctx.maxComboThisGame,
            dailyLoginStreak: state.dailyReward.streak,
          };
          const isConditionMet = checkAchievementCondition(ach.id, achievementCtx);
          if (isConditionMet) {
            const def = ACHIEVEMENTS.find((d) => d.id === ach.id);
            if (def) {
              newlyUnlocked.push(def);
              coinGrant += def.rewardCoins;
              xpGrant += def.rewardXP;
              gemGrant += def.rewardGems ?? 0;
              if (def.rewardCosmeticId) cosmeticGrants.push(def.rewardCosmeticId);
            }
            return {
              ...ach,
              unlocked: true,
              unlockedAt: new Date().toISOString()
            };
          }
          return ach;
        });

        if (newlyUnlocked.length > 0) {
          set((s) => {
            const newOwnedCosmetics = { ...s.ownedCosmetics };
            for (const cosmeticId of cosmeticGrants) {
              newOwnedCosmetics[cosmeticId] = true;
            }
            return {
              achievements: modifiedAchievements,
              hasNewAchievement: true,
              coins: s.coins + coinGrant,
              gems: s.gems + gemGrant,
              ownedCosmetics: newOwnedCosmetics,
            };
          });

          if (xpGrant > 0) {
            get().addXP(xpGrant);
          }

          newlyUnlocked.forEach((unlockedAch) => {
            notificationService.scheduleLocalNotification({
              title: 'Achievement Unlocked! 🏆',
              body: `You earned the "${unlockedAch.title}" badge!`,
              trigger: null
            });
          });
        }

        return newlyUnlocked;
      },

      clearNewAchievementBadge: () => set({ hasNewAchievement: false }),

      buyGemCosmetic: (id, gemCost) => {
        let success = false;
        set((state) => {
          if (state.gems >= gemCost && !state.gemCosmetics[id]?.owned) {
            success = true;
            return {
              gems: state.gems - gemCost,
              gemCosmetics: {
                ...state.gemCosmetics,
                [id]: { owned: true, equipped: false }
              }
            };
          }
          return {};
        });
        return success;
      },

      equipGemCosmetic: (id) => set((state) => ({
        gemCosmetics: Object.keys(state.gemCosmetics).reduce((acc, key) => {
          acc[key] = {
            ...state.gemCosmetics[key],
            equipped: key === id
          };
          return acc;
        }, {} as any)
      })),

      buyCosmetic: (id, coinCost) => {
        let success = false;
        set((state) => {
          if (state.coins >= coinCost && !state.ownedCosmetics[id]) {
            success = true;
            return {
              coins: state.coins - coinCost,
              ownedCosmetics: { ...state.ownedCosmetics, [id]: true }
            };
          }
          return {};
        });
        return success;
      },

      equipCosmetic: (id) => set((state) => ({
        equippedCosmetics: { ...state.equippedCosmetics, frame: id }
      })),

      // Spec: Starter Pack ($2.00) → 5 Combo Shields + 3 Clarity Bombs + Silver Frame
      // (NOT gems — gem grants via IAP are handled by the gem-pack purchase flow)
      grantStarterPack: () => set((state) => ({
        coins: state.coins + 500,
        consumables: {
          ...state.consumables,
          combo_shield: (state.consumables.combo_shield ?? 0) + 5,
          clarity_bomb: (state.consumables.clarity_bomb ?? 0) + 3,
        },
        ownedCosmetics: { ...state.ownedCosmetics, frame_silver: true },
      })),

      canFreeSpin: () => {
        const lastSpin = get().lastSpinDate;
        if (!lastSpin) return true;
        return !isToday(lastSpin);
      },

      canExtraSpin: () => {
        const todayStr = getTodayUTCString();
        const state = get();
        const currentExtraSpins = state.lastExtraSpinDate === todayStr ? state.extraSpinsToday : 0;
        return (
          currentExtraSpins < SPIN_CONFIG.extraSpinsPerDay &&
          state.coins >= SPIN_CONFIG.extraSpinCost
        );
      },

      // --- RANDOMIZED JACKPOT SPIN WHEEL CONTROLLER ---
      performSpin: (isFree) => {
        const todayStr = getTodayUTCString();
        let selectedReward: SpinReward | null = null;

        if (isFree && !get().canFreeSpin()) return null;
        if (!isFree && !get().canExtraSpin()) return null;

        const drawnRewardIndex = pickRewardIndex(SPIN_CONFIG.rewards);
        selectedReward = SPIN_CONFIG.rewards[drawnRewardIndex] || null;

        if (!selectedReward) return null;

        const reward = selectedReward;
        let granted = false;

        set((state) => {
          // Re-validate inside the transaction: a paid spin must actually charge
          // the player, and a double tap must not spin twice on one payment.
          const spinsUsedToday = state.lastExtraSpinDate === todayStr ? state.extraSpinsToday : 0;
          if (!isFree) {
            if (spinsUsedToday >= SPIN_CONFIG.extraSpinsPerDay) return {};
            if (state.coins < SPIN_CONFIG.extraSpinCost) return {};
          } else if (state.lastSpinDate && isToday(state.lastSpinDate)) {
            return {};
          }

          granted = true;
          let updatedCoins = state.coins - (isFree ? 0 : SPIN_CONFIG.extraSpinCost);
          let updatedGems = state.gems;
          let updatedEnergy = state.energy;
          const updatedConsumables = { ...state.consumables };
          const updatedOwnedCosmetics = { ...state.ownedCosmetics };

          switch (reward.type) {
            case 'coins':
              updatedCoins += reward.amount;
              break;
            case 'gems':
              updatedGems += reward.amount;
              break;
            case 'jackpot':
              updatedCoins += jackpotPayout(reward.amount);
              break;
            case 'consumable': {
              const consId = (reward.itemId ?? reward.id) as ConsumableId;
              updatedConsumables[consId] = (updatedConsumables[consId] ?? 0) + reward.amount;
              break;
            }
            case 'cosmetic':
              updatedOwnedCosmetics[reward.itemId ?? reward.id] = true;
              break;
          }

          return {
            coins: updatedCoins,
            gems: updatedGems,
            energy: updatedEnergy,
            consumables: updatedConsumables,
            ownedCosmetics: updatedOwnedCosmetics,
            extraSpinsToday: isFree ? state.extraSpinsToday : spinsUsedToday + 1,
            lastExtraSpinDate: isFree ? state.lastExtraSpinDate : todayStr,
            lastSpinDate: isFree ? new Date().toISOString() : state.lastSpinDate
          };
        });

        return granted ? reward : null;
      },

      // --- PASSIVE TIMED REFILL LOGISTICS CALCULATION ---
      // Refill pauses (timer keeps resetting) while energy is at or above the
      // level-dependent cap — overflow from ads/packs/rewards never regenerates.
      tickEnergy: () => set((state) => {
        const now = Date.now();
        const cap = getEnergyCap(state.staminaSourceLevel);
        if (state.energy >= cap) {
          return { lastEnergyRefillTime: now };
        }

        const lastRefill = state.lastEnergyRefillTime || now;
        const deltaMs = now - lastRefill;
        const intervalMs = getRefillIntervalMin(state.staminaSourceLevel) * 60 * 1000;

        if (deltaMs >= intervalMs) {
          const tickUnitsCount = Math.floor(deltaMs / intervalMs);
          const accumulatedEnergy = Math.min(cap, state.energy + tickUnitsCount);
          const leftoverMs = deltaMs % intervalMs;

          return {
            energy: accumulatedEnergy,
            lastEnergyRefillTime: now - leftoverMs
          };
        }
        return {};
      }),

      spendEnergy: (amount = STAMINA_PER_GAME) => {
        let success = false;
        set((state) => {
          if (state.energy < amount) return {};
          success = true;
          const cap = getEnergyCap(state.staminaSourceLevel);
          return {
            energy: state.energy - amount,
            // If the bar was full/overflowing, regen was paused — restart the timer now.
            lastEnergyRefillTime: state.energy >= cap ? Date.now() : state.lastEnergyRefillTime
          };
        });
        return success;
      },

      // Ads, packs and rewards add straight to the main source and may overflow
      // above the cap so no purchased stamina is ever wasted.
      addStamina: (amount) => set((state) => ({ energy: state.energy + amount })),

      refillEnergyWithGems: (gemCost) => {
        let success = false;
        set((state) => {
          // Both guards live inside the transaction: a disabled button is not a
          // concurrency guard, and charging gems for a full bar loses currency.
          const cap = getEnergyCap(state.staminaSourceLevel);
          if (state.energy >= cap) return {};
          if (state.gems < gemCost) return {};
          success = true;
          return { gems: state.gems - gemCost, energy: cap, lastEnergyRefillTime: Date.now() };
        });
        return success;
      },

      upgradeStaminaSource: () => {
        let success = false;
        set((state) => {
          const currentLevel = state.staminaSourceLevel ?? 0;
          const nextLevel = currentLevel + 1;
          if (nextLevel > MAX_STAMINA_UPGRADE_LEVEL) return {};
          // Price resolved inside the transaction so the discount window cannot
          // be captured by a stale render and charged after it expired.
          const cost = getUpgradeGemCost(nextLevel, state.accountCreatedAt, currentLevel);
          if (state.gems < cost) return {};
          success = true;
          return {
            gems: state.gems - cost,
            staminaSourceLevel: nextLevel,
          };
        });
        return success;
      },

      buyGemPack: (packId) => {
        const targetPackDef: GemPackItem | undefined =
          GEM_PACKS.find((p) => p.id === packId) ??
          STAMINA_PACKS.find((p) => p.id === packId);
        if (!targetPackDef) return false;

        let success = false;
        set((state) => {
          if (state.gems < targetPackDef.gemCost) return {};
          success = true;
          const ownedCosmetics = { ...state.ownedCosmetics };
          for (const cosmeticId of targetPackDef.cosmeticIds) {
            ownedCosmetics[cosmeticId] = true;
          }
          return {
            gems: state.gems - targetPackDef.gemCost,
            coins: state.coins + targetPackDef.coins,
            // Pack stamina goes to the main source and may overflow above the cap.
            energy: state.energy + targetPackDef.stamina,
            ownedCosmetics,
          };
        });
        return success;
      },

      purchaseWing: (wingId, gemCost) => {
        let success = false;
        set((state) => {
          if (state.gems < gemCost) return {};
          if (state.ownedWings.includes(wingId)) return {};
          success = true;
          return {
            gems: state.gems - gemCost,
            ownedWings: [...state.ownedWings, wingId],
          };
        });
        return success;
      },

      equipWing: (wingId) => set({ equippedWing: wingId }),

      buyCoinGemExchange: (id) => {
        const tier = COIN_GEM_EXCHANGES.find((exchange) => exchange.id === id);
        if (!tier) return false;

        let success = false;
        set((state) => {
          const purchased = state.coinGemExchanges[id] ?? 0;
          if (purchased >= tier.maxPurchases || state.coins < tier.coins) {
            return {};
          }

          success = true;
          return {
            coins: state.coins - tier.coins,
            gems: state.gems + tier.gems,
            coinGemExchanges: {
              ...state.coinGemExchanges,
              [id]: purchased + 1,
            },
          };
        });
        return success;
      },
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Expo Go is a development build. Seed one existing free wing there so
      // the lobby wing placement can be inspected without changing release
      // progression (the first free wing normally unlocks at level 5).
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<UserState> & { staminaReserve?: number };
        // Economy v2 migration: the reserve pool was removed. Fold any legacy
        // reserve into the main source as overflow so players lose nothing.
        const legacyReserve = Math.max(0, persisted.staminaReserve ?? 0);
        const merged: UserState = {
          ...currentState,
          ...persisted,
          energy: (persisted.energy ?? currentState.energy) + legacyReserve,
          staminaSourceLevel: persisted.staminaSourceLevel ?? 0,
          // Existing accounts predate this field; stamp them now so the launch
          // discount applies to genuinely new installs only going forward.
          accountCreatedAt: persisted.accountCreatedAt ?? currentState.accountCreatedAt,
        };
        delete (merged as { staminaReserve?: number }).staminaReserve;

        const hasSupportedWingEquipped =
          !!persisted.equippedWing &&
          !!WING_SOURCES[persisted.equippedWing];
        if (__DEV__ && !hasSupportedWingEquipped) {
          return {
            ...merged,
            ownedWings: Array.from(
              new Set([...(persisted.ownedWings ?? []), 'wing_basic']),
            ),
            equippedWing: 'wing_basic',
          };
        }
        return merged;
      },
    }
  )
);
