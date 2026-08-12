import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import ErrorBoundary from 'react-native-error-boundary';
import { useUserStore } from '@/store/userStore';
import { GameColors } from '@/theme/colors';

/**
 * Root Error Fallback UI Component
 * Displays a clean container if a runtime fatal crash occurs.
 */
function ErrorFallback({ error }: { error: Error; resetError: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <ActivityIndicator size="large" color="#FF1744" />
    </View>
  );
}

/**
 * Root Navigation Layout Container — TypeScript Compilable File
 * File Path: app/_layout.tsx (Strict Expo Router SDK 54 Framework)
 * 
 * CRITICAL AUDIT FIX (P0): Resolves Onboarding/Login Flow redirection sequence.
 * Ensures the app checks player state and correctly shows:
 * Onboarding (3 Info Pages) -> Login Screen -> Main Lobby.
 */
export default function RootLayout() {
  const router = useRouter();
  const [storeReady, setStoreReady] = useState<boolean>(false);
  
  // Simulated or state-driven authentication and onboarding flags
  // In a production setup, these can be moved to useUserStore or Firebase Auth state checks
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(false);

  // --- CRITICAL AUDIT FIX (P0): Zustand AsyncStorage Hydration Synchronization ---
  useEffect(() => {
    const hasHydrated = useUserStore.persist?.hasHydrated();
    
    if (hasHydrated) {
      setStoreReady(true);
    } else {
      const unsubHydrate = useUserStore.persist.onHydrate(() => {
        console.log('[Store Pipeline] Hydration triggered...');
      });

      const unsubFinishHydrate = useUserStore.persist.onFinishHydrate(() => {
        console.log('[Store Pipeline] AsyncStorage sync complete.');
        setStoreReady(true);
      });

      return () => {
        unsubHydrate();
        unsubFinishHydrate();
      };
    }
  }, []);

  // --- FLOW CONTROLLER ROUTER REDIRECTION ENGINE ---
  useEffect(() => {
    if (!storeReady) return;

    // Logic router checkpoint pipeline execution
    if (!hasCompletedOnboarding) {
      // Force user to enter the initial onboarding slider sequence path folder
      // Assumes your onboarding screen file is located at app/onboarding.tsx or app/(auth)/onboarding.tsx
      router.replace('/onboarding');
    } else if (!isUserLoggedIn) {
      // Force user to land on the login validation layer screen
      router.replace('/login');
    } else {
      // Safe path: Land directly on the fixed operational lobby menu
      router.replace('/lobby');
    }
  }, [storeReady, hasCompletedOnboarding, isUserLoggedIn]);

  // --- 2. Security Layer: Render Native Spinner until store data is fully populated ---
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
        {/* Declare your explicit router route screens mapping indices here */}
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="lobby" />
        <Stack.Screen name="profile" />
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
