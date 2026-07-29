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
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { Platform } from 'react-native';

// ─── Firebase project config (from google-services.json / Firebase console) ─
const firebaseConfig = {
  apiKey:            'AIzaSyBVt8KqSIKaA9KckVU_JJMbuGuCOzzi6is',
  authDomain:        'blurquiz.firebaseapp.com',
  projectId:         'blurquiz',
  storageBucket:     'blurquiz.firebasestorage.app',
  messagingSenderId: '856856840962',
  appId:             '1:856856840962:android:9dd686ea2d6aa7a9c6101b',
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
    // @react-native-async-storage/async-storage is already in devDependencies
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
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
