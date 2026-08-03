/**
 * Firestore client helpers — Task 5 & 6.
 *
 * All writes are fire-and-forget (errors are logged, never thrown to the UI).
 * The mobile app's Zustand + AsyncStorage remains the source of truth;
 * Firestore is the server-side mirror used for leaderboards, stats, and
 * cross-device sync.
 */

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Achievement } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FirestorePlayer {
  username:        string;
  coins:           number;
  gems:            number;
  xp:              number;
  level:           number;
  isPremium:       boolean;
  selectedAvatarId: string;
  totalGamesPlayed: number;
  totalWins:       number;
  updatedAt:       unknown; // serverTimestamp
}

export interface FirestoreGameSession {
  playerId:       string;
  difficulty:     'easy' | 'medium' | 'hard';
  category:       string;
  correctAnswers: number;
  wrongAnswers:   number;
  maxCombo:       number;
  xpEarned:       number;
  coinsEarned:    number;
  score:          number;
  startTime:      number | null;
  endTime:        number | null;
  wasAbandoned:   boolean;
  recordedAt:     unknown; // serverTimestamp
}

// ─── Player profile ───────────────────────────────────────────────────────────

/**
 * Write (or overwrite) the player's profile snapshot to Firestore.
 * Safe to call after any significant state change.
 */
export async function savePlayerProfile(
  uid: string,
  data: Omit<FirestorePlayer, 'updatedAt'>,
): Promise<void> {
  try {
    await setDoc(
      doc(db, 'players', uid),
      { ...data, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch (err) {
    console.warn('[Firestore] savePlayerProfile failed:', err);
  }
}

/**
 * Load the player's profile from Firestore (for cross-device sync on login).
 * Returns null if no document exists yet.
 */
export async function loadPlayerProfile(uid: string): Promise<FirestorePlayer | null> {
  try {
    const snap = await getDoc(doc(db, 'players', uid));
    if (!snap.exists()) return null;
    return snap.data() as FirestorePlayer;
  } catch (err) {
    console.warn('[Firestore] loadPlayerProfile failed:', err);
    return null;
  }
}

// ─── Achievements ─────────────────────────────────────────────────────────────

/**
 * Persist the player's full achievement list to Firestore.
 * Only stores id + unlock status; display metadata stays client-side.
 */
export async function saveAchievements(
  uid: string,
  achievements: Achievement[],
): Promise<void> {
  try {
    const payload = achievements.map(({ id, unlocked, unlockedAt }) => ({
      id,
      unlocked: unlocked ?? false,
      unlockedAt: unlockedAt ?? null,
    }));
    await setDoc(
      doc(db, 'players', uid),
      { achievements: payload, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch (err) {
    console.warn('[Firestore] saveAchievements failed:', err);
  }
}

// ─── Game sessions ────────────────────────────────────────────────────────────

/**
 * Record a completed (or abandoned) game session.
 * Writes directly to Firestore `game_sessions/{sessionId}`.
 *
 * Also posts to the API server via POST /api/sessions so the server
 * can update aggregate player stats atomically.
 */
export async function recordGameSession(
  uid: string,
  session: Omit<FirestoreGameSession, 'playerId' | 'recordedAt'>,
  sessionId: string,
): Promise<void> {
  try {
    // ── Direct Firestore write (fast, offline-capable) ────────────────────
    await setDoc(
      doc(db, 'game_sessions', sessionId),
      {
        ...session,
        playerId:   uid,
        recordedAt: serverTimestamp(),
      },
      { merge: false },
    );
  } catch (err) {
    console.warn('[Firestore] recordGameSession (direct) failed:', err);
  }

  // ── API server write (updates aggregate player stats) ────────────────────
  try {
    const apiBase = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';
    await fetch(`${apiBase}/api/sessions`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        playerId:   uid,
        sessionId,
        ...session,
      }),
    });
  } catch (err) {
    // API write failure is non-fatal — direct Firestore write already succeeded
    console.warn('[Firestore] recordGameSession (API) failed:', err);
  }
}
