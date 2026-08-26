import React, { useEffect, useRef, useState } from 'react';
import { AppState, View, StyleSheet, type AppStateStatus } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Stack, router, usePathname } from 'expo-router';
import { GameColors } from '@/theme/colors';
import { useFirestoreSync } from '@/hooks/useFirestoreSync';
import { notificationService } from '@/services/NotificationService';
import { openAIService } from '@/services/OpenAIService';
import { savePushToken } from '@/services/firestoreService';
import { waitForAuthReady, getPlayerId, onPlayerIdChange } from '@/services/authService';
import { isValidPlayerName } from '@/components/PlayerNameModal';
import { useUserStore } from '@/store/userStore';
import { ROUTES } from '@/navigation/routes';
import { useAudio } from '@/hooks/useAudio';

const queryClient = new QueryClient();

/** Runs Firestore player-profile sync in the background once signed in. */
function FirestoreSyncProvider() {
  useFirestoreSync();
  return null;
}

/** Keeps the persisted audio preferences connected for the whole app. */
function AudioProvider() {
  useAudio();
  return null;
}

// Routes reachable with no Google session and/or no registered nickname yet.
// Every other route — including deep links opened directly — is guarded below.
const PUBLIC_ROUTES: readonly string[] = ['/', ROUTES.SPLASH, ROUTES.ONBOARDING, ROUTES.LOGIN];

/**
 * Centralized navigation guard: mandatory Google Sign-In and a registered
 * nickname are enforced here, not just at the buttons that normally lead a
 * player through the flow — so opening a gameplay route directly (a deep
 * link, a stale bookmark, a notification tap) can never skip either step.
 */
function AuthGuard() {
  const pathname = usePathname();
  const username = useUserStore((s) => s.username);
  const isNicknameVerifiedFor = useUserStore((s) => s.isNicknameVerifiedFor);
  const [uid, setUid] = useState<string | null>(getPlayerId());
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    waitForAuthReady().then((user) => {
      console.log('[Guard] auth check complete', { pathname, signedIn: !!user });
      setUid(user?.uid ?? null);
      setAuthChecked(true);
    });
    return onPlayerIdChange((next) => setUid(next));
  }, []);

  // A `username` string alone is not proof of a valid nickname — it may be
  // a leftover from a previously signed-in account on this device. Only a
  // nickname verified for THIS exact uid (see userStore.nicknameUid) counts.
  const hasVerifiedNickname = !!uid && isNicknameVerifiedFor(uid) && isValidPlayerName(username);
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const needsRedirect = authChecked && !isPublic
    && (!uid || (pathname !== ROUTES.LOBBY && !hasVerifiedNickname));

  useEffect(() => {
    if (!authChecked || isPublic) return;
    if (!uid) {
      console.log('[Guard] protected route -> login', { pathname });
      router.replace(ROUTES.LOGIN);
    } else if (pathname !== ROUTES.LOBBY && !hasVerifiedNickname) {
      console.log('[Guard] protected route -> lobby', { pathname });
      router.replace(ROUTES.LOBBY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, uid, hasVerifiedNickname, pathname, isPublic]);

  // While the auth/nickname check is pending (or a redirect is about to
  // fire) on a protected route, cover the screen so gated content never
  // flashes visibly before the redirect completes.
  if (!isPublic && (!authChecked || needsRedirect)) {
    return <View style={styles.guardOverlay} pointerEvents="auto" />;
  }
  return null;
}

/**
 * Fetch the Expo push token (if permission is granted) and persist it to
 * Firestore. Google Sign-In is mandatory but happens on the login screen,
 * not at app boot, so a UID may not exist yet here (e.g. first launch,
 * before the player has signed in) — in that case this is a no-op and the
 * retry on the next AppState resume (or the next app launch, once signed
 * in) picks it up instead of silently pretending to succeed with no UID.
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
        // Silently refresh stale question caches in the background so players
        // rarely hit the offline error screen after days away.
        openAIService.warmCache();
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
        contentStyle: { backgroundColor: GameColors.backgroundPrimary },
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
      <Stack.Screen name="result" />
      <Stack.Screen name="shop" />
      <Stack.Screen name="leaderboard" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="daily-reward" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="collections" />
      <Stack.Screen name="collection-detail" />
      <Stack.Screen name="spin" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  guardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GameColors.backgroundPrimary,
    zIndex: 9999,
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
              <FirestoreSyncProvider />
              <AudioProvider />
              <NotificationProvider />
              <AuthGuard />
              <RootLayoutNav />
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
