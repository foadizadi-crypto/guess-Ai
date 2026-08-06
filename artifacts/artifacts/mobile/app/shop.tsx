/**
 * shop.tsx — Phase 1 Economy + Shop Core
 *
 * Two primary tabs driven entirely by shopConfig (no hardcoded item data):
 *   • Coin Shop  — consumables, power-ups (bought with coins)
 *   • Gem Shop   — premium cosmetics (bought with gems)
 *
 * Avatars are NOT sold here — they unlock via level milestones and achievements.
 * Each tab has a scrollable filter bar: All / Owned / Locked / Rare / Epic / Legendary
 * Item cards display: icon, name, description, rarity badge, price, action button.
 *
 * Spec: Phase 1 §3–§6
 */
import React, { useState, useMemo, useCallback } from 'react';
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

// ─── Shop item PNG images ──────────────────────────────────────────────────────
const SHOP_IMAGES: Record<string, ReturnType<typeof require>> = {
  time_boost:    require('@/assets/shop/time_boost.png'),
  combo_shield:  require('@/assets/shop/combo_shield.png'),
  clarity_bomb:  require('@/assets/shop/clarity_bomb.png'),
  error_nullifier: require('@/assets/shop/error_nullifier.png'),
  multiplier_2x: require('@/assets/shop/x2_multiplier.png'),
  rare_sticker:  require('@/assets/shop/rare_sticker.png'),
};
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { CoinDisplay } from '@/components/CoinDisplay';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { useAdStore } from '@/store/adStore';
import { iapService, IAP_SKUS } from '@/services/IAPService';
import { savePurchaseHistory } from '@/services/firestoreService';
import { getPlayerId } from '@/services/authService';
import { useAudio } from '@/hooks/useAudio';
import { COIN_PACKAGES } from '@/constants';
import {
  ALL_COIN_SHOP_ITEMS,
  GEM_SHOP_ITEMS,
  GEM_PACKS,
  RARITY_COLORS,
} from '@/constants/shopConfig';
import { IAP_GEM_PACKS } from '@/constants/economy';
import type { UnifiedShopItem } from '@/types';
import type { ConsumableId } from '@/constants/shopData';
import type { PowerUpId } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS    = ['Coin Shop', 'Gem Shop'] as const;
const FILTERS = ['All', 'Owned', 'Locked', 'Rare', 'Epic', 'Legendary'] as const;
type FilterKey = typeof FILTERS[number];

const POWER_UP_IDS = new Set(['hint', 'reveal-blur', 'skip-question', 'double-xp']);

const COIN_PACK_SKUS: Record<string, string> = {
  'coins-100':  IAP_SKUS.COINS_100,
  'coins-500':  IAP_SKUS.COINS_500,
  'coins-1200': IAP_SKUS.COINS_1200,
  'coins-2500': IAP_SKUS.COINS_2500,
  'coins-5000': IAP_SKUS.COINS_5000,
};

// ─── Types ────────────────────────────────────────────────────────────────────

