/**
 * customization.tsx — Character Customization (Part 1)
 *
 * Lets the player pick their equipped avatar and wing. A live preview at the
 * top of the screen always reflects the current selection immediately.
 *
 * All equip state is the existing userStore state (selectedAvatarId,
 * avatars, ownedWings, equippedWing) — nothing new is introduced here.
 */
import React, { useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { CharacterStage } from '@/components/CharacterStage';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { ALL_WINGS } from '@/constants/wings';
import { ROUTES } from '@/navigation/routes';

export default function CustomizationScreen() {
  const insets = useSafeAreaInsets();

  const avatars = useUserStore((s) => s.avatars);
  const selectedAvatarId = useUserStore((s) => s.selectedAvatarId);
  const selectAvatar = useUserStore((s) => s.selectAvatar);
  const ownedWings = useUserStore((s) => s.ownedWings);
  const equippedWing = useUserStore((s) => s.equippedWing);
  const equipWing = useUserStore((s) => s.equipWing);
  const level = useUserStore((s) => s.level);

  const topPad = Platform.OS === 'web' ? 20 : insets.top + 6;
  const bottomPad = Platform.OS === 'web' ? 20 : insets.bottom + 20;

  const ownedWingDefs = useMemo(
    () => ALL_WINGS.filter((w) => ownedWings.includes(w.id)),
    [ownedWings],
  );

  const handleSelectAvatar = (avatarId: string) => {
    if (avatarId === selectedAvatarId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    selectAvatar(avatarId);
  };

  const handleSelectWing = (wingId: string | null) => {
    if (wingId === equippedWing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    equipWing(wingId);
  };

  return (
    <AnimatedBackground>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <BackButton fallbackRoute={ROUTES.LOBBY} />
        <Text style={styles.headerTitle}>Customize</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* ── Live preview — top ~50% of the screen ─────────────────────── */}
      <View style={styles.previewWrap}>
        <CharacterStage avatarId={selectedAvatarId} wingId={equippedWing} />
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>LVL {level}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatars ────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Avatars</Text>
        <View style={styles.grid}>
          {avatars.map((avatar) => {
            const equipped = avatar.id === selectedAvatarId;
            const locked = !avatar.unlocked;
            return (
              <TouchableOpacity
                key={avatar.id}
                activeOpacity={0.8}
                disabled={locked}
                onPress={() => handleSelectAvatar(avatar.id)}
                style={[
                  styles.card,
                  equipped && styles.cardEquipped,
                  locked && styles.cardLocked,
                ]}
              >
                {locked ? (
                  <Ionicons name="lock-closed" size={22} color={GameColors.textSecondary} />
                ) : (
                  <Text style={styles.cardName} numberOfLines={1}>{avatar.name}</Text>
                )}
                {equipped && (
                  <View style={styles.equippedTag}>
                    <Text style={styles.equippedTagText}>Equipped</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Wings ──────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Wings</Text>
        <View style={styles.grid}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSelectWing(null)}
            style={[styles.card, equippedWing === null && styles.cardEquipped]}
          >
            <Ionicons name="close-circle-outline" size={22} color={GameColors.textSecondary} />
            <Text style={styles.cardName}>None</Text>
            {equippedWing === null && (
              <View style={styles.equippedTag}>
                <Text style={styles.equippedTagText}>Equipped</Text>
              </View>
            )}
          </TouchableOpacity>

          {ownedWingDefs.map((wing) => {
            const equipped = wing.id === equippedWing;
            return (
              <TouchableOpacity
                key={wing.id}
                activeOpacity={0.8}
                onPress={() => handleSelectWing(wing.id)}
                style={[styles.card, equipped && styles.cardEquipped]}
              >
                <Text style={styles.cardName} numberOfLines={1}>{wing.name}</Text>
                {equipped && (
                  <View style={styles.equippedTag}>
                    <Text style={styles.equippedTagText}>Equipped</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {ownedWingDefs.length === 0 && (
            <Text style={styles.emptyHint}>
              No wings owned yet — find them in the Shop.
            </Text>
          )}
        </View>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    ...Typography.header,
    fontSize: 24,
    lineHeight: 30,
    color: GameColors.textWhite,
  },
  headerSpacer: {
    width: 44,
  },
  previewWrap: {
    height: '46%',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: GameColors.border,
  },
  levelBadge: {
    position: 'absolute',
    left: '50%',
    bottom: 10,
    transform: [{ translateX: -30 }],
    minWidth: 60,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(8, 14, 36, 0.86)',
    borderWidth: 1,
    borderColor: GameColors.accentGold,
    alignItems: 'center',
  },
  levelText: {
    color: GameColors.accentGold,
    fontSize: 12,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    ...Typography.semibold,
    color: GameColors.textWhite,
    marginTop: 12,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '30.5%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: GameColors.card,
    borderWidth: 1,
    borderColor: GameColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  cardEquipped: {
    borderColor: GameColors.accentGold,
    borderWidth: 2,
    backgroundColor: 'rgba(255,215,0,0.08)',
  },
  cardLocked: {
    opacity: 0.5,
  },
  cardName: {
    ...Typography.small,
    color: GameColors.textWhite,
    textAlign: 'center',
  },
  equippedTag: {
    position: 'absolute',
    bottom: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: GameColors.accentGold,
  },
  equippedTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: GameColors.backgroundPrimary,
  },
  emptyHint: {
    ...Typography.small,
    color: GameColors.textSecondary,
    marginTop: 4,
  },
});
