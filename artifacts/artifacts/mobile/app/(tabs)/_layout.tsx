import { Stack } from 'expo-router';
import { GameColors } from '@/theme/colors';

// The game doesn't use a tab layout — all navigation is via a Stack.
// This minimal layout exists so Expo Router doesn't error on the (tabs) group.
export default function TabsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: GameColors.backgroundPrimary },
      }}
    />
  );
}