type RuntimeItem = UnifiedShopItem & { quantity?: number };

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ShopScreen() {
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === 'web' ? 62 : insets.top + 12;
  const bottomPad = Platform.OS === 'web' ? 28 : insets.bottom + 24;
  const { playEffect } = useAudio();

  const [tab,      setTab]      = useState(0);
  const [filter,   setFilter]   = useState<FilterKey>('All');
  const [floating, setFloating] = useState<string | null>(null);
  const [loading,  setLoading]  = useState<string | null>(null);

  // ── Store ────────────────────────────────────────────────────────────────
  const coins           = useUserStore((s) => s.coins);
  const gems            = useUserStore((s) => s.gems);
  const consumables     = useUserStore((s) => s.consumables);
  const powerUps        = useUserStore((s) => s.powerUps);
  const gemCosmetics    = useUserStore((s) => s.gemCosmetics);
  const buyConsumable   = useUserStore((s) => s.buyConsumable);
  const buyPowerUp      = useUserStore((s) => s.buyPowerUp);
  const buyGemCosmetic  = useUserStore((s) => s.buyGemCosmetic);
  const equipGemCosmetic = useUserStore((s) => s.equipGemCosmetic);
  const mockPurchaseCoins = useUserStore((s) => s.mockPurchaseCoins);
  const addGems           = useUserStore((s) => s.addGems);

  const buyGemPack    = useUserStore((s) => s.buyGemPack);

  const { isAdFreePassActive, removeAds, adFreePassExpiry } = useAdStore();
  const adFreeActive = isAdFreePassActive();

  // Animated coin pulse on purchase
  const coinPulse = useSharedValue(1);
  const coinStyle = useAnimatedStyle(() => ({ transform: [{ scale: coinPulse.value }] }));

  const showPurchase = useCallback((msg: string) => {
    setFloating(msg);
    coinPulse.value = withSequence(withSpring(1.18), withSpring(1));
    setTimeout(() => setFloating(null), 1200);
  }, [coinPulse]);

  const handleBuyGemPack = useCallback((packId: string, packName: string, gemCost: number) => {
    if (gems < gemCost) {
      Alert.alert('Not enough gems', `You need ${gemCost} 💎 to buy ${packName}. Get more gems below.`);
      return;
    }
    Alert.alert(
      `Buy ${packName}?`,
      `This will spend ${gemCost} 💎 from your balance.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: () => {
            const ok = buyGemPack(packId);
            if (ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); playEffect('purchase'); showPurchase(`${packName} unlocked!`); }
            else Alert.alert('Purchase failed', 'Something went wrong. Please try again.');
          },
        },
      ],
    );
  }, [gems, buyGemPack, playEffect, showPurchase]);

  // ── Ownership / quantity helpers ─────────────────────────────────────────

  const getRuntime = useCallback((item: UnifiedShopItem): RuntimeItem => {
    // Consumable (spec items)
    if (item.id in consumables) {
      const qty = consumables[item.id as ConsumableId];
      return { ...item, owned: qty > 0, equipped: false, quantity: qty };
    }
    // Power-up
    if (POWER_UP_IDS.has(item.id)) {
      const qty = powerUps[item.id as PowerUpId] ?? 0;
      return { ...item, owned: qty > 0, equipped: false, quantity: qty };
    }
    // Gem cosmetic
    const gem = gemCosmetics[item.id];
    return { ...item, owned: gem?.owned ?? false, equipped: gem?.equipped ?? false };
  }, [consumables, powerUps, gemCosmetics]);

  // ── Filtered items for current tab ───────────────────────────────────────

  const displayItems = useMemo<RuntimeItem[]>(() => {
    const base  = (tab === 0 ? ALL_COIN_SHOP_ITEMS : GEM_SHOP_ITEMS).map(getRuntime);
    const key   = filter.toLowerCase();
    if (key === 'all')    return base;
    if (key === 'owned')  return base.filter((i) => i.owned);
    if (key === 'locked') return base.filter((i) => !i.owned);
    return base.filter((i) => i.rarity === key); // rare / epic / legendary
  }, [tab, filter, getRuntime]);

  // ── Purchase handlers ────────────────────────────────────────────────────

  const handlePress = useCallback((item: RuntimeItem) => {
    const isGem    = item.currencyType === 'gems';
    const isPowerUp = POWER_UP_IDS.has(item.id);

    // ── Gem cosmetic: equip if owned ────────────────────────────────────
    if (isGem && item.owned) {
      equipGemCosmetic(item.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showPurchase(item.equipped ? 'Unequipped' : 'Equipped!');
      return;
    }
    // ── Gem cosmetic: purchase ──────────────────────────────────────────
    if (isGem) {
      const ok = buyGemCosmetic(item.id);
      Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
      if (ok) { playEffect('purchase'); showPurchase(`−${item.price} 💎`); }
      else Alert.alert('Not enough gems', `You need ${item.price} gems to unlock ${item.name}.`);
      return;
    }
    // ── Power-up ────────────────────────────────────────────────────────
    if (isPowerUp) {
      const ok = buyPowerUp(item.id as PowerUpId);
      Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
      if (ok) { playEffect('purchase'); showPurchase(`−${item.price} 🪙`); }
      else Alert.alert('Not enough coins', 'Earn more coins by playing games or claiming daily rewards.');
      return;
    }
    // ── Consumable ──────────────────────────────────────────────────────
    const ok = buyConsumable(item.id as ConsumableId);
    Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
    if (ok) { playEffect('purchase'); showPurchase(`−${item.price} 🪙`); }
    else Alert.alert('Not enough coins', 'Earn more coins by playing games or claiming daily rewards.');
  }, [buyGemCosmetic, equipGemCosmetic, buyPowerUp, buyConsumable, playEffect, showPurchase]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <AnimatedBackground>
      {/* Purchase confirmation toast */}
      {floating ? <Text style={styles.floating}>{floating}</Text> : null}

      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title}>Shop</Text>
          <View style={styles.currencyRow}>
            <Animated.View style={coinStyle}>
              <CoinDisplay amount={coins} size="small" animate />
            </Animated.View>
            <View style={styles.gemPill}>
              <Ionicons name="diamond-outline" size={13} color="#CE93D8" />
              <Text style={styles.gemText}>{gems}</Text>
            </View>
          </View>
        </View>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <View style={styles.tabs}>
          {TABS.map((name, i) => (
            <TouchableOpacity
              key={name}
              style={[styles.tabBtn, tab === i && styles.tabBtnActive]}
              onPress={() => { setTab(i); setFilter('All'); }}
            >
              <Ionicons
                name={i === 0 ? 'cash-outline' : 'diamond-outline'}
                size={15}
                color={tab === i ? GameColors.backgroundPrimary : GameColors.textSecondary}
              />
              <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Filter bar ──────────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterBar}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, filter === f && styles.chipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Gem Packs — spendable bundles (Gem Shop tab only) ──────────── */}
        {tab === 1 && (
          <View style={styles.gemPacksSection}>
            <View style={styles.iapDivider}>
              <View style={styles.iapLine} />
              <Text style={styles.iapLabel}>Gem Packs</Text>
              <View style={styles.iapLine} />
            </View>
            {GEM_PACKS.map((pack) => {
              const rarityColor = RARITY_COLORS[pack.rarity] ?? GameColors.textSecondary;
              const canAfford = gems >= pack.gemCost;
              return (
                <TouchableOpacity
                  key={pack.id}
                  style={[styles.gemPackCard, { borderColor: `${rarityColor}55` }]}
                  onPress={() => handleBuyGemPack(pack.id, pack.name, pack.gemCost)}
                  activeOpacity={0.8}
                >
                  {/* Left icon */}
                  <View style={[styles.gemPackIcon, { backgroundColor: `${rarityColor}20` }]}>
                    <Ionicons name={pack.icon as any} size={22} color={rarityColor} />
                  </View>
                  {/* Info */}
                  <View style={styles.gemPackInfo}>
                    <View style={styles.gemPackTitleRow}>
                      <Text style={styles.gemPackName}>{pack.name}</Text>
                      <View style={[styles.rarityChip, { backgroundColor: `${rarityColor}25` }]}>
                        <Text style={[styles.rarityChipText, { color: rarityColor }]}>
                          {pack.rarity.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.gemPackDesc}>{pack.description}</Text>
                    <Text style={styles.gemPackRewards}>
                      ⚡ {pack.stamina.toLocaleString()} stamina · 🪙 {pack.coins.toLocaleString()} coins
                      {pack.cosmeticIds.length > 0 ? ` · ✨ ${pack.cosmeticIds.length} cosmetic${pack.cosmeticIds.length > 1 ? 's' : ''}` : ''}
                    </Text>
                  </View>
                  {/* Price */}
                  <View style={[styles.gemPackPrice, !canAfford && styles.gemPackPriceInsufficient]}>
                    <Ionicons name="diamond" size={11} color={canAfford ? '#CE93D8' : GameColors.textSecondary} />
                    <Text style={[styles.gemPackPriceText, !canAfford && { color: GameColors.textSecondary }]}>
                      {pack.gemCost}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Premium Cosmetics grid (Gem Shop) / Coin items grid ─────────── */}
        {tab === 1 && (
          <View style={styles.iapDivider}>
            <View style={styles.iapLine} />
            <Text style={styles.iapLabel}>Premium Cosmetics</Text>
            <View style={styles.iapLine} />
          </View>
        )}

        {/* ── Item grid ───────────────────────────────────────────────────── */}
        {displayItems.length > 0 ? (
          <View style={styles.grid}>
            {displayItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                balance={item.currencyType === 'coins' ? coins : gems}
                onPress={() => handlePress(item)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <Ionicons name="search-outline" size={40} color={GameColors.textSecondary} />
            <Text style={styles.emptyText}>No items match this filter</Text>
          </View>
        )}

        {/* ── Buy More Coins (Coin Shop only) ─────────────────────────────── */}
        {tab === 0 && (
          <View style={styles.iapSection}>
            <View style={styles.iapDivider}>
              <View style={styles.iapLine} />
              <Text style={styles.iapLabel}>Buy More Coins</Text>
              <View style={styles.iapLine} />
            </View>
            <Text style={styles.iapHint}>
              {iapService.isMockMode
                ? 'Mock purchase · no payment processed'
                : 'Real purchase via App Store / Play Store'}
            </Text>

            {/* Ad-Free Pass */}
            <TouchableOpacity
              style={[styles.iapCard, adFreeActive && styles.iapCardOwned, loading === 'remove_ads' && styles.iapCardLoading]}
              onPress={async () => {
                if (adFreeActive || loading) return;
                setLoading('remove_ads');
                try {
                  const { success, transactionId } = await iapService.purchase(IAP_SKUS.REMOVE_ADS);
                  if (success) {
                    removeAds(); playEffect('purchase'); showPurchase('Ad-Free activated!');
                    if (transactionId) { const uid = getPlayerId(); if (uid) savePurchaseHistory(uid, { transactionId, productId: IAP_SKUS.REMOVE_ADS, date: new Date().toISOString(), status: 'completed' }); }
                  }
                } catch { /* silent */ } finally { setLoading(null); }
              }}
              disabled={adFreeActive || loading === 'remove_ads'}
            >
              <View style={styles.iapIcon}>
                <Ionicons
                  name={adFreeActive ? 'shield-checkmark' : 'shield-outline'}
                  size={24}
                  color={adFreeActive ? GameColors.accentGold : '#CE93D8'}
                />
              </View>
              <View style={styles.iapCopy}>
                <Text style={styles.iapName}>Ad-Free Pass</Text>
                <Text style={styles.iapDesc} numberOfLines={1}>
                  {adFreeActive
                    ? adFreePassExpiry
                      ? `Active · expires ${new Date(adFreePassExpiry).toLocaleDateString()}`
                      : 'Active · Lifetime'
                    : 'All rewards without watching ads'}
                </Text>
              </View>
              <Text style={[styles.iapPrice, adFreeActive && { color: GameColors.accentGold }]}>
                {loading === 'remove_ads' ? '…' : adFreeActive ? '✓' : '$2.99'}
              </Text>
            </TouchableOpacity>

            {/* Coin packs */}
            {COIN_PACKAGES.map((pack, idx) => (
              <TouchableOpacity
                key={pack.id}
                style={[styles.iapCard, idx === 2 && styles.iapCardPopular, loading === pack.id && styles.iapCardLoading]}
                disabled={!!loading}
                onPress={async () => {
                  setLoading(pack.id);
                  try {
                    const sku = COIN_PACK_SKUS[pack.id] ?? pack.id;
                    const { success: ok, transactionId: txId } = await iapService.purchase(sku);
                    if (ok) {
                      mockPurchaseCoins(pack.amount); playEffect('coin'); showPurchase(`+${pack.amount} 🪙`);
                      if (txId) { const uid = getPlayerId(); if (uid) savePurchaseHistory(uid, { transactionId: txId, productId: sku, date: new Date().toISOString(), status: 'completed', coinsGranted: pack.amount }); }
                    }
                  } catch { /* silent */ } finally { setLoading(null); }
                }}
              >
                <View style={styles.iapIcon}>
                  <Ionicons name="logo-bitcoin" size={24} color={GameColors.accentGold} />
                </View>
                <View style={styles.iapCopy}>
                  <Text style={styles.iapName}>{pack.amount.toLocaleString()} Coins</Text>
                  {idx === 2 && <Text style={styles.bestValue}>BEST VALUE</Text>}
                </View>
                <Text style={styles.iapPrice}>{pack.price}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.restoreBtn, loading === 'restore' && { opacity: 0.6 }]}
              onPress={async () => {
                if (loading) return;
                setLoading('restore');
                try {
                  const ok = await iapService.restoreAdsRemoved();
                  if (ok) { removeAds(); showPurchase('Purchases restored'); }
                  else Alert.alert('Nothing to restore', 'No previous Ad-Free Pass purchase found.');
                } catch { Alert.alert('Restore failed', 'Could not reach the store. Please try again.'); }
                finally { setLoading(null); }
              }}
              disabled={!!loading}
            >
              <Ionicons name="refresh-outline" size={14} color={GameColors.textSecondary} />
              <Text style={styles.restoreText}>
                {loading === 'restore' ? 'Restoring…' : 'Restore Purchases'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Get Gems (Gem Shop only) ─────────────────────────────────────── */}
        {tab === 1 && (
          <View style={styles.iapSection}>
            <View style={styles.iapDivider}>
              <View style={styles.iapLine} />
              <Text style={styles.iapLabel}>Get Gems</Text>
              <View style={styles.iapLine} />
            </View>
            <Text style={styles.iapHint}>
              {iapService.isMockMode ? 'Mock purchase · no payment processed' : 'Real purchase via App Store / Play Store'}
            </Text>

            {/* Gem packs — 5 tiers */}
            {IAP_GEM_PACKS.map((pack, idx) => (
              <TouchableOpacity
                key={pack.id}
                style={[
                  styles.iapCard,
                  idx === 2 && styles.iapCardPopular,
                  loading === pack.sku && styles.iapCardLoading,
                ]}
                disabled={!!loading}
                onPress={async () => {
                  setLoading(pack.sku);
                  try {
                    const { success, transactionId } = await iapService.purchase(pack.sku);
                    if (success) {
                      addGems(pack.amount); playEffect('purchase'); showPurchase(`+${pack.amount} 💎`);
                      if (transactionId) { const uid = getPlayerId(); if (uid) savePurchaseHistory(uid, { transactionId, productId: pack.sku, date: new Date().toISOString(), status: 'completed', gemsGranted: pack.amount }); }
                    }
                  } catch { /* silent */ } finally { setLoading(null); }
                }}
              >
                <View style={styles.iapIcon}>
                  <Ionicons name="diamond-outline" size={22} color="#CE93D8" />
                </View>
                <View style={styles.iapCopy}>
                  <Text style={styles.iapName}>{pack.amount.toLocaleString()} Gems</Text>
                  {idx === 2 && <Text style={styles.bestValue}>POPULAR</Text>}
                  {idx === 4 && <Text style={styles.bestValue}>BEST VALUE</Text>}
                </View>
                <Text style={[styles.iapPrice, { color: '#CE93D8' }]}>
                  {loading === pack.sku ? '…' : pack.price}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Ad-Free 7-day */}
            <TouchableOpacity
              style={[styles.iapCard, loading === IAP_SKUS.ADFREE_7DAY && styles.iapCardLoading]}
              disabled={!!loading || adFreeActive}
              onPress={async () => {
                if (adFreeActive || loading) return;
                setLoading(IAP_SKUS.ADFREE_7DAY);
                try {
                  const { success, transactionId } = await iapService.purchase(IAP_SKUS.ADFREE_7DAY);
                  if (success) {
                    removeAds(); playEffect('purchase'); showPurchase('7-day Ad-Free!');
                    if (transactionId) { const uid = getPlayerId(); if (uid) savePurchaseHistory(uid, { transactionId, productId: IAP_SKUS.ADFREE_7DAY, date: new Date().toISOString(), status: 'completed' }); }
                  }
                } catch { /* silent */ } finally { setLoading(null); }
              }}
            >
              <View style={styles.iapIcon}>
                <Ionicons name="shield-half-outline" size={22} color={adFreeActive ? GameColors.accentGold : GameColors.textSecondary} />
              </View>
              <View style={styles.iapCopy}>
                <Text style={styles.iapName}>Ad-Free 7 Days</Text>
                <Text style={styles.iapDesc}>No ads for a full week</Text>
              </View>
              <Text style={styles.iapPrice}>{loading === IAP_SKUS.ADFREE_7DAY ? '…' : adFreeActive ? '✓' : '$0.99'}</Text>
            </TouchableOpacity>

            {/* Ad-Free Lifetime */}
            <TouchableOpacity
              style={[styles.iapCard, adFreeActive && styles.iapCardOwned, loading === IAP_SKUS.ADFREE_LIFETIME && styles.iapCardLoading]}
              disabled={!!loading || adFreeActive}
              onPress={async () => {
                if (adFreeActive || loading) return;
                setLoading(IAP_SKUS.ADFREE_LIFETIME);
                try {
                  const { success, transactionId } = await iapService.purchase(IAP_SKUS.ADFREE_LIFETIME);
                  if (success) {
                    removeAds(); playEffect('purchase'); showPurchase('Ad-Free forever!');
                    if (transactionId) { const uid = getPlayerId(); if (uid) savePurchaseHistory(uid, { transactionId, productId: IAP_SKUS.ADFREE_LIFETIME, date: new Date().toISOString(), status: 'completed' }); }
                  }
                } catch { /* silent */ } finally { setLoading(null); }
              }}
            >
              <View style={styles.iapIcon}>
                <Ionicons name={adFreeActive ? 'shield-checkmark' : 'shield-outline'} size={22} color={adFreeActive ? GameColors.accentGold : '#CE93D8'} />
              </View>
              <View style={styles.iapCopy}>
                <Text style={styles.iapName}>Ad-Free Lifetime</Text>
                <Text style={styles.iapDesc}>{adFreeActive ? 'Active — enjoy the silence' : 'Never see an ad again'}</Text>
              </View>
              <Text style={[styles.iapPrice, adFreeActive && { color: GameColors.accentGold }]}>
                {loading === IAP_SKUS.ADFREE_LIFETIME ? '…' : adFreeActive ? '✓' : '$4.99'}
              </Text>
            </TouchableOpacity>

            {/* Starter Pack */}
            <TouchableOpacity
              style={[styles.iapCard, styles.iapCardPopular, loading === IAP_SKUS.STARTER_PACK && styles.iapCardLoading]}
              disabled={!!loading}
              onPress={async () => {
                setLoading(IAP_SKUS.STARTER_PACK);
                try {
                  const { success, transactionId } = await iapService.purchase(IAP_SKUS.STARTER_PACK);
                  if (success) {
                    mockPurchaseCoins(500); addGems(100); playEffect('purchase'); showPurchase('Starter Pack!');
                    if (transactionId) { const uid = getPlayerId(); if (uid) savePurchaseHistory(uid, { transactionId, productId: IAP_SKUS.STARTER_PACK, date: new Date().toISOString(), status: 'completed', coinsGranted: 500, gemsGranted: 100 }); }
                  }
                } catch { /* silent */ } finally { setLoading(null); }
              }}
            >
              <View style={styles.iapIcon}>
                <Ionicons name="gift-outline" size={22} color={GameColors.accentGold} />
              </View>
              <View style={styles.iapCopy}>
                <Text style={styles.iapName}>Starter Pack</Text>
                <Text style={styles.iapDesc}>500 Coins + 100 Gems · Best first purchase</Text>
              </View>
              <Text style={styles.iapPrice}>{loading === IAP_SKUS.STARTER_PACK ? '…' : '$2.00'}</Text>
            </TouchableOpacity>

            {/* Season Pass (coming soon) */}
            <View style={[styles.iapCard, { opacity: 0.45 }]}>
              <View style={styles.iapIcon}>
                <Ionicons name="calendar-outline" size={22} color={GameColors.textSecondary} />
              </View>
              <View style={styles.iapCopy}>
                <Text style={styles.iapName}>Season Pass</Text>
                <Text style={styles.iapDesc}>Exclusive season rewards — coming soon</Text>
              </View>
              <Text style={styles.iapPrice}>$5.00</Text>
            </View>

            <TouchableOpacity
              style={[styles.restoreBtn, loading === 'restore' && { opacity: 0.6 }]}
              onPress={async () => {
                if (loading) return;
                setLoading('restore');
                try {
                  const ok = await iapService.restoreAdsRemoved();
                  if (ok) { removeAds(); showPurchase('Purchases restored'); }
                  else Alert.alert('Nothing to restore', 'No previous Ad-Free purchase found.');
                } catch { Alert.alert('Restore failed', 'Could not reach the store. Please try again.'); }
                finally { setLoading(null); }
              }}
              disabled={!!loading}
            >
              <Ionicons name="refresh-outline" size={14} color={GameColors.textSecondary} />
              <Text style={styles.restoreText}>{loading === 'restore' ? 'Restoring…' : 'Restore Purchases'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </AnimatedBackground>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────

interface CardProps {
  item: RuntimeItem;
  balance: number;
  onPress: () => void;
}

const ItemCard: React.FC<CardProps> = ({ item, balance, onPress }) => {
  const rarityColor = RARITY_COLORS[item.rarity] ?? GameColors.textSecondary;
  const canAfford   = balance >= item.price;
  const isAvatar    = item.id.startsWith('avatar_');
  const isGem       = item.currencyType === 'gems';
  const isStackable = !isAvatar && !isGem; // consumables / power-ups can be bought again

  // ── Button label & style ─────────────────────────────────────────────────
  let label: string;
  let btnVariant: 'buy' | 'equip' | 'equipped' | 'disabled';

  if (item.equipped) {
    label = 'Equipped ✓';
    btnVariant = 'equipped';
  } else if (item.owned && (isAvatar || isGem)) {
    label = 'Equip';
    btnVariant = 'equip';
  } else if (item.price === 0) {
    label = 'Free · Equip';
    btnVariant = canAfford ? 'buy' : 'disabled';
  } else {
    const currency = isGem ? '💎' : '🪙';
    label = `${item.price} ${currency}`;
    btnVariant = canAfford ? 'buy' : 'disabled';
  }

  const btnStyle =
    btnVariant === 'equipped' ? styles.btnEquipped :
    btnVariant === 'equip'    ? styles.btnEquip    :
    btnVariant === 'disabled' ? styles.btnDisabled :
    styles.btnBuy;

  const btnTextStyle = btnVariant === 'equipped' ? styles.btnTextEquipped :
                       btnVariant === 'equip'    ? styles.btnTextEquip    :
                       btnVariant === 'disabled' ? styles.btnTextDisabled :
                       styles.btnTextBuy;

  return (
    <View style={[styles.card, { borderColor: `${rarityColor}44` }]}>
      {/* Icon area */}
      <View style={[styles.cardIconWrap, { backgroundColor: `${rarityColor}18` }]}>
        {SHOP_IMAGES[item.id] ? (
          <Image
            source={SHOP_IMAGES[item.id]}
            style={[styles.itemImg, { opacity: item.owned || item.price === 0 ? 1 : 0.5 }]}
            resizeMode="contain"
          />
        ) : (
          <Ionicons
            name={item.icon as React.ComponentProps<typeof Ionicons>['name']}
            size={30}
            color={item.owned ? rarityColor : GameColors.textSecondary}
          />
        )}
        {/* Quantity badge for stackable items */}
        {item.quantity !== undefined && item.quantity > 0 && (
          <View style={[styles.qtyBadge, { backgroundColor: rarityColor }]}>
            <Text style={styles.qtyText}>{item.quantity}</Text>
          </View>
        )}
      </View>

      {/* Name */}
      <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>

      {/* Rarity badge */}
      <View style={[styles.rarityBadge, { backgroundColor: `${rarityColor}22` }]}>
        <Text style={[styles.rarityText, { color: rarityColor }]}>
          {item.rarity.toUpperCase()}
        </Text>
      </View>

      {/* Description */}
      <Text style={styles.cardDesc} numberOfLines={3}>{item.description}</Text>

      {/* Action button */}
      <TouchableOpacity
        style={[styles.cardBtn, btnStyle]}
        onPress={onPress}
        disabled={btnVariant === 'disabled'}
        activeOpacity={0.75}
      >
        <Text style={[styles.cardBtnText, btnTextStyle]}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { paddingHorizontal: 18, gap: 16 },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:       { ...Typography.header, color: GameColors.textWhite, fontSize: 26 },
  currencyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gemPill:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(206,147,216,0.15)', borderWidth: 1, borderColor: 'rgba(206,147,216,0.35)' },
  gemText:     { color: '#CE93D8', fontFamily: 'Inter_700Bold', fontSize: 13 },

  // Tabs
  tabs:        { flexDirection: 'row', gap: 10 },
  tabBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 14, borderWidth: 1, borderColor: GameColors.border, backgroundColor: 'rgba(255,255,255,0.04)' },
  tabBtnActive:{ backgroundColor: GameColors.accentGold, borderColor: GameColors.accentGold },
  tabText:     { ...Typography.small, color: GameColors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  tabTextActive: { color: GameColors.backgroundPrimary, fontFamily: 'Inter_700Bold' },

  // Filter bar
  filterBar:    { flexGrow: 0 },
  filterContent:{ flexDirection: 'row', gap: 8, paddingRight: 4 },
  chip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: GameColors.border, backgroundColor: 'rgba(255,255,255,0.04)' },
  chipActive:   { backgroundColor: 'rgba(255,215,0,0.15)', borderColor: 'rgba(255,215,0,0.5)' },
  chipText:     { ...Typography.small, color: GameColors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  chipTextActive:{ color: GameColors.accentGold, fontFamily: 'Inter_700Bold' },

  // Grid
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  // Item card
  card: {
    width: '47%',
    flexGrow: 1,
    flexBasis: '44%',
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    alignItems: 'center',
  },
  cardIconWrap: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
    marginBottom: 2,
  },
  itemImg: { width: 46, height: 46 },
  qtyBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  qtyText:  { color: '#000', fontFamily: 'Inter_700Bold', fontSize: 10 },
  cardName: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 13, textAlign: 'center' },
  rarityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  rarityText:  { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.8 },
  cardDesc: {
    color: GameColors.textSecondary, fontSize: 10, textAlign: 'center',
    lineHeight: 14, minHeight: 42, fontFamily: 'Inter_400Regular',
  },
  cardBtn:     { width: '100%', paddingVertical: 9, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  btnBuy:      { backgroundColor: GameColors.accentGold },
  btnEquip:    { backgroundColor: 'rgba(255,215,0,0.18)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.5)' },
  btnEquipped: { backgroundColor: 'rgba(0,230,118,0.15)', borderWidth: 1, borderColor: 'rgba(0,230,118,0.5)' },
  btnDisabled: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: GameColors.border },
  cardBtnText:      { fontFamily: 'Inter_700Bold', fontSize: 12 },
  btnTextBuy:       { color: GameColors.backgroundPrimary },
  btnTextEquip:     { color: GameColors.accentGold },
  btnTextEquipped:  { color: GameColors.accentGreen },
  btnTextDisabled:  { color: GameColors.textSecondary },

  // Empty state
  emptyWrap: { paddingVertical: 48, alignItems: 'center', gap: 10 },
  emptyText: { color: GameColors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 14 },

  // Floating toast
  floating: {
    position: 'absolute', top: 108, alignSelf: 'center', zIndex: 10,
    color: GameColors.accentGreen, fontFamily: 'Inter_700Bold', fontSize: 17,
    textShadowColor: 'rgba(0,230,118,0.4)', textShadowRadius: 8,
  },

  // IAP section (Buy More Coins / Get Gems)
  iapSection: { gap: 10, marginTop: 6 },
  iapDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  iapLine:    { flex: 1, height: 1, backgroundColor: GameColors.border },
  iapLabel:   { color: GameColors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.5 },
  iapHint:    { color: GameColors.textSecondary, fontSize: 11, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  iapCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: GameColors.border,
  },
  iapCardOwned:   { backgroundColor: 'rgba(255,215,0,0.06)', borderColor: 'rgba(255,215,0,0.4)' },
  iapCardPopular: { borderColor: GameColors.accentGold },
  iapCardLoading: { opacity: 0.6 },
  iapIcon:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)' },
  iapCopy:  { flex: 1, gap: 3 },
  iapName:  { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 15 },
  iapDesc:  { color: GameColors.textSecondary, fontSize: 11, fontFamily: 'Inter_400Regular' },
  iapPrice: { color: GameColors.accentGold, fontFamily: 'Inter_700Bold', fontSize: 15 },
  bestValue:{ color: GameColors.backgroundPrimary, backgroundColor: GameColors.accentGold, fontFamily: 'Inter_700Bold', fontSize: 9, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  restoreBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  restoreText: { color: GameColors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 13 },

  // ── Gem Packs (spendable bundles) ─────────────────────────────────────────
  gemPacksSection: { gap: 10, marginTop: 4 },
  gemPackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  gemPackIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  gemPackInfo: { flex: 1, gap: 3 },
  gemPackTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  gemPackName: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 14 },
  rarityChip: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  rarityChipText: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.7 },
  gemPackDesc: { color: GameColors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 11 },
  gemPackRewards: { color: '#A78BFA', fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 1 },
  gemPackPrice: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(206,147,216,0.15)',
    borderWidth: 1, borderColor: 'rgba(206,147,216,0.4)',
  },
  gemPackPriceInsufficient: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: GameColors.border,
  },
  gemPackPriceText: { color: '#CE93D8', fontFamily: 'Inter_700Bold', fontSize: 13 },
});
