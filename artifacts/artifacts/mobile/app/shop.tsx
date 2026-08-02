import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { AvatarFrame } from '@/components/AvatarFrame';
import { BackButton } from '@/components/BackButton';
import { CoinDisplay } from '@/components/CoinDisplay';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { useAdStore } from '@/store/adStore';
import { iapService, IAP_SKUS } from '@/services/IAPService';

// Maps COIN_PACKAGES id → IAP product SKU
const COIN_PACK_SKUS: Record<string, string> = {
  'coins-100':  IAP_SKUS.COINS_100,
  'coins-500':  IAP_SKUS.COINS_500,
  'coins-1200': IAP_SKUS.COINS_1200,
  'coins-2500': IAP_SKUS.COINS_2500,
  'coins-5000': IAP_SKUS.COINS_5000,
};
import { COIN_PACKAGES, DEFAULT_AVATARS, POWER_UPS } from '@/constants';
import { useAudio } from '@/hooks/useAudio';
import type { Avatar, PowerUpId } from '@/types';

const TAB_NAMES = ['Avatars', 'Power Ups', 'Coins'];
const TAB_WIDTH = (Dimensions.get('window').width - 40) / 3;
const rarityColors: Record<string, string> = {
  Common: GameColors.textSecondary,
  Rare: '#64B5F6',
  Epic: '#CE93D8',
  Legendary: GameColors.accentGold,
};

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState(0);
  const [floating, setFloating] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const indicator = useSharedValue(0);
  const coinPulse = useSharedValue(1);
  const { playEffect } = useAudio();
  const coins = useUserStore((s) => s.coins);
  const avatars = useUserStore((s) => s.avatars);
  const selectedAvatarId = useUserStore((s) => s.selectedAvatarId);
  const powerUps = useUserStore((s) => s.powerUps);
  const unlockAvatar = useUserStore((s) => s.unlockAvatar);
  const selectAvatar = useUserStore((s) => s.selectAvatar);
  const buyPowerUp = useUserStore((s) => s.buyPowerUp);
  const mockPurchaseCoins = useUserStore((s) => s.mockPurchaseCoins);

  const { isAdFreePassActive, removeAds, adFreePassExpiry } = useAdStore();
  const adFreeActive = isAdFreePassActive();

  useEffect(() => {
    indicator.value = withSpring(tab * TAB_WIDTH, { damping: 18, stiffness: 180 });
  }, [indicator, tab]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicator.value }],
  }));
  const coinStyle = useAnimatedStyle(() => ({ transform: [{ scale: coinPulse.value }] }));

  const showPurchase = (message: string) => {
    setFloating(message);
    coinPulse.value = withSequence(withSpring(1.18), withSpring(1));
    setTimeout(() => setFloating(null), 1100);
  };

  const buyAvatar = (avatar: Avatar) => {
    if (avatar.unlocked) {
      selectAvatar(avatar.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showPurchase('Equipped');
      return;
    }
    const success = unlockAvatar(avatar.id);
    Haptics.notificationAsync(
      success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );
    if (success) {
      playEffect('purchase');
      showPurchase(`-${avatar.cost} coins`);
    } else {
      Alert.alert('Not enough coins', `You need ${avatar.cost} coins to unlock ${avatar.name}.`);
    }
  };

  const buyAdFreePass = async () => {
    if (adFreeActive || purchaseLoading) return;
    setPurchaseLoading('remove_ads');
    try {
      const ok = await iapService.purchase(IAP_SKUS.REMOVE_ADS);
      if (ok) {
        removeAds(); // lifetime pass — no expiry
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        playEffect('purchase');
        showPurchase('Ad-Free activated!');
      }
    } catch (err) {
      if (__DEV__) console.warn('[Shop] remove_ads purchase error', err);
    } finally {
      setPurchaseLoading(null);
    }
  };

  const restorePurchases = async () => {
    if (purchaseLoading) return;
    setPurchaseLoading('restore');
    try {
      const restored = await iapService.restoreAdsRemoved();
      if (restored) {
        removeAds();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showPurchase('Purchases restored');
      } else {
        Alert.alert('Nothing to restore', 'No previous Ad-Free Pass purchase found for this account.');
      }
    } catch {
      Alert.alert('Restore failed', 'Could not reach the store. Please try again.');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const buyPower = (id: PowerUpId, name: string) => {
    const success = buyPowerUp(id);
    Haptics.notificationAsync(
      success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );
    if (success) {
      playEffect('purchase');
      showPurchase('Power-up added');
    } else Alert.alert('Not enough coins', 'Earn more coins by playing games or claiming rewards.');
  };

  const topPad = Platform.OS === 'web' ? 62 : insets.top + 12;
  const bottomPad = Platform.OS === 'web' ? 28 : insets.bottom + 24;

  return (
    <AnimatedBackground>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title}>Shop</Text>
          <Animated.View style={coinStyle}>
            <CoinDisplay amount={coins} size="small" animate />
          </Animated.View>
        </View>
        <View style={styles.tabs}>
          {TAB_NAMES.map((name, index) => (
            <TouchableOpacity key={name} style={styles.tab} onPress={() => setTab(index)}>
              <Ionicons
                name={index === 0 ? 'people-outline' : index === 1 ? 'flash-outline' : 'cash-outline'}
                size={18}
                color={tab === index ? GameColors.accentGold : GameColors.textSecondary}
              />
              <Text style={[styles.tabText, tab === index && styles.tabTextActive]}>{name}</Text>
            </TouchableOpacity>
          ))}
          <Animated.View style={[styles.indicator, indicatorStyle]} />
        </View>

        {floating && <Text style={styles.floating}>{floating}</Text>}

        {tab === 0 && (
          <View style={styles.grid}>
            {DEFAULT_AVATARS.map((catalogAvatar) => {
              const avatar = avatars.find((item) => item.id === catalogAvatar.id) ?? catalogAvatar;
              const equipped = selectedAvatarId === avatar.id;
              const color = rarityColors[avatar.rarity ?? 'Common'];
              return (
                <View key={avatar.id} style={[styles.avatarCard, equipped && styles.equippedCard]}>
                  <View style={[styles.avatarImage, { borderColor: color }]}>
                    <AvatarFrame imageKey={avatar.imageKey} size={70} locked={!avatar.unlocked} />
                  </View>
                  <Text style={styles.avatarName} numberOfLines={1}>{avatar.name}</Text>
                  <Text style={[styles.rarity, { color }]}>{avatar.rarity}</Text>
                  <Text style={styles.ability} numberOfLines={2}>{avatar.ability}</Text>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      equipped && styles.equippedButton,
                      !avatar.unlocked && coins < avatar.cost && styles.disabledButton,
                    ]}
                    onPress={() => buyAvatar(avatar)}
                    disabled={!avatar.unlocked && coins < avatar.cost}
                  >
                    {equipped ? <Ionicons name="checkmark" size={16} color={GameColors.backgroundPrimary} /> : null}
                    <Text style={styles.actionText}>
                      {equipped ? 'Equipped' : avatar.unlocked ? 'Equip' : `${avatar.cost} coins`}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {tab === 1 && (
          <View style={styles.list}>
            {POWER_UPS.map((item) => (
              <View key={item.id} style={styles.powerCard}>
                <View style={styles.powerIcon}><Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={26} color={GameColors.accentGold} /></View>
                <View style={styles.powerCopy}>
                  <Text style={styles.powerName}>{item.name}</Text>
                  <Text style={styles.powerDesc}>{item.description}</Text>
                  <Text style={styles.inventory}>Owned: {powerUps[item.id]}</Text>
                </View>
                <TouchableOpacity style={styles.buySmall} onPress={() => buyPower(item.id, item.name)}>
                  <Text style={styles.buySmallText}>{item.cost}</Text>
                  <Ionicons name="logo-bitcoin" size={14} color={GameColors.backgroundPrimary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {tab === 2 && (
          <View style={styles.list}>
            <Text style={styles.sectionHint}>
              {iapService.isMockMode ? 'Mock purchase · no payment processed' : 'Real purchase via App Store / Play Store'}
            </Text>

            {/* ── Ad-Free Pass card ──────────────────────────────────────── */}
            <View style={[styles.adFreeCard, adFreeActive && styles.adFreeCardActive]}>
              <View style={styles.adFreeLeft}>
                <View style={styles.adFreeIconWrap}>
                  <Ionicons
                    name={adFreeActive ? 'shield-checkmark' : 'shield-outline'}
                    size={28}
                    color={adFreeActive ? GameColors.accentGold : '#CE93D8'}
                  />
                </View>
                <View style={styles.adFreeCopy}>
                  <Text style={styles.adFreeTitle}>Ad-Free Pass</Text>
                  <Text style={styles.adFreeDesc}>
                    {adFreeActive
                      ? adFreePassExpiry
                        ? `Active · expires ${new Date(adFreePassExpiry).toLocaleDateString()}`
                        : 'Active · Lifetime'
                      : 'Enjoy all rewards without watching ads'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.adFreeBtn,
                  adFreeActive && styles.adFreeBtnOwned,
                  purchaseLoading === 'remove_ads' && { opacity: 0.6 },
                ]}
                onPress={buyAdFreePass}
                disabled={adFreeActive || purchaseLoading === 'remove_ads'}
              >
                <Text style={[styles.adFreeBtnText, adFreeActive && styles.adFreeBtnTextOwned]}>
                  {purchaseLoading === 'remove_ads' ? '…' : adFreeActive ? 'Owned ✓' : '$2.99'}
                </Text>
              </TouchableOpacity>
            </View>

            {COIN_PACKAGES.map((pack, index) => (
              <TouchableOpacity
                key={pack.id}
                style={[styles.coinCard, index === 2 && styles.popularCard, purchaseLoading === pack.id && { opacity: 0.6 }]}
                disabled={!!purchaseLoading}
                onPress={async () => {
                  setPurchaseLoading(pack.id);
                  try {
                    const ok = await iapService.purchase(COIN_PACK_SKUS[pack.id] ?? pack.id);
                    if (ok) {
                      mockPurchaseCoins(pack.amount);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      playEffect('coin');
                      showPurchase(`+${pack.amount} coins`);
                    }
                  } catch (err) {
                    if (__DEV__) console.warn('[Shop] purchase error', err);
                  } finally {
                    setPurchaseLoading(null);
                  }
                }}
              >
                <View style={styles.coinPackIcon}><Ionicons name="logo-bitcoin" size={25} color={GameColors.accentGold} /></View>
                <Text style={styles.coinAmount}>{pack.amount.toLocaleString()} Coins</Text>
                <Text style={styles.coinPrice}>{pack.price}</Text>
                {index === 2 && <Text style={styles.popularLabel}>BEST VALUE</Text>}
              </TouchableOpacity>
            ))}

            {/* ── Restore purchases ──────────────────────────────────────── */}
            <TouchableOpacity
              style={[styles.restoreBtn, purchaseLoading === 'restore' && { opacity: 0.6 }]}
              onPress={restorePurchases}
              disabled={!!purchaseLoading}
            >
              <Ionicons name="refresh-outline" size={14} color={GameColors.textSecondary} />
              <Text style={styles.restoreText}>
                {purchaseLoading === 'restore' ? 'Restoring…' : 'Restore Purchases'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, minHeight: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title: { ...Typography.header, color: GameColors.textWhite, fontSize: 28 },
  tabs: { height: 54, flexDirection: 'row', position: 'relative', borderBottomWidth: 1, borderBottomColor: GameColors.border, marginBottom: 20 },
  tab: { width: TAB_WIDTH, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  tabText: { ...Typography.small, color: GameColors.textSecondary, fontFamily: 'Inter_600SemiBold' },
  tabTextActive: { color: GameColors.accentGold },
  indicator: { position: 'absolute', bottom: -2, left: 0, width: TAB_WIDTH, height: 3, borderRadius: 2, backgroundColor: GameColors.accentGold },
  floating: { position: 'absolute', top: 122, alignSelf: 'center', zIndex: 4, color: GameColors.accentGreen, fontFamily: 'Inter_700Bold', fontSize: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  avatarCard: { width: '48%', backgroundColor: 'rgba(255,255,255,0.055)', borderRadius: 18, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: GameColors.border },
  equippedCard: { borderColor: GameColors.accentGold, backgroundColor: 'rgba(255,215,0,0.09)' },
  avatarImage: { borderWidth: 2, borderRadius: 50, padding: 2, marginBottom: 8 },
  avatarName: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 15 },
  rarity: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 2 },
  ability: { color: GameColors.textSecondary, fontSize: 11, textAlign: 'center', minHeight: 32, marginVertical: 8 },
  actionButton: { minHeight: 34, width: '100%', borderRadius: 10, backgroundColor: GameColors.accentGold, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 },
  equippedButton: { backgroundColor: GameColors.accentGreen },
  disabledButton: { opacity: 0.35 },
  actionText: { color: GameColors.backgroundPrimary, fontFamily: 'Inter_700Bold', fontSize: 11 },
  list: { gap: 12 },
  sectionHint: { color: GameColors.textSecondary, textAlign: 'center', fontSize: 12, marginBottom: 4 },
  powerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: GameColors.border },
  powerIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,215,0,0.12)', alignItems: 'center', justifyContent: 'center' },
  powerCopy: { flex: 1, gap: 3 },
  powerName: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 16 },
  powerDesc: { color: GameColors.textSecondary, fontSize: 12 },
  inventory: { color: GameColors.accentGreen, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  buySmall: { minWidth: 70, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, backgroundColor: GameColors.accentGold, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 3 },
  buySmallText: { color: GameColors.backgroundPrimary, fontFamily: 'Inter_700Bold' },
  coinCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 15, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: GameColors.border },
  popularCard: { borderColor: GameColors.accentGold },
  coinPackIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,215,0,0.12)', alignItems: 'center', justifyContent: 'center' },
  coinAmount: { flex: 1, color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 17 },
  coinPrice: { color: GameColors.accentGold, fontFamily: 'Inter_700Bold', fontSize: 16 },
  popularLabel: { position: 'absolute', top: -9, right: 14, color: GameColors.backgroundPrimary, backgroundColor: GameColors.accentGold, fontFamily: 'Inter_700Bold', fontSize: 9, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },

  // ── Ad-Free Pass ────────────────────────────────────────────────────────
  adFreeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    padding: 16,
    backgroundColor: 'rgba(206,147,216,0.08)',
    borderWidth: 1.5,
    borderColor: '#CE93D8',
    gap: 12,
  },
  adFreeCardActive: {
    backgroundColor: 'rgba(255,215,0,0.07)',
    borderColor: GameColors.accentGold,
  },
  adFreeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  adFreeIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adFreeCopy: { flex: 1, gap: 3 },
  adFreeTitle: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 16 },
  adFreeDesc: { color: GameColors.textSecondary, fontSize: 12, fontFamily: 'Inter_500Medium' },
  adFreeBtn: {
    minWidth: 72,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#CE93D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adFreeBtnOwned: { backgroundColor: 'rgba(255,215,0,0.18)', borderWidth: 1, borderColor: GameColors.accentGold },
  adFreeBtnText: { color: GameColors.backgroundPrimary, fontFamily: 'Inter_700Bold', fontSize: 14 },
  adFreeBtnTextOwned: { color: GameColors.accentGold },

  // ── Restore purchases ───────────────────────────────────────────────────
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  restoreText: { color: GameColors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 13 },
});