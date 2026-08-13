/**
 * artifacts/artifacts/mobile/store/userStore.ts
 * Global State Management Store for BlurQuiz Game Engine.
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

  // Store & Progression Actions Pipelines
  setUsername: (username: string) => void;
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
      
      // --- CALIBRATED DAILY STREAK SCHEDULER ---
      claimDailyReward: () => {
        const todayStr = getTodayUTCString();
        // Award the configured reward for the current schedule day, so a stale
        // persisted nextRewardAmount can never pay out the wrong number of coins.
        const currentDayIdx = get().dailyReward.currentDay ?? 0;
        const amt = DAILY_REWARDS[currentDayIdx]?.coins ?? DAILY_REWARDS[0].coins;

        set((state) => {
          let currentStreak = state.dailyReward.streak;

          if (state.dailyReward.lastClaimDate === todayStr) {
            console.log('[Daily Streak Engine] Reward already claimed for today.');
            return {};
          }

          const nextDayIdx = (currentDayIdx + 1) % DAILY_REWARDS.length;
          const configNextAmount = DAILY_REWARDS[nextDayIdx].coins;

          return {
            coins: state.coins + amt,
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
        set((state) => {
          if (state.unclaimedLevelRewards.includes(level)) {
            success = true;
            const configurationPack = getLevelReward(level);
            return {
              coins: state.coins + (configurationPack.coins || 0),
              gems: state.gems + (configurationPack.gems || 0),
              unclaimedLevelRewards: state.unclaimedLevelRewards.filter((l) => l !== level)
            };
          }
          return {};
        });
        return success;
      },

      // --- MISSION LOGISTICS ENGINE ---
      refreshDailyMissions: () => set((state) => {
        const todayStr = getTodayUTCString();
        if (state.missionsDate === todayStr && state.missions.length > 0) return {};

        const operationalMissions = getDailyMissions(getTodayUTC(), state.isPremium);
        const mappedActiveMissions: ActiveMission[] = operationalMissions.map((m) => ({
          id: m.id,
          type: m.type,
          description: m.description,
          target: m.target,
          current: 0,
          rewardCoins: m.rewardCoins,
          rewardGems: m.rewardGems,
          rewardXp: m.rewardXp,
          completed: false,
          claimed: false,
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

          const updatedCurrent = Math.min(m.target, m.current + increment);
          const isNowCompleted = updatedCurrent >= m.target;

          if (isNowCompleted && !m.completed) {
            notificationService.scheduleLocalNotification({
              title: 'Mission Complete! 🎯',
              body: `Your mission "${m.description}" is finished. open lobby to claim rewards!`,
              trigger: null
            });
          }

          return {
            ...m,
            current: updatedCurrent,
            completed: isNowCompleted
          };
        });

        return { missions: updatedMissions };
      }),

      claimMissionReward: (missionId) => {
        let success = false;
        set((state) => {
          const targetMission = state.missions.find((m) => m.id === missionId);
          if (targetMission && targetMission.completed && !targetMission.claimed) {
            success = true;
            const updatedCoins = state.coins + targetMission.rewardCoins;
            const updatedGems = state.gems + targetMission.rewardGems;
            
            return {
              coins: updatedCoins,
              gems: updatedGems,
              missions: state.missions.map((m) => m.id === missionId ? { ...m, claimed: true } : m)
            };
          }
          return {};
        });

        if (success) {
          const missionRef = get().missions.find((m) => m.id === missionId);
          if (missionRef && missionRef.rewardXp > 0) {
            get().addXP(missionRef.rewardXp);
          }
        }
        return success;
      },

      setPremium: (value) => set({ isPremium: value }),
      
      resetUser: () => set({
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
        unclaimedLevelRewards: [],
        missions: [],
        missionsDate: null,
        gemCosmetics: {},
        ownedCosmetics: {},
        equippedCosmetics: {},
        coinGemExchanges: { ...defaultCoinGemExchanges },
        energy: MAX_ENERGY,
        staminaReserve: 0,
        statistics: { ...defaultStatistics }
      }),

      // --- CRITICAL AUDIT EVALUATOR ---
      checkAndUnlockAchievements: (ctx) => {
        const stats = get().statistics;
        const currentAchievements = get().achievements;
        let newlyUnlocked: AchievementDef[] = [];
        let modifiedAchievements = currentAchievements.map((ach) => {
          if (ach.unlocked) return ach;

          const isConditionMet = checkAchievementCondition(ach.id, stats, ctx);
          if (isConditionMet) {
            newlyUnlocked.push({ id: ach.id, title: ach.title, description: ach.description } as any);
            return {
              ...ach,
              unlocked: true,
              unlockedAt: Date.now()
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

      grantStarterPack: () => set((state) => ({ coins: state.coins + 500, gems: state.gems + 100 })),

      canFreeSpin: () => {
        const lastSpin = get().lastSpinDate;
        if (!lastSpin) return true;
        return !isToday(new Date(lastSpin));
      },

      canExtraSpin: () => {
        const todayStr = getTodayUTCString();
        const state = get();
        const currentExtraSpins = state.lastExtraSpinDate === todayStr ? state.extraSpinsToday : 0;
        return currentExtraSpins < SPIN_CONFIG.maxExtraSpinsPerDay;
      },

      // --- RANDOMIZED JACKPOT SPIN WHEEL CONTROLLER ---
      performSpin: (isFree) => {
        const todayStr = getTodayUTCString();
        let selectedReward: SpinReward | null = null;

        if (isFree && !get().canFreeSpin()) return null;
        if (!isFree && !get().canExtraSpin()) return null;

        const drawnRewardIndex = pickRewardIndex(SPIN_CONFIG.rewards, () => Math.random());
        selectedReward = SPIN_CONFIG.rewards[drawnRewardIndex] || null;

        if (!selectedReward) return null;

        set((state) => {
          let updatedCoins = state.coins;
          let updatedGems = state.gems;
          let updatedFragments = state.avatarFragments;
          let updatedExtraSpins = state.extraSpinsToday;
          let trackerExtraSpinDate = state.lastExtraSpinDate;

          if (selectedReward!.type === 'coins') updatedCoins += selectedReward!.amount;
          if (selectedReward!.type === 'gems') updatedGems += selectedReward!.amount;
          if (selectedReward!.type === 'fragment') updatedFragments += selectedReward!.amount;

          if (!isFree) {
            const currentExtraSpinsCount = state.lastExtraSpinDate === todayStr ? state.extraSpinsToday : 0;
            updatedExtraSpins = currentExtraSpinsCount + 1;
            trackerExtraSpinDate = todayStr;
          }

          return {
            coins: updatedCoins,
            gems: updatedGems,
            avatarFragments: updatedFragments,
            extraSpinsToday: updatedExtraSpins,
            lastExtraSpinDate: trackerExtraSpinDate,
            lastSpinDate: isFree ? new Date().toISOString() : state.lastSpinDate
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
          gems: state.gems + targetPackDef.gems,
          isPremium: packId === 'premium_pass_lifetime' ? true : state.isPremium
        }));
        return true;
      },

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
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
