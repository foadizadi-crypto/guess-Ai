/**
 * Character customization — live preview plus Avatar / Wings / Pets / Stands.
 *
 * Preview uses the same auto-sizing compositor as the lobby: wings attach
 * to the detected center of the avatar's back for any asset pair.
 */
import React, { useMemo, useState, useEffect } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { hapticsService } from '@/services/HapticsService';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { CharacterStage } from '@/components/CharacterStage';
import { GradientButton } from '@/components/GradientButton';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { ALL_WINGS } from '@/constants/wings';
import { ALL_PETS } from '@/constants/pets';
import { ALL_STANDS } from '@/constants/stands';
import { getAvatarSource, getWingSource } from '@/constants/characterSources';
import { ROUTES } from '@/navigation/routes';

type CatalogTab = 'avatars' | 'wings' | 'pets' | 'stands';

const TABS: { id: CatalogTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'avatars', label: 'Avatar', icon: 'person' },
  { id: 'wings', label: 'Wings', icon: 'sparkles' },
  { id: 'pets', label: 'Pets', icon: 'paw' },
  { id: 'stands', label: 'Stands', icon: 'cube' },
];

function notify(title: string, body: string) {
  if (Platform.OS === 'web' && typeof globalThis.alert === 'function') {
    globalThis.alert(`${title}\n\n${body}`);
    return;
  }
  Alert.alert(title, body);
}

