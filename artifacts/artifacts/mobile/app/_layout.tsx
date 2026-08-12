/**
 * app/_layout.tsx — Root Navigation Layout Container
 * Strict Expo Router SDK 54 Framework + TypeScript Compilable
 *
 * CRITICAL AUDIT FIX (P0): Fully connects to your real useUserStore.
 * Synchronizes Zustand AsyncStorage Hydration, checks user records on flight,
 * and handles the correct entry tree flow:
 * Onboarding (Tutorial) -> Login Screen -> Main Lobby Menu.
 */
import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import ErrorBoundary from 'react-native-error-boundary';
import { useUserStore } from '@/store/userStore';
import { useFirestoreSync } from '@/hooks/useFirestoreSync';
import { GameColors } from '@/theme/colors';

/**
 * Root Error Fallback UI Component
 * Captures catastrophic runtime crashes safely preventing White Screen of Death.
 */
function ErrorFallback({ error }: { error: Error; resetError: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <ActivityIndicator size="large" color="#FF1744" />
    </View>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const [storeReady, setStoreReady] = useState<boolean>(false);
  
  // --- 1. Hooking into your live firestore sync & authentication boot layer ---
  useFirestoreSync();

  // --- 2. Pulling real profile parameters from your uploaded Zustand state shape ---
  const username = useUserStore((s) => s.username);
  const missionsDate = useUserStore((s) => s.missionsDate);
  const refreshDailyMissions = useUserStore((s) => s.refreshDailyMissions);

  // --- CRITICAL AUDIT FIX (P0): Zustand AsyncStorage Hydration Synchronization ---
  useEffect(() => {
    // Check if the store has already initialized from AsyncStorage cache buffer
    const hasHydrated = useUserStore.persist?.hasHydrated();
    
    if (hasHydrated) {
      setStoreReady(true);
    } else {
      const unsubFinishHydrate = useUserStore.persist.onFinishHydrate(() => {
        console.log('[Store Pipeline] AsyncStorage persistence sync complete.');
        setStoreReady(true);
      });

      return () => {
        unsubFinishHydrate();
      };
    }
  }, []);

  // --- FLOW CONTROLLER ROUTER REDIRECTION ENGINE ---
  useEffect(() => {
    if (!storeReady) return;

    // Check if username exists to evaluate authentication status
    const isUserLoggedIn = username && username.trim().length > 0;

    // Evaluate onboarding status from user store missionsDate checkpoint or custom logic
    // Since storageService.isOnboardingDone() updates async, we monitor if missions are initialized
    const hasCompletedOnboarding = missionsDate !== null;

    if (!hasCompletedOnboarding) {
      // Force user to land on the initial onboarding tutorial path folder
      router.replace('/onboarding');
    } else if (!isUserLoggedIn) {
      // Force user to cross the login authentication layer gate
      router.replace('/login');
    } else {
      // Safe Path: Auto-load live missions and launch directly into the main lobby
      refreshDailyMissions();
      router.replace('/lobby');
    }
  }, [storeReady, username, missionsDate]);

  // Render native loading spinner until store state data is fully populated from memory
  if (!storeReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: GameColors?.backgroundPrimary ?? '#02000A' },
        }}
      >
        {/* Explicit route screen matching indices mapping */}
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="lobby" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="game" />
        <Stack.Screen name="shop" />
      </Stack>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#02000A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#02000A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});
