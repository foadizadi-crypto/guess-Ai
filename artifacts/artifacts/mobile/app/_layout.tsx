import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Stack } from 'expo-router';
import { GameColors } from '@/theme/colors';
import { useFirestoreSync } from '@/hooks/useFirestoreSync';

const queryClient = new QueryClient();

/** Runs Firestore anonymous-auth init + player profile sync in the background. */
function FirestoreSyncProvider() {
  useFirestoreSync();
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
            <KeyboardProvider>
              <FirestoreSyncProvider />
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
