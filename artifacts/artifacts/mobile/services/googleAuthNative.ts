/**
 * Native (iOS/Android) Google Sign-In via expo-auth-session.
 *
 * This needs a real Google OAuth client per platform:
 *   - Android: an "Android" client with the app's SHA-1 fingerprint
 *     registered in Google Cloud Console for package `com.aiblur.quiz`.
 *   - iOS: an "iOS" client with bundle id `com.aiblur.quiz`.
 * Until those exist, `isNativeGoogleSignInConfigured()` returns false and
 * the login screen shows a clear message instead of attempting a flow that
 * cannot complete (Google rejects the OAuth redirect without a matching
 * native client — there is no working fallback).
 *
 * Configure via env vars (public, non-secret client ids):
 *   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
 *   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
 */
import { useMemo } from 'react';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export function isNativeGoogleSignInConfigured(): boolean {
  if (Platform.OS === 'android') return !!ANDROID_CLIENT_ID;
  if (Platform.OS === 'ios') return !!IOS_CLIENT_ID;
  return true; // web doesn't use this module at all
}

/**
 * React hook wrapping expo-auth-session's Google provider. Returns a
 * `promptAsync`-style function plus the raw response so the caller (the
 * login screen) can exchange a successful id_token for a Firebase
 * credential via `signInWithGoogleIdToken`.
 */
export function useGoogleSignIn() {
  const configured = isNativeGoogleSignInConfigured();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    // Not used by our flow (web goes through Firebase popup/redirect
    // directly), but the hook requires some client id to build a request.
    clientId: ANDROID_CLIENT_ID ?? IOS_CLIENT_ID,
  });

  const redirectUri = useMemo(() => AuthSession.makeRedirectUri(), []);

  return { configured, request, response, promptAsync, redirectUri };
}
