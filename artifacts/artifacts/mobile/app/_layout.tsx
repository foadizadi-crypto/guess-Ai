import React, { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Stack, router, usePathname } from 'expo-router';
import { GameColors } from '@/theme/colors';
import { useFirestoreSync } from '@/hooks/useFirestoreSync';
import { notificationService } from '@/services/NotificationService';
import { savePushToken } from '@/services/firestoreService';
import { waitForAuthReady, getPlayerId, onPlayerIdChange, isSignedInPlayer, signOutIfUnsupportedAuth } from '@/services/authService';
import { useUserStore } from '@/store/userStore';
import { ROUTES } from '@/navigation/routes';
import { adService } from '@/services/AdService';
import { useAudio } from '@/hooks/useAudio';

const queryClient = new QueryClient();

/** Runs Firestore player-profile sync in the background once signed in. */
function FirestoreSyncProvider() {
  useFirestoreSync();
  return null;
}

function AdsProvider() {
  useEffect(() => {
    void adService.initialize();
  }, []);
  return null;
}

function AudioProvider() {
  useAudio();
  return null;
}

// Routes reachable with no signed-in session and/or no registered nickname yet.
// Every other route — including deep links opened directly — is guarded below.
const PUBLIC_ROUTES: readonly string[] = ['/', ROUTES.SPLASH, ROUTES.ONBOARDING, ROUTES.LOGIN, ROUTES.LEGAL];

/**
 * Gameplay routes require a Google or guest session. Nickname is still gated on lobby.
 */
function AuthGuard() {
  const pathname = usePathname();
  const [uid, setUid] = useState<string | null>(getPlayerId());
  const [signedIn, setSignedIn] = useState(isSignedInPlayer());
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsub = onPlayerIdChange((next) => {
      setUid(next);
      setSignedIn(isSignedInPlayer());
    });
    waitForAuthReady().then(async (user) => {
      if (user && !isSignedInPlayer(user)) {
        await signOutIfUnsupportedAuth();
        setUid(null);
        setSignedIn(false);
      } else {
        setUid((prev) => prev ?? user?.uid ?? getPlayerId());
        setSignedIn(isSignedInPlayer(user));
      }
      setAuthChecked(true);
    });
    return unsub;
  }, []);

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (!authChecked || isPublic) return;
    if (signedIn && uid) return;
    router.replace(ROUTES.LOGIN);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, uid, signedIn, pathname, isPublic]);

  return null;
}

/**
 * Fetch the Expo push token (if permission is granted) and persist it to
 * Firestore. Sign-in happens on the login screen, not at app boot, so a UID
 * may not exist yet here — in that case this is a no-op.
 */
async function persistPushToken(): Promise<void> {
  try {
    const token = await notificationService.getExpoPushToken();
    if (!token) return;
    if (__DEV__) console.log('[Push token]', token);
    const user = await waitForAuthReady();
    if (!user) return;
    await savePushToken(user.uid, token);
  } catch (err) {
    console.warn('[Push token] failed to persist:', err);
  }
}

/** Initialises push-notification permissions, channels, and recurring reminders. */
function NotificationProvider() {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const notificationsEnabled = useUserStore((s) => s.settings.notifications);
  const notificationsEnabledRef = useRef(notificationsEnabled);
  notificationsEnabledRef.current = notificationsEnabled;

  useEffect(() => {
    let cancelled = false;
    // Setup is idempotent. The saved preference controls permission-dependent
    // scheduling, and this effect also runs when Settings changes it.
    notificationService.setup().then(async () => {
      if (cancelled) return;
      if (!notificationsEnabled) {
        await notificationService.cancelAllScheduledNotifications();
        return;
      }

      const granted = await notificationService.requestPermission();
      if (!granted || cancelled) {
        await notificationService.cancelAllScheduledNotifications();
        return;
      }

      await notificationService.scheduleDailyReward();
      await notificationService.scheduleWeeklyReward();
      await persistPushToken();
    });

    // AppState: schedule 3-day inactive reminder when app backgrounds,
    // cancel it when the player returns.  Also retry token persistence on
    // resume so users who grant permission via OS Settings are covered.
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prev = appState.current;
      appState.current = nextState;

      if (prev === 'active' && nextState === 'background') {
        if (notificationsEnabledRef.current) {
          notificationService.scheduleInactiveReminder();
        }
      } else if (prev !== 'active' && nextState === 'active') {
        if (notificationsEnabledRef.current) {
          notificationService.cancelInactiveReminder();
        }
        // Retry token save in case permission was just enabled in OS Settings.
        if (notificationsEnabledRef.current) persistPushToken();
      }
    });

    // Navigate to the correct screen when the user taps a notification
    const removeResponseListener = notificationService.addResponseListener((screen) => {
      router.push(screen as Parameters<typeof router.push>[0]);
    });

    return () => { sub.remove(); removeResponseListener(); };
  }, [notificationsEnabled]);

  return null;
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { flex: 1, backgroundColor: GameColors.backgroundPrimary },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="lobby" />
      <Stack.Screen name="level-select" />
      <Stack.Screen name="category-select" />
      <Stack.Screen name="game" />
      <Stack.Screen name="speed-card" />
      <Stack.Screen name="result" />
      <Stack.Screen name="shop" />
      <Stack.Screen name="leaderboard" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="daily-reward" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="legal" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="collections" />
      <Stack.Screen name="collection-detail" />
      <Stack.Screen name="spin" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
              <FirestoreSyncProvider />
              <AudioProvider />
              <AdsProvider />
              <NotificationProvider />
              <AuthGuard />
              <RootLayoutNav />
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
