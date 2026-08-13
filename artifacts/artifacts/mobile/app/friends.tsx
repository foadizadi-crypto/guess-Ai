/**
 * friends.tsx — Friends screen (placeholder).
 *
 * Reachable from the lobby Friends button. The social backend is not built
 * yet, so this renders the screen frame plus the player's own profile card and
 * an explicit empty state. Replace the body with the real friends list when it
 * lands; the route and the lobby wiring stay as they are.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { AvatarFrame } from '@/components/AvatarFrame';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';

export default function FriendsScreen() {
  const username = useUserStore((s) => s.username);
  const level = useUserStore((s) => s.level);
  const avatars = useUserStore((s) => s.avatars);
  const selectedAvatarId = useUserStore((s) => s.selectedAvatarId);
  const equippedCosmetics = useUserStore((s) => s.equippedCosmetics);

  const currentAvatar = avatars?.find((avatar) => avatar.id === selectedAvatarId);

  return (
    <PlaceholderScreen
      title="Friends"
      icon="people"
      subtitle="Add friends, compare scores, and send each other stamina."
      testID="friends-screen"
    >
      <View style={styles.card}>
        <AvatarFrame
          imageKey={currentAvatar?.imageKey ?? 'abigail'}
          frameId={equippedCosmetics?.frame}
          size={64}
        />
        <View style={styles.cardText}>
          <Text style={styles.cardName} numberOfLines={1}>{username || 'Player'}</Text>
          <Text style={styles.cardMeta}>Level {level} · You</Text>
        </View>
      </View>

      <View style={styles.empty}>
        <Ionicons name="person-add-outline" size={28} color={GameColors.textSecondary} />
        <Text style={styles.emptyTitle}>No friends yet</Text>
        <Text style={styles.emptyCopy}>
          Friend codes and invites arrive with the social update.
        </Text>
      </View>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: GameColors.card,
    borderWidth: 1,
    borderColor: GameColors.cardBorder,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    ...Typography.bodyMedium,
    color: GameColors.textWhite,
  },
  cardMeta: {
    ...Typography.small,
    color: GameColors.textSecondary,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  emptyTitle: {
    ...Typography.bodyMedium,
    color: GameColors.textWhite,
  },
  emptyCopy: {
    ...Typography.small,
    color: GameColors.textSecondary,
    textAlign: 'center',
  },
});
