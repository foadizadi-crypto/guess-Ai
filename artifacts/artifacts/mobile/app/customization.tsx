/**
 * customization.tsx — Character Customization (Part 1 + Part 2)
 *
 * Lets the player pick their equipped avatar and wing. A live preview at the
 * top of the screen always reflects the current selection immediately.
 *
 * Both rows show every item in three states — equipped (highlighted),
 * owned (bright/tappable), locked (dimmed + lock icon, not tappable). Tapping
 * an owned item equips it immediately; the avatar and wing slots are
 * independent, so equipping one never touches the other.
 *
 * All equip state is the existing userStore state (selectedAvatarId,
 * avatars, ownedWings, equippedWing) — nothing new is introduced here, and
 * locked items never touch inventory or currency.
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

  // "None" is always owned/unlocked — it is not an inventory item.
  const wingRow = useMemo(
    () => [
      { id: null as string | null, name: 'None', owned: true },
      ...ALL_WINGS.map((w) => ({ id: w.id as string | null, name: w.name, owned: ownedWings.includes(w.id) })),
    ],
    [ownedWings],
  );

  const handleSelectAvatar = (avatarId: string, unlocked: boolean) => {
    // Locked items can never be equipped, and equipping never touches
    // inventory or currency — this is a pure state swap on an owned item.
    if (!unlocked || avatarId === selectedAvatarId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    selectAvatar(avatarId);
  };

  const handleSelectWing = (wingId: string | null, owned: boolean) => {
    if (!owned || wingId === equippedWing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    equipWing(wingId);
  };

  return (
    <AnimatedBackground
      backgroundImage={require('../assets/background/customization_BG.png')}
      overlayOpacity={0.42}
    >
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
                activeOpacity={locked ? 1 : 0.8}
                disabled={locked}
                onPress={() => handleSelectAvatar(avatar.id, avatar.unlocked)}
                style={[
                  styles.card,
                  !locked && !equipped && styles.cardOwned,
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
          {wingRow.map((wing) => {
            const equipped = wing.id === equippedWing;
            const locked = !wing.owned;
            return (
              <TouchableOpacity
                key={wing.id ?? 'none'}
                activeOpacity={locked ? 1 : 0.8}
                disabled={locked}
                onPress={() => handleSelectWing(wing.id, wing.owned)}
                style={[
                  styles.card,
                  !locked && !equipped && styles.cardOwned,
                  equipped && styles.cardEquipped,
                  locked && styles.cardLocked,
                ]}
              >
                {locked ? (
                  <Ionicons name="lock-closed" size={22} color={GameColors.textSecondary} />
                ) : (
                  <>
                    {wing.id === null && (
                      <Ionicons
                        name="close-circle-outline"
                        size={18}
                        color={GameColors.textSecondary}
                        style={{ marginBottom: 2 }}
                      />
                    )}
                    <Text style={styles.cardName} numberOfLines={1}>{wing.name}</Text>
                  </>
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
  cardOwned: {
    borderColor: 'rgba(255,255,255,0.28)',
  },
  cardEquipped: {
    borderColor: GameColors.accentGold,
    borderWidth: 2,
    backgroundColor: 'rgba(255,215,0,0.08)',
  },
  cardLocked: {
    opacity: 0.45,
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
});
