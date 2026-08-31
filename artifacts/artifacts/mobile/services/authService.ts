/**
 * Player identity: Google Sign-In or Guest (Firebase Anonymous).
 *
 * Player id is always the Firebase Auth UID. Guest play creates an anonymous
 * UID. Connecting Google *links* that same UID — progress is not copied onto
 * a different account. If that Google already owns another GUESSAi save,
 * linking is rejected and the guest stays a guest.
 *
 * Real-money purchases require a linked Google account.
 */

import {
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
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

export const GOOGLE_SAVE_IN_USE_MESSAGE =
  'This Google account already has a GUESSAi save. Choose a different Google account. You can keep playing as a guest.';

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

/** True only for a Google credential. */
export function isGoogleUser(user: User | null = auth.currentUser): user is User {
  if (!user) return false;
  return user.providerData.some((p) => p.providerId === 'google.com');
}

/** True for an anonymous guest session that has not linked Google. */
export function isGuestUser(user: User | null = auth.currentUser): boolean {
  if (!user) return false;
  if (isGoogleUser(user)) return false;
  return user.isAnonymous;
}

/** Google or guest — the two supported ways to hold a player id. */
export function isSignedInPlayer(user: User | null = auth.currentUser): user is User {
  if (!user) return false;
  return isGoogleUser(user) || user.isAnonymous;
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
    public readonly code:
      | 'popup_blocked'
      | 'cancelled'
      | 'native_not_configured'
      | 'already_in_use'
      | 'guest_unavailable'
      | 'unknown',
  ) {
    super(message);
    this.name = 'GoogleSignInError';
  }
}

function firebaseErrorCode(err: unknown): string {
  return (err as { code?: string })?.code ?? '';
}

function throwIfDuplicateGoogle(err: unknown): never {
  const code = firebaseErrorCode(err);
  if (
    code === 'auth/credential-already-in-use' ||
    code === 'auth/email-already-in-use' ||
    code === 'auth/account-exists-with-different-credential'
  ) {
    throw new GoogleSignInError(GOOGLE_SAVE_IN_USE_MESSAGE, 'already_in_use');
  }
  throw err instanceof GoogleSignInError
    ? err
    : new GoogleSignInError('Could not connect Google. Please try again.', 'unknown');
}

async function signOutGooglePlayQuietly(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const { signOutGooglePlay } = await import('./googleAuthNative');
    await signOutGooglePlay();
  } catch {
    // Best-effort so the next picker is not stuck on the rejected account.
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
    const code = firebaseErrorCode(err);
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

/** Create a guest player id (Firebase Anonymous Auth). Same nickname path as Google. */
export async function signInAsGuest(): Promise<string> {
  try {
    const { user } = await signInAnonymously(auth);
    _playerId = user.uid;
    return user.uid;
  } catch (err) {
    const code = firebaseErrorCode(err);
    if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation') {
      throw new GoogleSignInError(
        'Guest play is not enabled yet. Use Google, or turn on Anonymous sign-in in Firebase Authentication.',
        'guest_unavailable',
      );
    }
    throw new GoogleSignInError('Could not start as a guest. Please try again.', 'unknown');
  }
}

async function linkGoogleWeb(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new GoogleSignInError('Not signed in.', 'unknown');
  }
  const provider = new GoogleAuthProvider();
  try {
    const result = await linkWithPopup(user, provider);
    _playerId = result.user.uid;
    return result.user.uid;
  } catch (err) {
    const code = firebaseErrorCode(err);
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new GoogleSignInError('Sign-in was cancelled.', 'cancelled');
    }
    return throwIfDuplicateGoogle(err);
  }
}

export async function linkGoogleWithIdToken(idToken: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new GoogleSignInError('Not signed in.', 'unknown');
  }
  if (isGoogleUser(user)) return user.uid;
  const credential = GoogleAuthProvider.credential(idToken);
  try {
    const result = await linkWithCredential(user, credential);
    _playerId = result.user.uid;
    return result.user.uid;
  } catch (err) {
    await signOutGooglePlayQuietly();
    return throwIfDuplicateGoogle(err);
  }
}

/**
 * Attach Google to the *current* player id (guest stays the same UID).
 * Rejects if that Google already has another GUESSAi save.
 */
export async function linkCurrentUserWithGoogle(): Promise<string> {
  const user = auth.currentUser ?? (await waitForAuthReady());
  if (!user) {
    throw new GoogleSignInError('Not signed in.', 'unknown');
  }
  if (isGoogleUser(user)) return user.uid;

  try {
    if (Platform.OS === 'web') {
      return await linkGoogleWeb();
    }
    const { promptNativeGoogleIdToken, isNativeGoogleSignInConfigured } = await import(
      './googleAuthNative'
    );
    if (!isNativeGoogleSignInConfigured()) {
      throw new GoogleSignInError(
        "This build's Google OAuth client hasn't been finished yet.",
        'native_not_configured',
      );
    }
    const idToken = await promptNativeGoogleIdToken();
    return await linkGoogleWithIdToken(idToken);
  } catch (err) {
    if (err instanceof GoogleSignInError) throw err;
    return throwIfDuplicateGoogle(err);
  }
}

/**
 * Login Google button: restore/create that Google's save when signed out.
 * If already a guest, link instead so progress stays on this player id.
 */
export async function connectOrSignInWithGoogle(): Promise<string> {
  const user = auth.currentUser ?? (await waitForAuthReady());
  if (user && isGuestUser(user)) {
    return linkCurrentUserWithGoogle();
  }
  if (Platform.OS === 'web') {
    return signInWithGoogle();
  }
  const { promptNativeGoogleIdToken, isNativeGoogleSignInConfigured } = await import(
    './googleAuthNative'
  );
  if (!isNativeGoogleSignInConfigured()) {
    throw new GoogleSignInError(
      "This build's Google OAuth client hasn't been finished yet.",
      'native_not_configured',
    );
  }
  const idToken = await promptNativeGoogleIdToken();
  return signInWithGoogleIdToken(idToken);
}

/** Drop leftover sessions from unsupported Firebase providers. */
export async function signOutIfUnsupportedAuth(): Promise<void> {
  const user = auth.currentUser ?? (await waitForAuthReady());
  if (user && !isSignedInPlayer(user)) {
    await signOut();
  }
}

export async function signOut(): Promise<void> {
  await signOutGooglePlayQuietly();
  await firebaseSignOut(auth);
  _playerId = null;
}
