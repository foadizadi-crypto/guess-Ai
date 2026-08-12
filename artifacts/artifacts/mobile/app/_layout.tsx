import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from 'react-native-error-boundary';
import { useUserStore } from '@/store/userStore';
import { GameColors } from '@/theme/colors';

/**
 * Root Error Fallback UI Component
 * Displays a clean container if a runtime fatal crash occurs.
 */
function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
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
 * CRITICAL AUDIT FIX (P0): Implements a hard hydration state guard to eliminate
 * race conditions between Zustand async AsyncStorage hydration and screen renders.
 */
export default function RootLayout() {
  const [storeReady, setStoreReady] = useState<boolean>(false);

  // --- CRITICAL AUDIT FIX (P0): Zustand AsyncStorage Hydration Synchronization ---
  useEffect(() => {
    // Check if the persist store dehydration pipeline has completed successfully
    const hasHydrated = useUserStore.persist?.hasHydrated();
    
    if (hasHydrated) {
      setStoreReady(true);
    } else {
      // Listen to the active stream and unlock rendering only when data is fully loaded
      const unsubHydrate = useUserStore.persist.onHydrate(() => {
        console.log('[Store Pipeline] Hydration triggered...');
      });

      const unsubFinishHydrate = useUserStore.persist.onFinishHydrate(() => {
        console.log('[Store Pipeline] AsyncStorage sync complete. Launching interface safely.');
        setStoreReady(true);
      });

      return () => {
        unsubHydrate();
        unsubFinishHydrate();
      };
    }
  }, []);

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
        {/* Implicit navigation tree branches inject here via Expo Router */}
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
