/**
 * Google Sign-In — the only sign-in method. There is no anonymous/guest
 * fallback: every player resolves to exactly one canonical `playerId`,
 * the Firebase Auth UID produced by a Google credential.
 *
 * Web: uses Firebase's built-in `signInWithPopup` (falls back to
 * `signInWithRedirect` when the popup is blocked, e.g. inside an iframe
 * preview) — this needs no extra client-id wiring beyond the Google
 * provider being enabled in the Firebase console.
 *
 * Native (iOS/Android): exchanges a Google ID token (obtained via
 * Play Services in services/googleAuthNative.ts) for a Firebase
 * credential with `signInWithCredential`. Android needs the EAS SHA-1
 * registered on the Android OAuth client.
 *
 * Call getPlayerId() anywhere to retrieve the current signed-in UID.
 */

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth } from './firebase';

let _playerId: string | null = null;
let _authReady: Promise<User | null> | null = null;
const AUTH_READY_TIMEOUT_MS = 4_000;

/**
 * Resolves once Firebase has restored (or confirmed the absence of) a
 * persisted session. Callers that need to know "is anyone signed in?" at
 * startup (e.g. splash routing) must await this instead of reading
 * `auth.currentUser` synchronously, since persistence restoration is async.
 */
export function waitForAuthReady(): Promise<User | null> {
  if (!_authReady) {
    _authReady = new Promise((resolve) => {
      let settled = false;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const finish = (user: User | null, reason: string) => {
        if (settled) return;
        settled = true;
        if (timeout) clearTimeout(timeout);
        _playerId = user?.uid ?? null;
        console.log('[Auth] startup state resolved', { signedIn: !!user, reason });
        unsub();
        resolve(user);
      };
      const unsub = onAuthStateChanged(auth, (user) => {
        finish(user, 'firebase');
      });
      timeout = setTimeout(() => finish(null, 'timeout'), AUTH_READY_TIMEOUT_MS);
    });
  }
  return _authReady.then(() => auth.currentUser);
}

/** Returns the current player UID, or null if nobody is signed in. */
export function getPlayerId(): string | null {
  return _playerId ?? auth.currentUser?.uid ?? null;
}

/** True only for a Google credential — anonymous/guest sessions are not enough. */
export function isGoogleUser(user: User | null = auth.currentUser): user is User {
  if (!user) return false;
  return user.providerData.some((p) => p.providerId === 'google.com');
}

/**
 * Returns a fresh Firebase ID token for the signed-in player, or null if
 * nobody is signed in. Every backend call that acts on behalf of "the
 * current player" (nickname registration/lookup, etc.) must send this as
 * `Authorization: Bearer <token>` — the server derives identity from the
 * verified token, never from a client-supplied uid.
 */
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch (err) {
    console.warn('[Auth] getIdToken failed:', err);
    return null;
  }
}

/** Subscribe to auth state changes (sign-in / sign-out). */
export function onPlayerIdChange(cb: (uid: string | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    _playerId = user?.uid ?? null;
    cb(_playerId);
  });
}

export class GoogleSignInError extends Error {
  constructor(
    message: string,
    public readonly code: 'popup_blocked' | 'cancelled' | 'native_not_configured' | 'unknown',
  ) {
    super(message);
    this.name = 'GoogleSignInError';
  }
}

/**
 * Web: Google Sign-In via Firebase's hosted OAuth flow. Tries a popup first
 * (best UX); if the popup is blocked — common inside the Replit preview
 * iframe — falls back to a full-page redirect.
 */
async function signInWithGoogleWeb(): Promise<string> {
  const provider = new GoogleAuthProvider();
  try {
    const { user } = await signInWithPopup(auth, provider);
    _playerId = user.uid;
    return user.uid;
  } catch (err) {
    const code = (err as { code?: string })?.code ?? '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new GoogleSignInError('Sign-in was cancelled.', 'cancelled');
    }
    // Popup blocked / not supported (e.g. sandboxed iframe) — redirect instead.
    await signInWithRedirect(auth, provider);
    // signInWithRedirect navigates away; this line only runs in edge cases.
    throw new GoogleSignInError('Redirecting to Google…', 'popup_blocked');
  }
}

/**
 * Completes a redirect-based sign-in on return from Google (web only).
 * Call once on app startup; resolves to the UID if a redirect just
 * completed, or null if there was none pending.
 */
export async function completeRedirectSignIn(): Promise<string | null> {
  if (Platform.OS !== 'web') return null;
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      _playerId = result.user.uid;
      return result.user.uid;
    }
  } catch (err) {
    console.warn('[Auth] getRedirectResult failed:', err);
  }
  return null;
}

/**
 * Native: exchange a Google ID token for a Firebase credential.
 * The ID token itself is obtained via Play Services
 * (see services/googleAuthNative.ts).
 */
export async function signInWithGoogleIdToken(idToken: string): Promise<string> {
  const credential = GoogleAuthProvider.credential(idToken);
  const { user } = await signInWithCredential(auth, credential);
  _playerId = user.uid;
  return user.uid;
}

/**
 * Entry point used by the login screen on web. Native platforms obtain an
 * ID token via `promptNativeGoogleIdToken()` then call `signInWithGoogleIdToken`.
 */
export async function signInWithGoogle(): Promise<string> {
  if (Platform.OS === 'web') {
    return signInWithGoogleWeb();
  }
  throw new GoogleSignInError(
    'Use promptNativeGoogleIdToken() on native platforms.',
    'native_not_configured',
  );
}

/** Drop leftover anonymous sessions so they cannot bypass Google Sign-In. */
export async function signOutIfNotGoogle(): Promise<void> {
  const user = auth.currentUser ?? (await waitForAuthReady());
  if (user && !isGoogleUser(user)) {
    await signOut();
  }
}

export async function signOut(): Promise<void> {
  if (Platform.OS !== 'web') {
    try {
      const { signOutGooglePlay } = await import('./googleAuthNative');
      await signOutGooglePlay();
    } catch {
      // Firebase sign-out still proceeds.
    }
  }
  await firebaseSignOut(auth);
  _playerId = null;
}
