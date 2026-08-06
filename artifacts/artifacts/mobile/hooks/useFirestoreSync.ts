/**
 * useFirestoreSync — Task 5.
 *
 * Initializes Firebase anonymous auth on app startup and syncs
 * the current player profile to Firestore whenever the key economy
 * fields change (coins, XP, level).
 *
 * Add <FirestoreSyncProvider /> near the root of the app (see _layout.tsx).
 */

import { useEffect, useRef } from 'react';
import { useUserStore } from '@/store/userStore';
import { initAuth, getPlayerId } from '@/services/authService';
import { savePlayerProfile } from '@/services/firestoreService';
import { fetchAndApplyRemoteConfig } from '@/services/remoteConfigService';

export function useFirestoreSync(): void {
  const initializedRef = useRef(false);

  // Subscribe to the economy fields we want to mirror
  const { username, coins, gems, xp, level, isPremium, selectedAvatarId, statistics } =
    useUserStore();

  // ── Boot: anonymous sign-in + remote config fetch ────────────────────────
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Run both in parallel — remote config doesn't need auth
    Promise.all([
      initAuth().catch((err) =>
        console.warn('[FirestoreSync] initAuth failed:', err),
      ),
      fetchAndApplyRemoteConfig(),
    ]);
  }, []);

  // ── Sync on economy state change ─────────────────────────────────────────
  // We debounce with a ref so rapid consecutive changes don't flood Firestore.
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Don't sync until we have a username (user has completed onboarding)
    if (!username) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      const uid = getPlayerId();
      if (!uid) return;

      await savePlayerProfile(uid, {
        username,
        coins,
        gems,
        xp,
        level,
        isPremium,
        selectedAvatarId,
        totalGamesPlayed:    statistics.totalGamesPlayed,
        totalWins:           statistics.totalWins,
      });
    }, 2000); // 2-second debounce

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, coins, gems, xp, level, isPremium, selectedAvatarId,
      statistics.totalGamesPlayed, statistics.totalWins]);
}
