import { Redirect } from 'expo-router';

// The game doesn't use tabs — redirect any direct access to lobby.
export default function TabsIndex() {
  return <Redirect href="/lobby" />;
}
