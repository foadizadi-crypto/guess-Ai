/**
 * Firebase initialization — Expo Go + EAS compatible.
 *
 * Uses the modular Firebase JS SDK (firebase@^12) which works in Expo Go
 * without any native build steps.  Auth is persisted via AsyncStorage on
 * native so sessions survive app restarts.
 *
 * Usage:
 *   import { auth, db } from '@/services/firebase';
 *   import { signInWithEmailAndPassword } from 'firebase/auth';
 *   import { collection, getDocs } from 'firebase/firestore';
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, initializeAuth } from 'firebase/auth';
// getReactNativePersistence is only available via @firebase/auth's react-native
// conditional export (resolved by Metro at runtime). We require it dynamically
// inside the try/catch below so TypeScript doesn't attempt a static resolution
// against the browser types where it is absent.
import { Platform } from 'react-native';

// ─── Firebase project config (must match google-services.json) ─
const firebaseConfig = {
  apiKey: "AIzaSyADHkHJ0xCWoLc0fKoHlJXFttdJqZPCq7U",
  authDomain: "guess-ai-ai.firebaseapp.com",
  projectId: "guess-ai-ai",
  storageBucket: "guess-ai-ai.firebasestorage.app",
  messagingSenderId: "593305587333",
  appId: "1:593305587333:android:6b48d5ec9d54622269e3ec",
};

// Guard against hot-reload double-initialization
const isFirstInit = getApps().length === 0;
const firebaseApp = isFirstInit ? initializeApp(firebaseConfig) : getApp();

// ─── Auth ─────────────────────────────────────────────────────────────────
// On native: use AsyncStorage persistence so sessions survive app restarts.
// On web / hot-reload re-run: getAuth() returns the already-created instance.
let _auth: ReturnType<typeof getAuth>;

if (!isFirstInit || Platform.OS === 'web') {
  _auth = getAuth(firebaseApp);
} else {
  try {
    // Both requires resolve via Metro's react-native conditional export at runtime.
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const { getReactNativePersistence } = require('@firebase/auth') as any;
    _auth = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Fallback: in-memory (sessions don't persist across restarts — acceptable for dev)
    _auth = getAuth(firebaseApp);
  }
}

export const auth = _auth;

// ─── Firestore ────────────────────────────────────────────────────────────
export const db = getFirestore(firebaseApp);

export default firebaseApp;
