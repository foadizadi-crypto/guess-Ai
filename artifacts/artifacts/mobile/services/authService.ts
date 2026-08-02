/**
 * Firebase Anonymous Auth — gives every device a stable player UID
 * without requiring sign-up.  The UID is used as the Firestore document
 * key for player profiles and game sessions.
 *
 * Call initAuth() once at app startup (see hooks/useFirestoreSync.ts).
 * Call getPlayerId() anywhere to retrieve the current UID.
 */

import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

let _playerId: string | null = null;

/** Initialize anonymous auth and resolve with the stable UID. */
export async function initAuth(): Promise<string> {
  // Already signed in (e.g. hot-reload)
  if (_playerId) return _playerId;

  const currentUser = auth.currentUser;
  if (currentUser) {
    _playerId = currentUser.uid;
    return _playerId;
  }

  // Sign in anonymously (creates a new account on first launch; persists via AsyncStorage)
  const { user } = await signInAnonymously(auth);
  _playerId = user.uid;
  return _playerId;
}

/** Returns the current player UID, or null if initAuth has not been called yet. */
export function getPlayerId(): string | null {
  return _playerId ?? auth.currentUser?.uid ?? null;
}

/** Subscribe to auth state (useful for debugging / future account linking). */
export function onPlayerIdChange(cb: (uid: string | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    _playerId = user?.uid ?? null;
    cb(_playerId);
  });
}
