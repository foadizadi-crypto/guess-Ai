import React, { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Stack, router } from 'expo-router';
import { GameColors } from '@/theme/colors';
import { useFirestoreSync } from '@/hooks/useFirestoreSync';
import { notificationService } from '@/services/NotificationService';
import { openAIService } from '@/services/OpenAIService';
import { savePushToken } from '@/services/firestoreService';
import { waitForAuthReady } from '@/services/authService';

const queryClient = new QueryClient();

/** Runs Firestore player-profile sync in the background once signed in. */
function FirestoreSyncProvider() {
  useFirestoreSync();
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

  useEffect(() => {
    // One-time setup: Android channels + foreground handler
    notificationService.setup().then(async () => {
      const granted = await notificationService.requestPermission();
      if (!granted) return;

      // Schedule recurring reminders once on first mount
      await notificationService.scheduleDailyReward();
      await notificationService.scheduleWeeklyReward();

      // Permission is now confirmed — fetch and persist the push token
      // (persistPushToken() itself no-ops until the player is signed in).
      await persistPushToken();
    });

    // AppState: schedule 3-day inactive reminder when app backgrounds,
    // cancel it when the player returns.  Also retry token persistence on
    // resume so users who grant permission via OS Settings are covered.
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prev = appState.current;
      appState.current = nextState;

      if (prev === 'active' && nextState === 'background') {
        notificationService.scheduleInactiveReminder();
      } else if (prev !== 'active' && nextState === 'active') {
        notificationService.cancelInactiveReminder();
        // Retry token save in case permission was just enabled in OS Settings.
        persistPushToken();
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
  }, []);

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
              <NotificationProvider />
              <RootLayoutNav />
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
