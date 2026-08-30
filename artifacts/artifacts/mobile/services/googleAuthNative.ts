/**
 * Native Google Sign-In via Play Services (not a browser OAuth page).
 *
 * Android OAuth client (package + SHA-1) lives in google-services.json and is
 * picked up by the native SDK. `webClientId` must be the Web OAuth client so
 * Google returns an ID token Firebase Auth can exchange via
 * `signInWithGoogleIdToken` in authService.ts.
 */
import { Platform } from 'react-native';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { GoogleSignInError } from './authService';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();

let configured = false;

function isGoogleClientId(value: string | undefined): value is string {
  return !!value && value.endsWith('.apps.googleusercontent.com');
}

function ensureConfigured(): void {
  if (configured) return;
  if (!isGoogleClientId(WEB_CLIENT_ID)) {
    throw new GoogleSignInError(
      "This build's Google OAuth client hasn't been finished yet.",
      'native_not_configured',
    );
  }
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: false,
  });
  configured = true;
}

export function isNativeGoogleSignInConfigured(): boolean {
  if (Platform.OS === 'web') return true;
  if (!isGoogleClientId(WEB_CLIENT_ID)) return false;
  if (Platform.OS === 'android') return isGoogleClientId(ANDROID_CLIENT_ID);
  return true;
}

/** Interactive Google account picker. Returns a Firebase-ready ID token. */
export async function promptNativeGoogleIdToken(): Promise<string> {
  if (!isNativeGoogleSignInConfigured()) {
    throw new GoogleSignInError(
      "This build's Google OAuth client hasn't been finished yet.",
      'native_not_configured',
    );
  }

  ensureConfigured();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      throw new GoogleSignInError('Sign-in was cancelled.', 'cancelled');
    }

    const idToken = response.data.idToken ?? (await GoogleSignin.getTokens()).idToken;
    if (!idToken) {
      throw new GoogleSignInError(
        'Google did not return a valid credential.',
        'unknown',
      );
    }
    return idToken;
  } catch (err) {
    if (err instanceof GoogleSignInError) throw err;
    if (isErrorWithCode(err)) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new GoogleSignInError('Sign-in was cancelled.', 'cancelled');
      }
      if (err.code === statusCodes.IN_PROGRESS) {
        throw new GoogleSignInError('Sign-in is already in progress.', 'unknown');
      }
      if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new GoogleSignInError(
          'Google Play Services is missing or outdated.',
          'unknown',
        );
      }
    }
    throw new GoogleSignInError(
      'Could not sign in with Google. Please try again.',
      'unknown',
    );
  }
}

export async function signOutGooglePlay(): Promise<void> {
  try {
    if (isGoogleClientId(WEB_CLIENT_ID)) {
      ensureConfigured();
    }
    await GoogleSignin.signOut();
  } catch {
    // Best-effort: Firebase sign-out still proceeds.
  }
}
