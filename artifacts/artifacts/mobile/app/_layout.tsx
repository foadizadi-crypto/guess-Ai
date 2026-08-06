import React, { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Stack } from 'expo-router';
import { GameColors } from '@/theme/colors';
import { useFirestoreSync } from '@/hooks/useFirestoreSync';
import { notificationService } from '@/services/NotificationService';

const queryClient = new QueryClient();

/** Runs Firestore anonymous-auth init + player profile sync in the background. */
function FirestoreSyncProvider() {
  useFirestoreSync();
  return null;
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

      // Attempt to obtain the Expo push token for remote notifications
      // (events, leaderboard, shop offers, new content — triggered server-side)
      notificationService.getExpoPushToken().then((token) => {
        if (token) {
          // TODO: send token to your backend
          // e.g. firestoreService.savePushToken(playerId, token)
          if (__DEV__) console.log('[Push token]', token);
        }
      });
    });

    // AppState: schedule 3-day inactive reminder when app backgrounds,
    // cancel it when the player returns.
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prev = appState.current;
      appState.current = nextState;

      if (prev === 'active' && nextState === 'background') {
        notificationService.scheduleInactiveReminder();
      } else if (prev !== 'active' && nextState === 'active') {
        notificationService.cancelInactiveReminder();
      }
    });

    return () => sub.remove();
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
