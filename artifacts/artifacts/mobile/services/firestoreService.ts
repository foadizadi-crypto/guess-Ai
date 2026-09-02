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
  collection,
} from 'firebase/firestore';
import { Platform } from 'react-native';
import { db } from './firebase';
import type { Achievement, DailyReward, PowerUpInventory, UserStatistics, ActiveMission } from '@/types';
import { getApiUrl } from './apiConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Gameplay progress stored on players/{uid}. Dollar IAP is NOT stored here. */
export interface PlayerProgressSnapshot {
  coins: number;
  gems: number;
  xp: number;
  /** Session aggregate from POST /api/sessions. Leaderboard uses max(xp, totalXpEarned). */
  totalXpEarned?: number;
  level: number;
  isPremium: boolean;
  selectedAvatarId: string;
  totalGamesPlayed: number;
  totalWins: number;
  statistics?: UserStatistics;
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
  equippedCosmetics?: Record<string, string>;
  coinGemExchanges?: Record<string, number>;
  lastSpinDate?: string | null;
  extraSpinsToday?: number;
  lastExtraSpinDate?: string | null;
  energy?: number;
  staminaSourceLevel?: number;
  lastEnergyRefillTime?: number | null;
  ownedWings?: string[];
  equippedWing?: string | null;
  ownedPets?: string[];
  equippedPet?: string | null;
  ownedStands?: string[];
  equippedStand?: string | null;
  dailyXPEarned?: number;
  dailyXPDate?: string | null;
  unclaimedLevelRewards?: number[];
  missions?: ActiveMission[];
  missionsDate?: string | null;
  accountCreatedAt?: string | null;
}

export interface FirestorePlayer extends PlayerProgressSnapshot {
  // `username` is an identity field set only by the server during nickname
  // registration (see api-server/src/routes/nickname.ts) — Firestore rules
  // reject any client write that touches it, so the client-side sync payload
  // (see hooks/useFirestoreSync.ts) never includes it.
  username?: string;
  updatedAt: unknown; // serverTimestamp
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
function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function savePlayerProfile(
  uid: string,
  data: Omit<FirestorePlayer, 'updatedAt' | 'username'>,
): Promise<void> {
  try {
    await setDoc(
      doc(db, 'players', uid),
      { ...stripUndefined(data), updatedAt: serverTimestamp() },
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

// ─── Purchase history (Phase 2 §2) ────────────────────────────────────────────

export interface PurchaseRecord {
  transactionId: string;
  productId: string;
  date: string;         // ISO timestamp
  status: 'completed' | 'pending' | 'failed';
  gemsGranted?: number;
  coinsGranted?: number;
}

/**
 * Save a completed dollar purchase to the financial ledger.
 * Path: `purchase_ledger/{transactionId}` — never deleted on account deletion.
 * Fire-and-forget — never throws to the UI.
 */
export async function savePurchaseHistory(
  uid: string,
  record: PurchaseRecord,
): Promise<void> {
  try {
    await setDoc(
      doc(db, 'purchase_ledger', record.transactionId),
      {
        ...record,
        playerId: uid,
        platform: Platform.OS,
        createdAt: serverTimestamp(),
      },
      { merge: false },
    );
  } catch (err) {
    console.warn('[Firestore] savePurchaseHistory failed:', err);
  }
}

/**
 * Check whether a transactionId has already been recorded.
 * Used for duplicate-grant prevention.
 * Returns false on network error (safe default: allow grant, client is source of truth).
 */
export async function hasPurchase(uid: string, transactionId: string): Promise<boolean> {
  try {
    const ledger = await getDoc(doc(db, 'purchase_ledger', transactionId));
    if (ledger.exists()) return true;
    const legacy = await getDoc(
      doc(collection(db, 'players', uid, 'purchases'), transactionId),
    );
    return legacy.exists();
  } catch (err) {
    console.warn('[Firestore] hasPurchase failed:', err);
    return false;
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
    // Identity is derived server-side from a verified ID token — the server
    // never trusts a client-supplied playerId for who a session belongs to.
    const { getIdToken } = await import('./authService');
    const idToken = await getIdToken();
    if (!idToken) throw new Error('not signed in');
    await fetch(getApiUrl('/api/sessions'), {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        sessionId,
        ...session,
      }),
    });
  } catch (err) {
    // API write failure is non-fatal — direct Firestore write already succeeded
    console.warn('[Firestore] recordGameSession (API) failed:', err);
  }
}

// ─── Spin wheel history ───────────────────────────────────────────────────────

export interface SpinHistoryEntry {
  playerId:     string;
  rewardId:     string;
  rewardType:   string;
  rewardAmount: number;
  timestamp:    string; // ISO 8601
}

/**
 * Append one spin result to `players/{uid}/spinHistory/{auto-id}`.
 * Fire-and-forget — never throws.
 */
export async function saveSpinHistory(
  uid:   string,
  entry: Omit<SpinHistoryEntry, 'playerId'>,
): Promise<void> {
  try {
    const ref = doc(collection(db, 'players', uid, 'spinHistory'));
    await setDoc(ref, { ...entry, playerId: uid });
  } catch (err) {
    console.warn('[Firestore] saveSpinHistory failed:', err);
  }
}

// ─── Push token ───────────────────────────────────────────────────────────────

/**
 * Persist the player's Expo push token so the server can send targeted
 * remote notifications (leaderboard updates, events, shop offers, new content).
 *
 * Stored at `players/{uid}/private/pushToken` — a private subcollection whose
 * Firestore rules deny all client reads.  Only the owning device can write it,
 * and only the server-side Admin SDK can read it for delivery.
 * Fire-and-forget — never throws to the UI.
 */
export async function savePushToken(uid: string, token: string): Promise<void> {
  try {
    await setDoc(
      doc(collection(db, 'players', uid, 'private'), 'pushToken'),
      { token, updatedAt: serverTimestamp() },
      { merge: false },
    );
  } catch (err) {
    console.warn('[Firestore] savePushToken failed:', err);
  }
}
