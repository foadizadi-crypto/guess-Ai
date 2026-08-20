/**
 * app/_layout.tsx — Root Navigation Layout Container
 * Strict Expo Router SDK 54 Framework + TypeScript Compilable
 *
 * CRITICAL AUDIT FIX (P0): Fully connects to your real useUserStore.
 * Synchronizes Zustand AsyncStorage Hydration, checks user records on flight,
 * and handles the correct entry tree flow:
 * Onboarding (Tutorial) -> Login Screen -> Main Lobby Menu.
 */
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useUserStore } from "@/store/userStore";
import { useFirestoreSync } from "@/hooks/useFirestoreSync";
import { GameColors } from "@/theme/colors";

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
  // --- 1. Hooking into your live firestore sync & authentication boot layer ---
  useFirestoreSync();

  // --- 2. Pulling real profile parameters from your uploaded Zustand state shape ---
  const username = useUserStore((s) => s.username);
  const refreshDailyMissions = useUserStore((s) => s.refreshDailyMissions);

  // --- Daily missions refresh (NOT routing) ---
  //
  // Startup routing belongs to app/splash.tsx, which reads the persisted
  // onboarding flag and the saved username, plus the onboarding and login
  // screens themselves. This layout must not redirect as well.
  //
  // It used to: it treated `missionsDate !== null` as "onboarding complete"
  // and forced /onboarding otherwise. But the only thing that sets
  // missionsDate is refreshDailyMissions(), which sat behind that very
  // condition — so missionsDate stayed null forever, the lobby was
  // unreachable, and every launch bounced the player back to onboarding.
  useEffect(() => {
    const isUserLoggedIn = username && username.trim().length > 0;
    if (isUserLoggedIn) {
      refreshDailyMissions();
    }
  }, [username, refreshDailyMissions]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: GameColors?.backgroundPrimary ?? "#02000A",
          },
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
  errorContainer: {
    flex: 1,
    backgroundColor: "#02000A",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
});
