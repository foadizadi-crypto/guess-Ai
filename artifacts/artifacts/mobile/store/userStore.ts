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
  type SpinReward,
} from '@/constants/spinConfig';
import { getLevelReward } from '@/constants/levelRewards';
import { GEM_PACKS, type GemPackItem } from '@/constants/shopConfig';
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
  ENERGY_REFILL_INTERVAL_MIN,
  ENERGY_REFILL_GEM_COST,
  ENERGY_DAILY_REWARD,
  STAMINA_PER_GAME,
  COIN_GEM_EXCHANGES,
  DAILY_REWARD_SCHEDULE,
  DAILY_MILESTONE_REWARDS,
  type CoinGemExchangeId,
} from '@/constants/economy';
import { notificationService } from '@/services/NotificationService';
import { calculateLevel, getTodayUTCString, hasClaimedDailyRewardToday, utcDayString } from '@/utils';
import { WING_STAGE_ASSETS } from '@/constants/avatarStageAssets';

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

  // Multi-tier Stamina Allocation Metrics
  energy: number;
  staminaReserve: number;
  lastEnergyRefillTime: number | null;

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
  buyConsumable: (id: ConsumableId, gemCost: number) => boolean;
  useConsumable: (id: ConsumableId) => boolean;
  addConsumable: (id: ConsumableId, quantity?: number) => void;
  decrementMultiplierSession: () => void;
  mockPurchaseCoins: (amount: number) => void;
  updateBestScore: (score: number) => void;
  claimDailyReward: () => number;
  hasClaimedDailyRewardToday: () => boolean;
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
      staminaReserve:       0,
      lastEnergyRefillTime: null,
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
      hydrateFromBackend: (uid, profile) => set((state) => ({
        username: profile.username?.trim() || state.username,
        nicknameUid: profile.username?.trim() ? uid : state.nicknameUid,
        coins: typeof profile.coins === 'number' ? profile.coins : state.coins,
        gems: typeof profile.gems === 'number' ? profile.gems : state.gems,
        xp: typeof profile.xp === 'number' ? profile.xp : state.xp,
        level: typeof profile.level === 'number' ? profile.level : state.level,
        isPremium: typeof profile.isPremium === 'boolean' ? profile.isPremium : state.isPremium,
        selectedAvatarId: profile.selectedAvatarId || state.selectedAvatarId,
        statistics: {
          ...state.statistics,
          totalGamesPlayed: typeof profile.totalGamesPlayed === 'number'
            ? profile.totalGamesPlayed : state.statistics.totalGamesPlayed,
          totalWins: typeof profile.totalWins === 'number'
            ? profile.totalWins : state.statistics.totalWins,
        },
      })),
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

        return {
          xp: finalXP,
          level: Math.min(MAX_LEVEL, calculatedLevel),
          dailyXPEarned: finalDailyXP,
          dailyXPDate: todayStr,
          unclaimedLevelRewards: updatedUnclaimedRewards
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

      buyConsumable: (id, gemCost) => {
        let success = false;
        set((state) => {
          if (state.gems >= gemCost) {
            success = true;
            return {
              gems: state.gems - gemCost,
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
      
      hasClaimedDailyRewardToday: () => hasClaimedDailyRewardToday(get().dailyReward),

      // --- CALIBRATED DAILY STREAK SCHEDULER ---
      // One payout per UTC calendar day. Duplicate taps and stale saves are no-ops.
      claimDailyReward: () => {
        const todayStr = getTodayUTCString();
        let awarded = 0;

        set((state) => {
          if (hasClaimedDailyRewardToday(state.dailyReward)) {
            return {};
          }

          const currentDayIdx = state.dailyReward.currentDay ?? 0;
          const schedule = DAILY_REWARD_SCHEDULE[currentDayIdx] ?? DAILY_REWARD_SCHEDULE[0];
          const uiReward = DAILY_REWARDS[currentDayIdx] ?? DAILY_REWARDS[0];
          awarded = schedule.coins ?? uiReward.coins;

          const nextDayIdx = (currentDayIdx + 1) % DAILY_REWARDS.length;
          const nextStreak = state.dailyReward.streak + 1;
          const milestone = DAILY_MILESTONE_REWARDS.find((m) => m.streak === nextStreak);
          if (milestone) awarded += milestone.coins;

          const powerUps = { ...state.powerUps };
          if (schedule.bonus === 'hint') {
            powerUps.hint = (powerUps.hint ?? 0) + 1;
          } else if (schedule.bonus === 'reveal') {
            powerUps['reveal-blur'] = (powerUps['reveal-blur'] ?? 0) + 1;
          }

          return {
            coins: state.coins + awarded,
            energy: Math.min(MAX_ENERGY, state.energy + ENERGY_DAILY_REWARD),
            powerUps,
            dailyReward: {
              lastClaimed: new Date().toISOString(),
              lastClaimDate: todayStr,
              streak: nextStreak,
              currentDay: nextDayIdx,
              nextRewardAmount: DAILY_REWARDS[nextDayIdx].coins,
            },
          };
        });
        return awarded;
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

          // Gems are NOT awarded through level rewards (spec: gems via IAP only)
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
                const consId = item.id as ConsumableId;
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

          // Unlock avatars atomically inside the set()
          const newAvatars = avatarsToUnlock.length > 0
            ? state.avatars.map((av) =>
                avatarsToUnlock.includes(av.id) ? { ...av, unlocked: true } : av
              )
            : state.avatars;

          return {
            coins: newCoins,
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
        unclaimedLevelRewards: [],
        missions: [],
        missionsDate: null,
        gemCosmetics: {},
        ownedCosmetics: {},
        equippedCosmetics: {},
        coinGemExchanges: { ...defaultCoinGemExchanges },
        energy: MAX_ENERGY,
        staminaReserve: 0,
        ownedWings: [],
        equippedWing: null,
        statistics: { ...defaultStatistics }
      }),

      // --- CRITICAL AUDIT EVALUATOR ---
      checkAndUnlockAchievements: (ctx) => {
        const state = get();
        const stats = state.statistics;
        const ownedCosmeticsCount = Object.keys(state.ownedCosmetics).length;
        const currentAchievements = state.achievements;
        let newlyUnlocked: AchievementDef[] = [];
        let modifiedAchievements = currentAchievements.map((ach) => {
          if (ach.unlocked) return ach;

          const achievementCtx = {
            stats,
            avatars: state.avatars,
            ownedCosmeticsCount,
            isPerfectGame: ctx.isPerfectGame,
            maxComboThisGame: ctx.maxComboThisGame,
          };
          const isConditionMet = checkAchievementCondition(ach.id, achievementCtx);
          if (isConditionMet) {
            newlyUnlocked.push({ id: ach.id, title: ach.title, description: ach.description } as any);
            return {
              ...ach,
              unlocked: true,
              unlockedAt: new Date().toISOString()
            };
          }
          return ach;
        });

        if (newlyUnlocked.length > 0) {
          set({
            achievements: modifiedAchievements,
            hasNewAchievement: true
          });
          
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
        return utcDayString(lastSpin) !== getTodayUTCString();
      },

      canExtraSpin: () => {
        const todayStr = getTodayUTCString();
        const state = get();
        const currentExtraSpins = state.lastExtraSpinDate === todayStr ? state.extraSpinsToday : 0;
        return currentExtraSpins < SPIN_CONFIG.extraSpinsPerDay
          && state.coins >= SPIN_CONFIG.extraSpinCost;
      },

      // --- RANDOMIZED JACKPOT SPIN WHEEL CONTROLLER ---
      // Weighted pick is computed here (never rendered). Free: 1/UTC day.
      // Extra: up to extraSpinsPerDay, each costing extraSpinCost coins.
      performSpin: (isFree) => {
        const todayStr = getTodayUTCString();
        let selectedReward: SpinReward | null = null;

        set((state) => {
          const freeUsedToday = utcDayString(state.lastSpinDate) === todayStr;
          if (isFree && freeUsedToday) return {};

          const extraUsed = state.lastExtraSpinDate === todayStr ? state.extraSpinsToday : 0;
          if (!isFree) {
            if (extraUsed >= SPIN_CONFIG.extraSpinsPerDay) return {};
            if (state.coins < SPIN_CONFIG.extraSpinCost) return {};
          }

          const drawnRewardIndex = pickRewardIndex(SPIN_CONFIG.rewards);
          selectedReward = SPIN_CONFIG.rewards[drawnRewardIndex] ?? null;
          if (!selectedReward) return {};

          let updatedCoins = state.coins;
          let updatedGems = state.gems;
          const consumables = { ...state.consumables };
          const ownedCosmetics = { ...state.ownedCosmetics };

          if (!isFree) updatedCoins -= SPIN_CONFIG.extraSpinCost;

          if (selectedReward.type === 'coins' || selectedReward.type === 'jackpot') {
            updatedCoins += selectedReward.amount;
          } else if (selectedReward.type === 'gems') {
            updatedGems += selectedReward.amount;
          } else if (selectedReward.type === 'consumable' && selectedReward.itemId) {
            const itemId = selectedReward.itemId as ConsumableId;
            if (itemId in consumables) {
              consumables[itemId] = (consumables[itemId] ?? 0) + selectedReward.amount;
            }
          } else if (selectedReward.type === 'cosmetic') {
            ownedCosmetics[selectedReward.id] = true;
          }

          return {
            coins: updatedCoins,
            gems: updatedGems,
            consumables,
            ownedCosmetics,
            extraSpinsToday: isFree ? extraUsed : extraUsed + 1,
            lastExtraSpinDate: isFree ? state.lastExtraSpinDate : todayStr,
            lastSpinDate: isFree ? new Date().toISOString() : state.lastSpinDate,
          };
        });

        return selectedReward;
      },

      // --- PASSIVE TIMED REFILL LOGISTICS CALCULATION ---
      tickEnergy: () => set((state) => {
        const now = Date.now();
        if (state.energy >= MAX_ENERGY) {
          return { lastEnergyRefillTime: now };
        }

        const lastRefill = state.lastEnergyRefillTime || now;
        const deltaMs = now - lastRefill;
        const intervalMs = ENERGY_REFILL_INTERVAL_MIN * 60 * 1000;

        if (deltaMs >= intervalMs) {
          const tickUnitsCount = Math.floor(deltaMs / intervalMs);
          const accumulatedEnergy = Math.min(MAX_ENERGY, state.energy + tickUnitsCount);
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
          if (state.energy >= amount) {
            success = true;
            return {
              energy: state.energy - amount,
              lastEnergyRefillTime: state.energy >= MAX_ENERGY ? Date.now() : state.lastEnergyRefillTime
            };
          } else if (state.energy + state.staminaReserve >= amount) {
            success = true;
            const requiredDeficit = amount - state.energy;
            return {
              energy: 0,
              staminaReserve: state.staminaReserve - requiredDeficit,
              lastEnergyRefillTime: state.energy >= MAX_ENERGY ? Date.now() : state.lastEnergyRefillTime
            };
          }
          return {};
        });
        return success;
      },

      addStamina: (amount) => set((state) => ({ staminaReserve: state.staminaReserve + amount })),
      
      refillEnergyWithGems: (gemCost) => {
        let success = false;
        set((state) => {
          // Both guards live inside the transaction: a disabled button is not a
          // concurrency guard, and charging gems for a full bar loses currency.
          if (state.energy >= MAX_ENERGY) return {};
          if (state.gems < gemCost) return {};
          success = true;
          return { gems: state.gems - gemCost, energy: MAX_ENERGY, lastEnergyRefillTime: Date.now() };
        });
        return success;
      },

      buyGemPack: (packId) => {
        const targetPackDef = GEM_PACKS.find((p) => p.id === packId);
        if (!targetPackDef) return false;

        set((state) => ({
          gems: state.gems + (targetPackDef.gems ?? 0),
          isPremium: packId === 'premium_pass_lifetime' ? true : state.isPremium
        }));
        return true;
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
        const persisted = persistedState as Partial<UserState>;
        const hasSupportedWingEquipped =
          !!persisted.equippedWing &&
          !!WING_STAGE_ASSETS[persisted.equippedWing];

        const persistedDaily = persisted.dailyReward;
        const dailyReward = persistedDaily
          ? {
              ...persistedDaily,
              lastClaimDate:
                persistedDaily.lastClaimDate
                ?? utcDayString(persistedDaily.lastClaimed)
                ?? null,
            }
          : currentState.dailyReward;

        const merged = {
          ...currentState,
          ...persisted,
          dailyReward,
        };

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
