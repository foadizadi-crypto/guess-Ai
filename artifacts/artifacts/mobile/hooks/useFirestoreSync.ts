/**
 * useFirestoreSync — mirrors gameplay progress to Firestore under
 * `players/{uid}` (the progress branch). Dollar purchases are written
 * separately to `purchase_ledger` and are never synced from this hook.
 */

import { useEffect, useRef, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { getPlayerId, onPlayerIdChange } from '@/services/authService';
import { loadPlayerProfile, savePlayerProfile } from '@/services/firestoreService';

function progressPayloadFromStore() {
  const s = useUserStore.getState();
  return {
    coins: s.coins,
    gems: s.gems,
    xp: s.xp,
    level: s.level,
    isPremium: s.isPremium,
    selectedAvatarId: s.selectedAvatarId,
    totalGamesPlayed: s.statistics.totalGamesPlayed,
    totalWins: s.statistics.totalWins,
    statistics: s.statistics,
    achievements: s.achievements.map(({ id, unlocked, unlockedAt }) => ({
      id,
      unlocked: unlocked ?? false,
      unlockedAt: unlockedAt ?? null,
    })),
    avatars: s.avatars.map(({ id, unlocked }) => ({ id, unlocked })),
    powerUps: s.powerUps,
    consumables: s.consumables,
    multiplierSessionsLeft: s.multiplierSessionsLeft,
    avatarFragments: s.avatarFragments,
    bestScore: s.bestScore,
    dailyReward: s.dailyReward,
    gemCosmetics: s.gemCosmetics,
    ownedCosmetics: s.ownedCosmetics,
    equippedCosmetics: s.equippedCosmetics as Record<string, string>,
    coinGemExchanges: s.coinGemExchanges,
    lastSpinDate: s.lastSpinDate,
    extraSpinsToday: s.extraSpinsToday,
    lastExtraSpinDate: s.lastExtraSpinDate,
    energy: s.energy,
    staminaSourceLevel: s.staminaSourceLevel,
    lastEnergyRefillTime: s.lastEnergyRefillTime,
    ownedWings: s.ownedWings,
    equippedWing: s.equippedWing,
    dailyXPEarned: s.dailyXPEarned,
    dailyXPDate: s.dailyXPDate,
    unclaimedLevelRewards: s.unclaimedLevelRewards,
    missions: s.missions,
    missionsDate: s.missionsDate,
    accountCreatedAt: s.accountCreatedAt,
  };
}

export function useFirestoreSync(): void {
  const uidRef = useRef<string | null>(getPlayerId());
  const [uid, setUid] = useState<string | null>(getPlayerId());
  const hydrateFromBackend = useUserStore((s) => s.hydrateFromBackend);

  useEffect(() => {
    const unsub = onPlayerIdChange((next) => {
      uidRef.current = next;
      setUid(next);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!uid) return;
    let active = true;
    loadPlayerProfile(uid).then((profile) => {
      if (active && profile) hydrateFromBackend(uid, profile);
    });
    return () => { active = false; };
  }, [uid, hydrateFromBackend]);

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const schedule = () => {
      const state = useUserStore.getState();
      if (!state.username) return;
      const playerId = getPlayerId();
      if (!playerId) return;

      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        void savePlayerProfile(playerId, progressPayloadFromStore());
      }, 2000);
    };

    const unsub = useUserStore.subscribe(schedule);
    schedule();
    return () => {
      unsub();
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [uid]);
}