export default function CustomizationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const initialTab: CatalogTab =
    tabParam === 'wings' || tabParam === 'pets' || tabParam === 'stands' || tabParam === 'avatars'
      ? tabParam
      : 'avatars';
  const [tab, setTab] = useState<CatalogTab>(initialTab);

  useEffect(() => {
    if (tabParam === 'wings' || tabParam === 'pets' || tabParam === 'stands' || tabParam === 'avatars') {
      setTab(tabParam);
    }
  }, [tabParam]);

  const avatars = useUserStore((s) => s.avatars);
  const selectedAvatarId = useUserStore((s) => s.selectedAvatarId);
  const selectAvatar = useUserStore((s) => s.selectAvatar);
  const ownedWings = useUserStore((s) => s.ownedWings);
  const equippedWing = useUserStore((s) => s.equippedWing);
  const equipWing = useUserStore((s) => s.equipWing);
  const ownedPets = useUserStore((s) => s.ownedPets);
  const equippedPet = useUserStore((s) => s.equippedPet);
  const equipPet = useUserStore((s) => s.equipPet);
  const ownedStands = useUserStore((s) => s.ownedStands);
  const equippedStand = useUserStore((s) => s.equippedStand);
  const equipStand = useUserStore((s) => s.equipStand);
  const level = useUserStore((s) => s.level);

  const topPad = Platform.OS === 'web' ? 20 : insets.top + 6;
  const bottomPad = Platform.OS === 'web' ? 20 : insets.bottom + 16;

  const wingRow = useMemo(
    () => [
      { id: null as string | null, name: 'None', owned: true, icon: 'close-circle-outline' },
      ...ALL_WINGS.map((w) => ({
        id: w.id as string | null,
        name: w.name,
        owned: ownedWings.includes(w.id),
        icon: 'image-outline',
      })),
    ],
    [ownedWings],
  );

  const petRow = useMemo(
    () => [
      { id: null as string | null, name: 'None', owned: true, icon: 'close-circle-outline' },
      ...ALL_PETS.map((item) => ({
        id: item.id as string | null,
        name: item.name,
        owned: ownedPets.includes(item.id),
        icon: item.icon,
      })),
    ],
    [ownedPets],
  );

  const standRow = useMemo(
    () => [
      { id: null as string | null, name: 'None', owned: true, icon: 'close-circle-outline' },
      ...ALL_STANDS.map((item) => ({
        id: item.id as string | null,
        name: item.name,
        owned: ownedStands.includes(item.id),
        icon: item.icon,
      })),
    ],
    [ownedStands],
  );

  const goLobby = () => {
    hapticsService.impact(0);
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.LOBBY);
  };

  const handleSelectAvatar = (avatarId: string, unlocked: boolean) => {
    if (unlocked) {
      if (avatarId === selectedAvatarId) return;
      hapticsService.impact(0);
      selectAvatar(avatarId);
      return;
    }
    hapticsService.impact(0);
    router.push({ pathname: ROUTES.SHOP, params: { tab: 'cosmetics' } });
  };

  const handleSelectWing = (wingId: string | null, owned: boolean) => {
    if (owned) {
      if (wingId === equippedWing) return;
      hapticsService.impact(0);
      equipWing(wingId);
      return;
    }
    hapticsService.impact(0);
    router.push({ pathname: ROUTES.SHOP, params: { tab: 'wings' } });
  };

  const handleSelectEquipItem = (
    slot: 'pet' | 'stand',
    itemId: string | null,
    owned: boolean,
    currentlyEquipped: string | null,
    equip: (id: string | null) => void,
  ) => {
    if (owned) {
      if (itemId === currentlyEquipped) return;
      hapticsService.impact(0);
      equip(itemId);
      return;
    }
    hapticsService.impact(0);
    notify('Coming soon', `This ${slot} is reserved for a future unlock.`);
  };

  return (
    <AnimatedBackground
      backgroundImage={require('../assets/background/customization_BG.webp')}
      overlayOpacity={0.42}
    >
      <View style={[styles.header, { paddingTop: topPad }]}>
        <BackButton fallbackRoute={ROUTES.LOBBY} />
        <Text style={styles.headerTitle}>Customize</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.previewWrap}>
        <CharacterStage
          avatarId={selectedAvatarId}
          wingId={equippedWing}
          petId={equippedPet}
          standId={equippedStand}
          mode="preview"
        />
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>LVL {level}</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((entry) => (
          <TouchableOpacity
            key={entry.id}
            style={[styles.tab, tab === entry.id && styles.tabActive]}
            onPress={() => { hapticsService.impact(0); setTab(entry.id); }}
            activeOpacity={0.85}
            accessibilityLabel={`customize-tab-${entry.id}`}
          >
            <Ionicons
              name={entry.icon}
              size={14}
              color={tab === entry.id ? GameColors.backgroundPrimary : GameColors.textWhite}
            />
            <Text style={[styles.tabLabel, tab === entry.id && styles.tabLabelActive]}>{entry.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'avatars' ? (
          <View style={styles.grid}>
            {avatars.map((avatar) => {
              const equipped = avatar.id === selectedAvatarId;
              const locked = !avatar.unlocked;
              return (
                <TouchableOpacity
                  key={avatar.id}
                  activeOpacity={0.8}
                  onPress={() => handleSelectAvatar(avatar.id, avatar.unlocked)}
                  style={[
                    styles.card,
                    !locked && !equipped && styles.cardOwned,
                    equipped && styles.cardEquipped,
                    locked && styles.cardLocked,
                  ]}
                >
                  <Image
                    source={getAvatarSource(avatar.id, avatar.imageKey)}
                    resizeMode="contain"
                    style={styles.cardImage}
                  />
                  {locked && (
                    <View style={styles.lockOverlay}>
                      <Ionicons name="lock-closed" size={20} color={GameColors.textWhite} />
                    </View>
                  )}
                  <Text style={styles.cardName} numberOfLines={1}>{avatar.name}</Text>
                  {equipped && (
                    <View style={styles.equippedTag}>
                      <Text style={styles.equippedTagText}>Equipped</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : tab === 'wings' ? (
          <View style={styles.grid}>
            {wingRow.map((wing) => {
              const equipped = wing.id === equippedWing;
              const locked = !wing.owned;
              const art = getWingSource(wing.id);
              return (
                <TouchableOpacity
                  key={wing.id ?? 'none'}
                  activeOpacity={0.8}
                  onPress={() => handleSelectWing(wing.id, wing.owned)}
                  style={[
                    styles.card,
                    !locked && !equipped && styles.cardOwned,
                    equipped && styles.cardEquipped,
                    locked && styles.cardLocked,
                  ]}
                >
                  {art ? (
                    <Image source={art} resizeMode="contain" style={styles.cardImage} />
                  ) : (
                    <Ionicons
                      name={wing.id === null ? 'close-circle-outline' : 'image-outline'}
                      size={28}
                      color={GameColors.textSecondary}
                      style={styles.cardPlaceholder}
                    />
                  )}
                  {locked && (
                    <View style={styles.lockOverlay}>
                      <Ionicons name="lock-closed" size={20} color={GameColors.textWhite} />
                    </View>
                  )}
                  <Text style={styles.cardName} numberOfLines={1}>{wing.name}</Text>
                  {equipped && (
                    <View style={styles.equippedTag}>
                      <Text style={styles.equippedTagText}>Equipped</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.grid}>
            {(tab === 'pets' ? petRow : standRow).map((item) => {
              const equipped = tab === 'pets' ? item.id === equippedPet : item.id === equippedStand;
              const locked = !item.owned;
              return (
                <TouchableOpacity
                  key={item.id ?? 'none'}
                  activeOpacity={0.8}
                  onPress={() =>
                    handleSelectEquipItem(
                      tab === 'pets' ? 'pet' : 'stand',
                      item.id,
                      item.owned,
                      tab === 'pets' ? equippedPet : equippedStand,
                      tab === 'pets' ? equipPet : equipStand,
                    )
                  }
                  style={[
                    styles.card,
                    !locked && !equipped && styles.cardOwned,
                    equipped && styles.cardEquipped,
                    locked && styles.cardLocked,
                  ]}
                >
                  <Ionicons
                    name={item.icon as never}
                    size={28}
                    color={equipped ? GameColors.accentGold : GameColors.textSecondary}
                    style={styles.cardPlaceholder}
                  />
                  {locked && (
                    <View style={styles.lockOverlay}>
                      <Ionicons name="lock-closed" size={20} color={GameColors.textWhite} />
                    </View>
                  )}
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  {equipped && (
                    <View style={styles.equippedTag}>
                      <Text style={styles.equippedTagText}>Equipped</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingBottom: bottomPad, paddingTop: 8 }}>
        <GradientButton title="Back to Lobby" onPress={goLobby} />
      </View>
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
    height: '38%',
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
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 10,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: GameColors.card,
    borderWidth: 1,
    borderColor: GameColors.border,
  },
  tabActive: {
    backgroundColor: GameColors.accentGold,
    borderColor: GameColors.accentGold,
  },
  tabLabel: {
    ...Typography.semibold,
    color: GameColors.textWhite,
    fontSize: 11,
  },
  tabLabelActive: {
    color: GameColors.backgroundPrimary,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '30.5%',
    aspectRatio: 0.82,
    borderRadius: 14,
    backgroundColor: GameColors.card,
    borderWidth: 1,
    borderColor: GameColors.border,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 6,
    overflow: 'hidden',
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
    opacity: 0.7,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    top: 4,
    bottom: 22,
    width: '100%',
  },
  cardPlaceholder: {
    marginBottom: 22,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 14, 36, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    ...Typography.small,
    color: GameColors.textWhite,
    textAlign: 'center',
    zIndex: 2,
  },
  equippedTag: {
    position: 'absolute',
    top: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: GameColors.accentGold,
    zIndex: 3,
  },
  equippedTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: GameColors.backgroundPrimary,
  },
});
