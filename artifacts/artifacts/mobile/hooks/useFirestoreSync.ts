/**
 * useFirestoreSync — mirrors the local Zustand economy state to Firestore
 * under `players/{uid}`, where `uid` is the canonical playerId (the
 * Firebase Auth UID from Google Sign-In). Backend sync is only meaningful
 * once a player is signed in, so every effect here is a no-op until
 * `getPlayerId()` resolves to a real UID.
 *
 * Add <FirestoreSyncProvider /> near the root of the app (see _layout.tsx).
 */

import { useEffect, useRef, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { getPlayerId, onPlayerIdChange } from '@/services/authService';
import { loadPlayerProfile } from '@/services/firestoreService';

export function useFirestoreSync(): void {
  // Subscribe to the economy fields we want to mirror
  const { username, coins, gems, xp, level, isPremium, selectedAvatarId, statistics } =
    useUserStore();

  // ── Track sign-in / sign-out so a fresh sign-in immediately syncs ───────
  const uidRef = useRef<string | null>(getPlayerId());
  const [uid, setUid] = useState<string | null>(getPlayerId());
  const hydrateFromBackend = useUserStore((s) => s.hydrateFromBackend);
  useEffect(() => {
    const unsub = onPlayerIdChange((uid) => {
      uidRef.current = uid;
      setUid(uid);
    });
    return unsub;
  }, []);

  // Load the one existing players/{uid} record after auth restoration/sign-in.
  // This never creates a second record and is scoped to the active UID.
  useEffect(() => {
    if (!uid) return;
    let active = true;
    loadPlayerProfile(uid).then((profile) => {
      if (active && profile) hydrateFromBackend(uid, profile);
    });
    return () => { active = false; };
  }, [uid, hydrateFromBackend]);

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
      // Note: `username` is deliberately NOT included here — it's an
      // identity field the server alone controls via nickname registration,
      // and Firestore rules reject any client write that touches it.
      await savePlayerProfile(uid, {
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
