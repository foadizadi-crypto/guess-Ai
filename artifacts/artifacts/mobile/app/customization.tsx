/**
 * Character customization — live preview plus Avatars / Wings catalogs.
 *
 * Preview uses the same auto-sizing compositor as the lobby: wings attach
 * to the detected center of the avatar's back for any asset pair.
 */
import React, { useMemo, useState } from 'react';
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
import { router } from 'expo-router';

import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { CharacterStage } from '@/components/CharacterStage';
import { GradientButton } from '@/components/GradientButton';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { ALL_WINGS } from '@/constants/wings';
import { getAvatarSource, getWingSource } from '@/constants/characterSources';
import { ROUTES } from '@/navigation/routes';
import {
  STAMINA_UPGRADE_LEVELS,
  MAX_STAMINA_UPGRADE_LEVEL,
  FIRST_UPGRADE_OFFER_HOURS,
  getUpgradeGemCost,
  isFirstUpgradeOfferActive,
} from '@/constants/economy';

type CatalogTab = 'avatars' | 'wings' | 'upgrade';

export default function CustomizationScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<CatalogTab>('avatars');

  const avatars = useUserStore((s) => s.avatars);
  const selectedAvatarId = useUserStore((s) => s.selectedAvatarId);
  const selectAvatar = useUserStore((s) => s.selectAvatar);
  const ownedWings = useUserStore((s) => s.ownedWings);
  const equippedWing = useUserStore((s) => s.equippedWing);
  const equipWing = useUserStore((s) => s.equipWing);
  const level = useUserStore((s) => s.level);
  const gems = useUserStore((s) => s.gems ?? 0);
  const staminaSourceLevel = useUserStore((s) => s.staminaSourceLevel ?? 0);
  const accountCreatedAt = useUserStore((s) => s.accountCreatedAt);
  const upgradeStaminaSource = useUserStore((s) => s.upgradeStaminaSource);

  const topPad = Platform.OS === 'web' ? 20 : insets.top + 6;
  const bottomPad = Platform.OS === 'web' ? 20 : insets.bottom + 16;

  const wingRow = useMemo(
    () => [
      { id: null as string | null, name: 'None', owned: true },
      ...ALL_WINGS.map((w) => ({
        id: w.id as string | null,
        name: w.name,
        owned: ownedWings.includes(w.id),
      })),
    ],
    [ownedWings],
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

  const nextUpgrade =
    staminaSourceLevel < MAX_STAMINA_UPGRADE_LEVEL
      ? STAMINA_UPGRADE_LEVELS[staminaSourceLevel + 1]
      : null;

  const offerActive = isFirstUpgradeOfferActive(accountCreatedAt, staminaSourceLevel);
  const nextUpgradeCost = nextUpgrade
    ? getUpgradeGemCost(nextUpgrade.level, accountCreatedAt, staminaSourceLevel)
    : 0;

  const handleUpgrade = () => {
    if (!nextUpgrade) return;
    hapticsService.impact(0);
    const ok = upgradeStaminaSource();
    if (!ok) {
      Alert.alert(
        'Not enough gems',
        `Upgrading to Level ${nextUpgrade.level} costs ${nextUpgradeCost} gems. You have ${gems}.`,
      );
      return;
    }
    hapticsService.notification(1);
    Alert.alert(
      'Source upgraded!',
      `Stamina source is now Level ${nextUpgrade.level}: cap ${nextUpgrade.cap}, +1 stamina every ${nextUpgrade.refillIntervalMin} minutes.`,
    );
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
          mode="preview"
        />
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>LVL {level}</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'avatars' && styles.tabActive]}
          onPress={() => { hapticsService.impact(0); setTab('avatars'); }}
          activeOpacity={0.85}
        >
          <Ionicons
            name="person"
            size={16}
            color={tab === 'avatars' ? GameColors.backgroundPrimary : GameColors.textWhite}
          />
          <Text style={[styles.tabLabel, tab === 'avatars' && styles.tabLabelActive]}>Avatars</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'wings' && styles.tabActive]}
          onPress={() => { hapticsService.impact(0); setTab('wings'); }}
          activeOpacity={0.85}
        >
          <Ionicons
            name="sparkles"
            size={16}
            color={tab === 'wings' ? GameColors.backgroundPrimary : GameColors.textWhite}
          />
          <Text style={[styles.tabLabel, tab === 'wings' && styles.tabLabelActive]}>Wings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'upgrade' && styles.tabActive]}
          onPress={() => { hapticsService.impact(0); setTab('upgrade'); }}
          activeOpacity={0.85}
        >
          <Ionicons
            name="trending-up"
            size={16}
            color={tab === 'upgrade' ? GameColors.backgroundPrimary : GameColors.textWhite}
          />
          <Text style={[styles.tabLabel, tab === 'upgrade' && styles.tabLabelActive]}>Upgrade</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'upgrade' ? (
          <View style={styles.upgradePanel}>
            <View style={styles.upgradeHeader}>
              <View>
                <Text style={styles.upgradeTitle}>Stamina Source</Text>
                <Text style={styles.upgradeSubtitle}>
                  Level {staminaSourceLevel} of {MAX_STAMINA_UPGRADE_LEVEL}
                </Text>
              </View>
              <View style={styles.gemPill}>
                <Ionicons name="diamond" size={14} color="#CE93D8" />
                <Text style={styles.gemPillText}>{gems}</Text>
              </View>
            </View>

            {offerActive && (
              <View style={styles.offerBanner}>
                <Ionicons name="flame" size={14} color="#FF7043" />
                <Text style={styles.offerText}>
                  Launch offer: first upgrade half price for {FIRST_UPGRADE_OFFER_HOURS}h!
                </Text>
              </View>
            )}

            {STAMINA_UPGRADE_LEVELS.map((lvl) => {
              const owned = staminaSourceLevel >= lvl.level;
              const isNext = lvl.level === staminaSourceLevel + 1;
              const perDay = Math.floor((24 * 60) / lvl.refillIntervalMin);
              const discounted = isNext && nextUpgradeCost < lvl.gemCost;
              return (
                <View
                  key={lvl.level}
                  style={[
                    styles.upgradeRow,
                    owned && styles.upgradeRowOwned,
                    isNext && styles.upgradeRowNext,
                  ]}
                >
                  <View style={styles.upgradeRowInfo}>
                    <Text style={styles.upgradeRowTitle}>
                      {lvl.level === 0 ? 'Base Source' : `Level ${lvl.level}`}
                    </Text>
                    <Text style={styles.upgradeRowDetail}>
                      Cap {lvl.cap} · +1 every {lvl.refillIntervalMin} min · {perDay}/day
                    </Text>
                  </View>
                  {owned ? (
                    <Ionicons name="checkmark-circle" size={22} color={GameColors.accentGreen} />
                  ) : isNext ? (
                    <View style={styles.upgradePrice}>
                      <Ionicons name="diamond" size={12} color="#CE93D8" />
                      {discounted && (
                        <Text style={styles.upgradePriceStrike}>{lvl.gemCost}</Text>
                      )}
                      <Text style={styles.upgradePriceText}>{nextUpgradeCost}</Text>
                    </View>
                  ) : (
                    <Ionicons name="lock-closed" size={16} color={GameColors.textSecondary} />
                  )}
                </View>
              );
            })}

            {nextUpgrade ? (
              <GradientButton
                title={`Upgrade to Level ${nextUpgrade.level} — ${nextUpgradeCost} Gems`}
                onPress={handleUpgrade}
              />
            ) : (
              <View style={styles.maxedBanner}>
                <Ionicons name="trophy" size={16} color={GameColors.accentGold} />
                <Text style={styles.maxedText}>Fully upgraded — maximum source power!</Text>
              </View>
            )}
          </View>
        ) : tab === 'avatars' ? (
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
        ) : (
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
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
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
    fontSize: 14,
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
  upgradePanel: {
    gap: 10,
    paddingBottom: 4,
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  upgradeTitle: {
    ...Typography.semibold,
    fontSize: 18,
    color: GameColors.textWhite,
  },
  upgradeSubtitle: {
    ...Typography.small,
    color: GameColors.textSecondary,
  },
  gemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(206,147,216,0.15)',
  },
  gemPillText: {
    ...Typography.small,
    color: '#CE93D8',
  },
  upgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    backgroundColor: GameColors.card,
    borderWidth: 1,
    borderColor: GameColors.border,
  },
  upgradeRowOwned: {
    borderColor: 'rgba(76,175,80,0.45)',
  },
  upgradeRowNext: {
    borderColor: GameColors.accentGold,
    backgroundColor: 'rgba(255,215,0,0.06)',
  },
  upgradeRowInfo: {
    gap: 2,
    flexShrink: 1,
  },
  upgradeRowTitle: {
    ...Typography.semibold,
    fontSize: 14,
    color: GameColors.textWhite,
  },
  upgradeRowDetail: {
    ...Typography.small,
    color: GameColors.textSecondary,
  },
  upgradePrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(206,147,216,0.18)',
  },
  upgradePriceText: {
    ...Typography.semibold,
    fontSize: 13,
    color: '#CE93D8',
  },
  upgradePriceStrike: {
    ...Typography.small,
    fontSize: 11,
    color: GameColors.textSecondary,
    textDecorationLine: 'line-through',
  },
  offerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,112,67,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,112,67,0.5)',
  },
  offerText: {
    ...Typography.small,
    color: '#FFAB91',
    flexShrink: 1,
  },
  maxedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderWidth: 1,
    borderColor: GameColors.accentGold,
  },
  maxedText: {
    ...Typography.small,
    color: GameColors.accentGold,
  },
});
