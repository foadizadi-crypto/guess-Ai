/**
 * useFirestoreSync — mirrors the local Zustand economy state to Firestore
 * under `players/{uid}`, where `uid` is the canonical playerId (the
 * Firebase Auth UID from Google Sign-In). Backend sync is only meaningful
 * once a player is signed in, so every effect here is a no-op until
 * `getPlayerId()` resolves to a real UID.
 *
 * Add <FirestoreSyncProvider /> near the root of the app (see _layout.tsx).
 */

import { useEffect, useRef } from 'react';
import { useUserStore } from '@/store/userStore';
import { getPlayerId, onPlayerIdChange } from '@/services/authService';

export function useFirestoreSync(): void {
  // Subscribe to the economy fields we want to mirror
  const { username, coins, gems, xp, level, isPremium, selectedAvatarId, statistics } =
    useUserStore();

  // ── Track sign-in / sign-out so a fresh sign-in immediately syncs ───────
  const uidRef = useRef<string | null>(getPlayerId());
  useEffect(() => {
    const unsub = onPlayerIdChange((uid) => {
      uidRef.current = uid;
    });
    return unsub;
  }, []);

  // ── Sync on economy state change ─────────────────────────────────────────
  // We debounce with a ref so rapid consecutive changes don't flood Firestore.
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Don't sync until the player is signed in and has a registered nickname.
    if (!username) return;
    const uid = getPlayerId();
    if (!uid) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      const { savePlayerProfile } = await import('@/services/firestoreService');
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
