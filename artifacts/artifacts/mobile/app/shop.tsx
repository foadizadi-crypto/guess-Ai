/**
 * shop.tsx — 3-tab shop: Play · Gems · Cosmetics
 * Strict Expo Router SDK 54 Framework + TypeScript Compilable
 *
 * CRITICAL AUDIT FIXES APPLIED:
 * 1. NATIVE IAP BLOCK CATCH (P0): Integrates with user cancellation handling to prevent locked UI states.
 * 2. AUDIO GC SYSTEM (P2): Managed tap feedback effects for tabs and items with memory flushing.
 * 3. LOCAL LOGO PIPELINE: Correctly maps image structures into your local asset bundles.
 */
import React, { useState, useCallback, useEffect } from 'react';
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';

import { AnimatedBackground } from '@/components/AnimatedBackground';
import { AnimatedIcon } from '@/components/AnimatedIcon';
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
import {
  CONSUMABLE_SHOP_ITEMS,
  POWERUP_SHOP_ITEMS,
  AVATAR_SHOP_ITEMS,
  GEM_SHOP_ITEMS,
  GEM_PACKS,
  STAMINA_PACKS,
  RARITY_COLORS,
} from '@/constants/shopConfig';
import { IAP_GEM_PACKS, COIN_GEM_EXCHANGES, type CoinGemExchangeId } from '@/constants/economy';
import type { PowerUpId, CosmeticType } from '@/types';
import type { ConsumableId } from '@/constants/shopData';

// ─── Item local image manifest loader mapping ──────────────────────────────
const SHOP_IMAGES: Record<string, ReturnType<typeof require>> = {
  time_boost:      require('@/assets/shop/time_boost.png'),
  combo_shield:    require('@/assets/shop/combo_shield.png'),
  clarity_bomb:    require('@/assets/shop/clarity_bomb.png'),
  error_nullifier: require('@/assets/shop/error_nullifier.png'),
  multiplier_2x:   require('@/assets/shop/x2_multiplier.png'),
  rare_sticker:    require('@/assets/shop/rare_sticker.png'),
  // Tab local graphics setup from icons folder
  tab_play:        require('@/assets/icon/shop.png'), // Reuse core shop graphics for layout consistency
  tab_gems:        require('@/assets/icon/gem_pack.png'),
  tab_cosmetics:   require('@/assets/icon/legendary_pack.png'),
};

const TABS = [
  { label: 'Play',       icon: 'game-controller-outline', imageKey: 'tab_play' },
  { label: 'Gems',       icon: 'diamond-outline',        imageKey: 'tab_gems' },
  { label: 'Cosmetics',  icon: 'sparkles-outline',       imageKey: 'tab_cosmetics' },
] as const;

/** Deep-link keys accepted via ?tab= so other screens can open a specific tab. */
const TAB_PARAM_INDEX: Record<string, number> = {
  play: 0,
  gems: 1,
  cosmetics: 2,
};

const COSM_FILTERS = ['All', 'Avatars', 'Frames', 'Badges', 'Effects'] as const;
type CosmFilter = typeof COSM_FILTERS[number];

const POWER_UP_IDS = new Set(['hint', 'reveal-blur', 'skip-question', 'double-xp']);

function cosmSubcat(id: string): CosmFilter {
  if (id.includes('avatar'))  return 'Avatars';
  if (id.includes('frame'))   return 'Frames';
  if (id.includes('badge') || id.includes('title')) return 'Badges';
  return 'Effects';
}

export default function ShopScreen() {
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === 'web' ? 62 : insets.top + 12;
  const bottomPad = Platform.OS === 'web' ? 28 : insets.bottom + 24;
  const { playEffect } = useAudio();

  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const [tab,         setTab]         = useState<number>(TAB_PARAM_INDEX[tabParam ?? ''] ?? 0);

  // Honour ?tab= even when the shop is already mounted (deep link from lobby).
  useEffect(() => {
    if (tabParam === undefined) return;
    const target = TAB_PARAM_INDEX[tabParam];
    if (target === undefined) return;
    setTab(target);
    setCosmFilter('All');
  }, [tabParam]);
  const [cosmFilter,  setCosmFilter]  = useState<CosmFilter>('All');
  const [floating,    setFloating]    = useState<string | null>(null);
  const [loading,     setLoading]     = useState<string | null>(null);
  const [soundInstance, setSoundInstance] = useState<Audio.Sound | null>(null);

  // ── Zustand User Store Hooks Bindings ─────────────────────────────────────
  const coins              = useUserStore((s) => s.coins);
  const gems               = useUserStore((s) => s.gems);
  const consumables        = useUserStore((s) => s.consumables);
  const powerUps           = useUserStore((s) => s.powerUps);
  const gemCosmetics       = useUserStore((s) => s.gemCosmetics);
  const avatars            = useUserStore((s) => s.avatars);
  const buyConsumable      = useUserStore((s) => s.buyConsumable);
  const buyPowerUp         = useUserStore((s) => s.buyPowerUp);
  const buyGemCosmetic     = useUserStore((s) => s.buyGemCosmetic);
  const equipGemCosmetic   = useUserStore((s) => s.equipGemCosmetic);
  const buyAvatar          = useUserStore((s) => s.buyAvatar);
  const selectAvatar       = useUserStore((s) => s.selectAvatar);
  const selectedAvatarId   = useUserStore((s) => s.selectedAvatarId);
  const mockPurchaseCoins  = useUserStore((s) => s.mockPurchaseCoins);
  const addGems            = useUserStore((s) => s.addGems);
  const buyGemPack         = useUserStore((s) => s.buyGemPack);
  const buyCoinGemExchange = useUserStore((s) => s.buyCoinGemExchange);
  const coinGemExchanges   = useUserStore((s) => s.coinGemExchanges);

  const { isAdFreePassActive, removeAds } = useAdStore();
  const adFreeActive = isAdFreePassActive();

  // --- Audio Feedback Engine Interface and Local GC Management ---
  async function playClickSound() {
    try {
      const { sound } = await Audio.Sound.createAsync(require('@/assets/audio/button_click.wav'));
      setSoundInstance(sound);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
        }
      });
      await sound.playAsync();
    } catch (err) {
      console.log('[Audio System] Shop click feedback error:', err);
    }
  }

  useEffect(() => {
    return () => {
      if (soundInstance) {
        soundInstance.unloadAsync().catch(() => {});
      }
    };
  }, [soundInstance]);

  // Animated interface coin pulse configurations
  const coinPulse = useSharedValue<number>(1);
  const coinStyle = useAnimatedStyle(() => ({ transform: [{ scale: coinPulse.value }] }));

  const toast = useCallback((msg: string) => {
    setFloating(msg);
    coinPulse.value = withSequence(withSpring(1.18), withSpring(1));
    setTimeout(() => setFloating(null), 1200);
  }, [coinPulse]);

  const ok = useCallback((msg: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    playEffect('purchase');
    toast(msg);
  }, [playEffect, toast]);

  const fail = useCallback((title: string, body: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    Alert.alert(title, body);
  }, []);

  // ── TAB CHANGE MANAGER PIPELINE ───────────────────────────────────────────
  const handleTabSelection = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    playClickSound();
    setTab(index);
    setCosmFilter('All');
  };

  const handleFilterSelection = (filter: CosmFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    playClickSound();
    setCosmFilter(filter);
  };

  // ── PLAY ITEM BUY CONTROLLER ──────────────────────────────────────────────
  const handlePlayItem = useCallback((id: string, price: number, currencyType: 'coins' | 'gems') => {
    playClickSound();
    if (POWER_UP_IDS.has(id)) {
      const result = buyPowerUp(id as PowerUpId);
      result ? ok(`−${price} 🪙`) : fail('Not enough coins', 'Earn more coins by playing or claiming daily rewards.');
    } else {
      const result = buyConsumable(id as ConsumableId);
      result ? ok(`−${price} 🪙`) : fail('Not enough coins', 'Earn more coins by playing or claiming daily rewards.');
    }
  }, [buyPowerUp, buyConsumable, ok, fail]);

  const handleCoinGemExchange = useCallback((id: string, coinCost: number, gemGrant: number, maxPurchases: number) => {
    playClickSound();
    const purchased = coinGemExchanges[id] ?? 0;
    if (purchased >= maxPurchases) {
      Alert.alert('Limit reached', `You can only use this exchange ${maxPurchases} time${maxPurchases > 1 ? 's' : ''}.`);
      return;
    }
    if (coins < coinCost) {
      Alert.alert('Not enough coins', `You need ${coinCost.toLocaleString()} 🪙.`);
      return;
    }
    Alert.alert(
      `Convert ${coinCost.toLocaleString()} 🪙?`,
      `You'll receive ${gemGrant} 💎 (${purchased + 1}/${maxPurchases} uses).`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Convert', onPress: () => {
          const result = buyCoinGemExchange(id as CoinGemExchangeId);
          result ? ok(`+${gemGrant} 💎`) : fail('Failed', 'Something went wrong.');
        }},
      ],
    );
  }, [coins, coinGemExchanges, buyCoinGemExchange, ok, fail]);

  // ── GEMS NATIVE BILLING CONTROLLER ────────────────────────────────────────
  const handleGemPack = useCallback((packId: string, packName: string, gemCost: number) => {
    playClickSound();
    if (gems < gemCost) {
      Alert.alert('Not enough gems', `You need ${gemCost} 💎. Buy gems below.`);
      return;
    }
    Alert.alert(`Buy ${packName}?`, `Spend ${gemCost} 💎 from your balance.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Buy', onPress: () => {
        const result = buyGemPack(packId);
        result ? ok(`${packName} unlocked!`) : fail('Failed', 'Something went wrong.');
      }},
    ]);
  }, [gems, buyGemPack, ok, fail]);

  const handleIAPGem = useCallback(async (sku: string, price: string, gemAmount: number) => {
    if (loading) return;
    setLoading(sku);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    playClickSound();
    try {
      // --- CRITICAL AUDIT FIX: Traps success and cancellation blocks cleanly ---
      const { success, transactionId } = await iapService.purchase(sku);
      if (success) {
        addGems(gemAmount);
        ok(`+${gemAmount} 💎`);
        const uid = getPlayerId();
        if (uid && transactionId) {
          savePurchaseHistory(uid, { transactionId, productId: sku, date: new Date().toISOString(), status: 'completed', gemsGranted: gemAmount });
        }
      } else {
        console.log('[IAP Service] Request returned failure status (user cancelled or store timeout).');
      }
    } catch (err) {
      console.warn('[IAP Core System] Unhandled payment channel fatal runtime error caught:', err);
    } finally {
      setLoading(null);
    }
  }, [loading, addGems, ok]);

  // ── COSMETICS EQUIP SWITCH CONTROLLER ─────────────────────────────────────
  const handleAvatar = useCallback((id: string) => {
    playClickSound();
    const av = avatars.find(a => a.id === id);
    if (!av) return;
    if (av.owned || id === selectedAvatarId) {
      selectAvatar(id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      toast('Equipped!');
      return;
    }
    const item = AVATAR_SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;
    if (coins < item.price) { fail('Not enough coins', `You need ${item.price} 🪙.`); return; }
    const result = buyAvatar(id, item.price);
    if (result) { selectAvatar(id); ok(`−${item.price} 🪙`); }
    else fail('Failed', 'Something went wrong.');
  }, [avatars, selectedAvatarId, coins, buyAvatar, selectAvatar, ok, fail, toast]);

  const handleGemCosmetic = useCallback((id: string, price: number, equipped: boolean) => {
    playClickSound();
    const owned = gemCosmetics[id]?.owned ?? false;
    if (owned) {
      equipGemCosmetic(id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      toast(equipped ? 'Unequipped' : 'Equipped!');
      return;
    }
    if (gems < price) { fail('Not enough gems', `You need ${price} 💎.`); return; }
    const result = buyGemCosmetic(id);
    result ? ok(`−${price} 💎`) : fail('Not enough gems', `You need ${price} 💎.`);
  }, [gems, gemCosmetics, buyGemCosmetic, equipGemCosmetic, ok, fail, toast]);

  const cosmItems = (() => {
    const avItems = AVATAR_SHOP_ITEMS.map(i => ({ ...i, subcat: 'Avatars' as CosmFilter }));
    const gemItems = GEM_SHOP_ITEMS.map(i => ({ ...i, subcat: cosmSubcat(i.id) }));
    const all = [...avItems, ...gemItems];
    if (cosmFilter === 'All') return all;
    return all.filter(i => i.subcat === cosmFilter);
  })();

  return (
    <AnimatedBackground>
      {floating ? <Text style={s.toast}>{floating}</Text> : null}

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: topPad, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* --- HEADERHUD DISPLAY --- */}
        <View style={s.header}>
          <BackButton />
          <Text style={s.title}>Shop</Text>
          <View style={s.headerRight}>
            <Animated.View style={coinStyle}>
              <CoinDisplay amount={coins} size="small" animate />
            </Animated.View>
            <View style={s.gemPill}>
              <Ionicons name="diamond" size={12} color="#CE93D8" />
              <Text style={s.gemPillText}>{gems}</Text>
            </View>
          </View>
        </View>

        {/* --- TABS SYSTEM VIEW --- */}
        <View style={s.tabs}>
          {TABS.map(({ label, icon, imageKey }, i) => (
            <TouchableOpacity
              key={label}
              style={[s.tab, tab === i && s.tabActive]}
              onPress={() => handleTabSelection(i)}
            >
              {SHOP_IMAGES[imageKey] ? (
                <AnimatedIcon animation="float" delay={i * 120} style={s.tabIconMotion}>
                  <Image source={SHOP_IMAGES[imageKey]} style={[s.tabIconImg, tab === i && { tintColor: GameColors.backgroundPrimary }]} resizeMode="contain" />
                </AnimatedIcon>
              ) : (
                <Ionicons name={icon as React.ComponentProps<typeof Ionicons>['name']} size={16} color={tab === i ? GameColors.backgroundPrimary : GameColors.textSecondary} />
              )}
              <Text style={[s.tabText, tab === i && s.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ════════════════════════ PLAY TAB LAYOUT ════════════════════════ */}
        {tab === 0 && (
          <>
            <SectionHeader label="Power-ups" icon="flash-outline" />
            <View style={s.grid}>
              {POWERUP_SHOP_ITEMS.map(item => {
                const qty = powerUps[item.id as PowerUpId] ?? 0;
                return (
                  <PlayCard
                    key={item.id}
                    item={item}
                    qty={qty}
                    balance={coins}
                    onPress={() => handlePlayItem(item.id, item.price, 'coins')}
                  />
                );
              })}
            </View>

            <SectionHeader label="Consumables" icon="cube-outline" />
            <View style={s.grid}>
              {CONSUMABLE_SHOP_ITEMS.map(item => {
                const qty = consumables[item.id as ConsumableId] ?? 0;
                return (
                  <PlayCard
                    key={item.id}
                    item={item}
                    qty={qty}
                    balance={coins}
                    onPress={() => handlePlayItem(item.id, item.price, 'coins')}
                  />
                );
              })}
            </View>

            <SectionHeader label="Convert Coins → Gems" icon="swap-horizontal-outline" />
            <Text style={s.sectionHint}>Spend accumulated coins to earn a small gem bonus — limited lifetime uses.</Text>
            {COIN_GEM_EXCHANGES.map(tier => {
              const purchased = coinGemExchanges[tier.id] ?? 0;
              const isMaxed   = purchased >= tier.maxPurchases;
              const canDo     = !isMaxed && coins >= tier.coins;
              return (
                <TouchableOpacity
                  key={tier.id}
                  style={[s.exchangeCard, isMaxed && s.exchangeCardMaxed]}
                  onPress={() => handleCoinGemExchange(tier.id, tier.coins, tier.gems, tier.maxPurchases)}
                  activeOpacity={isMaxed ? 1 : 0.8}
                  disabled={isMaxed}
                >
                  <View style={[s.exchangeIcon, { backgroundColor: isMaxed ? 'rgba(255,255,255,0.04)' : 'rgba(206,147,216,0.12)' }]}>
                    <Ionicons name="swap-horizontal-outline" size={22} color={isMaxed ? GameColors.textSecondary : '#CE93D8'} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[s.exchangeTitle, isMaxed && { color: GameColors.textSecondary }]}>+{tier.gems} 💎</Text>
                    <Text style={s.exchangeSub}>{tier.coins.toLocaleString()} 🪙 · {purchased}/{tier.maxPurchases} uses</Text>
                  </View>
                  <View style={[s.exchBtn, canDo && s.exchBtnReady, isMaxed && s.exchBtnMaxed]}>
                    <Text style={[s.exchBtnText, canDo && s.exchBtnTextReady]}>{isMaxed ? 'Maxed' : 'Convert'}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* ════════════════════════ GEMS TAB LAYOUT ════════════════════════ */}
        {tab === 1 && (
          <>
            <SectionHeader label="Buy Gems" icon="card-outline" />
            <Text style={s.sectionHint}>
              {iapService.isMockMode ? 'Mock purchase · no payment processed' : 'Purchased via App Store / Play Store'}
            </Text>
            <View style={s.iapGrid}>
              {IAP_GEM_PACKS.map((pack, idx) => (
                <TouchableOpacity
                  key={pack.id}
                  style={[s.iapGemCard, (idx === 2) && s.iapGemCardPopular, loading === pack.sku && s.cardLoading]}
                  disabled={!!loading}
                  onPress={() => handleIAPGem(pack.sku, pack.price, pack.amount)}
                  activeOpacity={0.8}
                >
                  {idx === 2 && <Text style={s.popularBadge}>POPULAR</Text>}
                  {idx === 4 && <Text style={s.popularBadge}>BEST VALUE</Text>}
                  <Ionicons name="diamond" size={28} color="#CE93D8" />
                  <Text style={s.iapGemAmount}>{pack.amount.toLocaleString()}</Text>
                  <Text style={s.iapGemLabel}>Gems</Text>
                  <View style={s.iapGemPricePill}>
                    <Text style={s.iapGemPrice}>{loading === pack.sku ? '…' : pack.price}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <SectionHeader label="Stamina Packs" icon="battery-charging-outline" />
            {STAMINA_PACKS.map(pack => {
              const rarityColor = RARITY_COLORS[pack.rarity] ?? GameColors.textSecondary;
              const canAfford   = gems >= pack.gemCost;
              return (
                <BundleCard
                  key={pack.id}
                  pack={pack}
                  rarityColor={rarityColor}
                  canAfford={canAfford}
                  onPress={() => handleGemPack(pack.id, pack.name, pack.gemCost)}
                  subtitle={`⚡ ${pack.stamina} stamina`}
                />
              );
            })}

            <SectionHeader label="Gem Bundles" icon="gift-outline" />
            {GEM_PACKS.map(pack => {
              const rarityColor = RARITY_COLORS[pack.rarity] ?? GameColors.textSecondary;
              const canAfford   = gems >= pack.gemCost;
              const subtitle = [
                `⚡ ${pack.stamina.toLocaleString()} stamina`,
                `🪙 ${pack.coins.toLocaleString()} coins`,
                pack.cosmeticIds.length > 0 ? `✨ ${pack.cosmeticIds.length} cosmetic${pack.cosmeticIds.length > 1 ? 's' : ''}` : '',
              ].filter(Boolean).join(' · ');
              return (
                <BundleCard
                  key={pack.id}
                  pack={pack}
                  rarityColor={rarityColor}
                  canAfford={canAfford}
                  onPress={() => handleGemPack(pack.id, pack.name, pack.gemCost)}
                  subtitle={subtitle}
                />
              );
            })}

            <SectionHeader label="Special Offers" icon="pricetag-outline" />
            <OfferCard
              icon="shield-half-outline"
              iconColor={adFreeActive ? GameColors.accentGold : GameColors.textSecondary}
              name="Ad-Free · 7 Days"
              desc="No ads for a full week"
              price={loading === IAP_SKUS.ADFREE_7DAY ? '…' : adFreeActive ? '✓ Active' : '$0.99'}
              owned={adFreeActive}
              loading={loading === IAP_SKUS.ADFREE_7DAY}
              disabled={!!loading || adFreeActive}
              onPress={async () => {
                if (adFreeActive || loading) return;
                setLoading(IAP_SKUS.ADFREE_7DAY);
                try {
                  const { success, transactionId } = await iapService.purchase(IAP_SKUS.ADFREE_7DAY);
                  if (success) { 
                    removeAds(); ok('7-day Ad-Free!'); 
                    const uid = getPlayerId(); 
                    if (uid && transactionId) savePurchaseHistory(uid, { transactionId, productId: IAP_SKUS.ADFREE_7DAY, date: new Date().toISOString(), status: 'completed' }); 
                  }
                } catch { /* */ } finally { setLoading(null); }
              }}
            />

            <OfferCard
              icon={adFreeActive ? 'shield-checkmark' : 'shield-outline'}
              iconColor={adFreeActive ? GameColors.accentGold : '#CE93D8'}
              name="Ad-Free · Lifetime"
              desc={adFreeActive ? 'Active — enjoy the silence' : 'Never see an ad again'}
              price={loading === IAP_SKUS.ADFREE_LIFETIME ? '…' : adFreeActive ? '✓ Active' : '$4.99'}
              owned={adFreeActive}
              loading={loading === IAP_SKUS.ADFREE_LIFETIME}
              disabled={!!loading || adFreeActive}
              onPress={async () => {
                if (adFreeActive || loading) return;
                setLoading(IAP_SKUS.ADFREE_LIFETIME);
                try {
                  const { success, transactionId } = await iapService.purchase(IAP_SKUS.ADFREE_LIFETIME);
                  if (success) { 
                    removeAds(); ok('Ad-Free forever!'); 
                    const uid = getPlayerId(); 
                    if (uid && transactionId) savePurchaseHistory(uid, { transactionId, productId: IAP_SKUS.ADFREE_LIFETIME, date: new Date().toISOString(), status: 'completed' }); 
                  }
                } catch { /* */ } finally { setLoading(null); }
              }}
            />

            <OfferCard
              icon="gift-outline"
              iconColor={GameColors.accentGold}
              name="Starter Pack"
              desc="500 Coins + 100 Gems · Best first purchase"
              price={loading === IAP_SKUS.STARTER_PACK ? '…' : '$2.00'}
              highlight
              loading={loading === IAP_SKUS.STARTER_PACK}
              disabled={!!loading}
              onPress={async () => {
                if (loading) return;
                setLoading(IAP_SKUS.STARTER_PACK);
                try {
                  const { success, transactionId } = await iapService.purchase(IAP_SKUS.STARTER_PACK);
                  if (success) { 
                    mockPurchaseCoins(500); addGems(100); ok('Starter Pack!'); 
                    const uid = getPlayerId(); 
                    if (uid && transactionId) savePurchaseHistory(uid, { transactionId, productId: IAP_SKUS.STARTER_PACK, date: new Date().toISOString(), status: 'completed', coinsGranted: 500, gemsGranted: 100 }); 
                  }
                } catch { /* */ } finally { setLoading(null); }
              }}
            />

            <TouchableOpacity
              style={[s.restoreBtn, loading === 'restore' && { opacity: 0.6 }]}
              disabled={!!loading}
              onPress={async () => {
                if (loading) return;
                setLoading('restore');
                try {
                  const restored = await iapService.restoreAdsRemoved();
                  if (restored) { removeAds(); toast('Purchases restored'); }
                  else Alert.alert('Nothing to restore', 'No previous Ad-Free purchase found.');
                } catch { Alert.alert('Restore failed', 'Could not reach the store.'); }
                finally { setLoading(null); }
              }}
            >
              <Ionicons name="refresh-outline" size={14} color={GameColors.textSecondary} />
              <Text style={s.restoreText}>{loading === 'restore' ? 'Restoring…' : 'Restore Purchases'}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ════════════════════════ COSMETICS TAB LAYOUT ════════════════════════ */}
        {tab === 2 && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterBar} contentContainerStyle={s.filterContent}>
              {COSM_FILTERS.map(f => (
                <TouchableOpacity key={f} style={[s.chip, cosmFilter === f && s.chipActive]} onPress={() => handleFilterSelection(f)}>
                  <Text style={[s.chipText, cosmFilter === f && s.chipTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {cosmItems.length > 0 ? (
              <View style={s.grid}>
                {cosmItems.map(item => {
                  const isAvatar  = item.subcat === 'Avatars';
                  const av        = isAvatar ? avatars.find(a => a.id === item.id) : null;
                  const owned     = isAvatar ? (av?.owned ?? false) : (gemCosmetics[item.id]?.owned ?? false);
                  const equipped  = isAvatar ? (item.id === selectedAvatarId) : (gemCosmetics[item.id]?.equipped ?? false);
                  const rarityColor = RARITY_COLORS[item.rarity] ?? GameColors.textSecondary;
                  const balance   = item.currencyType === 'coins' ? coins : gems;
                  const canAfford = balance >= item.price;
                  const currency  = item.currencyType === 'coins' ? '🪙' : '💎';

                  let btnLabel: string;
                  if (equipped)              btnLabel = 'Equipped ✓';
                  else if (owned)            btnLabel = 'Equip';
                  else if (item.price === 0) btnLabel = 'Free · Equip';
                  else                       btnLabel = `${item.price} ${currency}`;

                  const btnStyle = equipped ? s.btnEquipped : owned ? s.btnEquip : canAfford ? s.btnBuy : s.btnLocked;
                  const btnTextStyle = equipped ? s.btnTextEquipped : owned ? s.btnTextEquip : canAfford ? s.btnTextBuy : s.btnTextLocked;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[s.cosmCard, { borderColor: `${rarityColor}44` }]}
                      onPress={() => isAvatar ? handleAvatar(item.id) : handleGemCosmetic(item.id, item.price, equipped)}
                      activeOpacity={0.8}
                    >
                      <View style={[s.cosmIcon, { backgroundColor: `${rarityColor}18` }]}>
                        {SHOP_IMAGES[item.id] ? (
                          <AnimatedIcon animation="float" style={s.itemMotion}>
                            <Image source={SHOP_IMAGES[item.id]} style={s.itemImg} resizeMode="contain" />
                          </AnimatedIcon>
                        ) : (
                          <Ionicons name={item.icon as React.ComponentProps<typeof Ionicons>['name']} size={28} color={owned ? rarityColor : GameColors.textSecondary} />
                        )}
                      </View>
                      <Text style={s.cosmName} numberOfLines={1}>{item.name}</Text>
                      <View style={[s.rarityBadge, { backgroundColor: `${rarityColor}22` }]}>
                        <Text style={[s.rarityText, { color: rarityColor }]}>{item.rarity.toUpperCase()}</Text>
                      </View>
                      <Text style={s.cosmDesc} numberOfLines={2}>{item.description}</Text>
                      <View style={[s.cosmBtn, btnStyle]}>
                        <Text style={[s.cosmBtnText, btnTextStyle]}>{btnLabel}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={s.empty}>
                <Ionicons name="search-outline" size={40} color={GameColors.textSecondary} />
                <Text style={s.emptyText}>No items in this category</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </AnimatedBackground>
  );
}

// ─── SUB-COMPONENTS ENGINE GENERATOR LAYER ──────────────────────────────────
function SectionHeader({ label, icon }: { label: string; icon: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionLine} />
      <View style={s.sectionLabelRow}>
        <Ionicons name={icon as any} size={13} color={GameColors.textSecondary} />
        <Text style={s.sectionLabel}>{label}</Text>
      </View>
      <View style={s.sectionLine} />
    </View>
  );
}

interface PlayCardProps {
  item: { id: string; name: string; description: string; icon: string; rarity: string; price: number };
  qty: number;
  balance: number;
  onPress: () => void;
}
function PlayCard({ item, qty, balance, onPress }: PlayCardProps) {
  const rarityColor = RARITY_COLORS[item.rarity] ?? GameColors.textSecondary;
  const canAfford   = balance >= item.price;
  return (
    <TouchableOpacity style={[s.playCard, { borderColor: `${rarityColor}44` }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.playIconWrap, { backgroundColor: `${rarityColor}18` }]}>
        {SHOP_IMAGES[item.id] ? (
          <AnimatedIcon animation="pulse" style={s.itemMotion}>
            <Image source={SHOP_IMAGES[item.id]} style={s.itemImg} resizeMode="contain" />
          </AnimatedIcon>
        ) : (
          <Ionicons name={item.icon as any} size={26} color={rarityColor} />
        )}
        {qty > 0 && (
          <View style={[s.qtyBadge, { backgroundColor: rarityColor }]}>
            <Text style={s.qtyText}>{qty}</Text>
          </View>
        )}
      </View>
      <Text style={s.playName} numberOfLines={1}>{item.name}</Text>
      <View style={[s.rarityBadge, { backgroundColor: `${rarityColor}22` }]}>
        <Text style={[s.rarityText, { color: rarityColor }]}>{item.rarity.toUpperCase()}</Text>
      </View>
      <Text style={s.playDesc} numberOfLines={2}>{item.description}</Text>
      <View style={[s.playBtn, canAfford ? s.btnBuy : s.btnLocked]}>
        <Text style={[s.playBtnText, canAfford ? s.btnTextBuy : s.btnTextLocked]}>{item.price} 🪙</Text>
      </View>
    </TouchableOpacity>
  );
}

interface BundleCardProps {
  pack: { id: string; name: string; description: string; icon: string; rarity: string; gemCost: number };
  rarityColor: string;
  canAfford: boolean;
  subtitle: string;
  onPress: () => void;
}
function BundleCard({ pack, rarityColor, canAfford, subtitle, onPress }: BundleCardProps) {
  return (
    <TouchableOpacity style={[s.bundleCard, { borderColor: `${rarityColor}55` }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.bundleIcon, { backgroundColor: `${rarityColor}20` }]}>
        <Ionicons name={pack.icon as any} size={22} color={rarityColor} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Text style={s.bundleName}>{pack.name}</Text>
          <View style={[s.rarityChip, { backgroundColor: `${rarityColor}25` }]}>
            <Text style={[s.rarityChipText, { color: rarityColor }]}>{pack.rarity.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={s.bundleDesc}>{pack.description}</Text>
        <Text style={s.bundleSub}>{subtitle}</Text>
      </View>
      <View style={[s.bundlePrice, !canAfford && s.bundlePriceLow]}>
        <Ionicons name="diamond" size={11} color={canAfford ? '#CE93D8' : GameColors.textSecondary} />
        <Text style={[s.bundlePriceText, !canAfford && { color: GameColors.textSecondary }]}>{pack.gemCost}</Text>
      </View>
    </TouchableOpacity>
  );
}

interface OfferCardProps {
  icon: string; iconColor: string;
  name: string; desc: string; price: string;
  owned?: boolean; highlight?: boolean; loading?: boolean; disabled?: boolean;
  onPress: () => void;
}
function OfferCard({ icon, iconColor, name, desc, price, owned, highlight, loading, disabled, onPress }: OfferCardProps) {
  return (
    <TouchableOpacity style={[s.offerCard, owned && s.offerCardOwned, highlight && s.offerCardHighlight, loading && s.cardLoading]} onPress={onPress} disabled={disabled} activeOpacity={0.8}>
      <View style={s.offerIcon}>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={s.offerName}>{name}</Text>
        <Text style={s.offerDesc}>{desc}</Text>
      </View>
      <Text style={[s.offerPrice, owned && { color: GameColors.accentGold }]}>{price}</Text>
    </TouchableOpacity>
  );
}

// ─── STYLES ARCHITECTURE SHEET ──────────────────────────────────────────────
const s = StyleSheet.create({
  scroll: { paddingHorizontal: 18, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...Typography.header, color: GameColors.textWhite, fontSize: 26 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gemPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(206,147,216,0.15)', borderWidth: 1, borderColor: 'rgba(206,147,216,0.35)' },
  gemPillText: { color: '#CE93D8', fontFamily: 'Inter_700Bold', fontSize: 13 },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: GameColors.border, backgroundColor: 'rgba(255,255,255,0.04)' },
  tabActive: { backgroundColor: GameColors.accentGold, borderColor: GameColors.accentGold },
  tabIconMotion: { width: 14, height: 14 },
  tabIconImg: { width: 14, height: 14, tintColor: GameColors.textSecondary },
  tabText: { color: GameColors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  tabTextActive: { color: GameColors.backgroundPrimary, fontFamily: 'Inter_700Bold', fontSize: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  sectionLine: { flex: 1, height: 1, backgroundColor: GameColors.border },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sectionLabel: { color: GameColors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.6 },
  sectionHint: { color: GameColors.textSecondary, fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 16, marginTop: -6 },
  filterBar: { flexGrow: 0, marginTop: -2 },
  filterContent: { flexDirection: 'row', gap: 8, paddingRight: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: GameColors.border, backgroundColor: 'rgba(255,255,255,0.04)' },
  chipActive: { backgroundColor: 'rgba(255,215,0,0.15)', borderColor: 'rgba(255,215,0,0.5)' },
  chipText: { color: GameColors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  chipTextActive: { color: GameColors.accentGold, fontFamily: 'Inter_700Bold', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  playCard: { width: '47%', flexGrow: 1, flexBasis: '44%', backgroundColor: 'rgba(255,255,255,0.045)', borderRadius: 18, borderWidth: 1, padding: 13, gap: 5, alignItems: 'center' },
  playIconWrap: { width: 58, height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 2 },
  playName: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 13, textAlign: 'center' },
  playDesc: { color: GameColors.textSecondary, fontSize: 10, textAlign: 'center', lineHeight: 14, minHeight: 28, fontFamily: 'Inter_400Regular' },
  playBtn: { width: '100%', paddingVertical: 8, borderRadius: 12, alignItems: 'center', marginTop: 2 },
  playBtnText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  cosmCard: { width: '47%', flexGrow: 1, flexBasis: '44%', backgroundColor: 'rgba(255,255,255,0.045)', borderRadius: 18, borderWidth: 1, padding: 13, gap: 5, alignItems: 'center' },
  cosmIcon: { width: 58, height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cosmName: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 13, textAlign: 'center' },
  cosmDesc: { color: GameColors.textSecondary, fontSize: 10, textAlign: 'center', lineHeight: 14, minHeight: 28, fontFamily: 'Inter_400Regular' },
  cosmBtn: { width: '100%', paddingVertical: 8, borderRadius: 12, alignItems: 'center', marginTop: 2 },
  cosmBtnText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  itemMotion: { width: 42, height: 42 },
  itemImg: { width: 42, height: 42 },
  qtyBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  qtyText: { color: '#000', fontFamily: 'Inter_700Bold', fontSize: 10 },
  rarityBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  rarityText: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.8 },
  rarityChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  rarityChipText: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.7 },
  btnBuy: { backgroundColor: GameColors.accentGold },
  btnEquip: { backgroundColor: 'rgba(255,215,0,0.18)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.5)' },
  btnEquipped: { backgroundColor: 'rgba(0,230,118,0.15)', borderWidth: 1, borderColor: 'rgba(0,230,118,0.5)' },
  btnLocked: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: GameColors.border },
  btnTextBuy: { color: GameColors.backgroundPrimary },
  btnTextEquip: { color: GameColors.accentGold },
  btnTextEquipped: { color: GameColors.accentGreen },
  btnTextLocked: { color: GameColors.textSecondary },
  bundleCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.045)' },
  bundleIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bundleName: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 14 },
  bundleDesc: { color: GameColors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 11 },
  bundleSub: { color: '#A78BFA', fontFamily: 'Inter_500Medium', fontSize: 11 },
  bundlePrice: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(206,147,216,0.15)', borderWidth: 1, borderColor: 'rgba(206,147,216,0.4)' },
  bundlePriceLow: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: GameColors.border },
  bundlePriceText: { color: '#CE93D8', fontFamily: 'Inter_700Bold', fontSize: 13 },
  iapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iapGemCard: { width: '30%', flexGrow: 1, alignItems: 'center', gap: 4, paddingVertical: 16, paddingHorizontal: 8, borderRadius: 16, backgroundColor: 'rgba(206,147,216,0.07)', borderWidth: 1, borderColor: 'rgba(206,147,216,0.2)', position: 'relative', overflow: 'hidden' },
  iapGemCardPopular: { borderColor: GameColors.accentGold, backgroundColor: 'rgba(255,215,0,0.07)' },
  iapGemAmount: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 18 },
  iapGemLabel: { color: '#CE93D8', fontFamily: 'Inter_500Medium', fontSize: 11 },
  iapGemPricePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: GameColors.accentGold, marginTop: 4 },
  iapGemPrice: { color: GameColors.backgroundPrimary, fontFamily: 'Inter_700Bold', fontSize: 12 },
  popularBadge: { position: 'absolute', top: 6, right: -14, backgroundColor: GameColors.accentGold, paddingHorizontal: 18, paddingVertical: 2, transform: [{ rotate: '35deg' }] },
  offerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: GameColors.border },
  offerCardOwned: { backgroundColor: 'rgba(255,215,0,0.06)', borderColor: 'rgba(255,215,0,0.4)' },
  offerCardHighlight: { borderColor: GameColors.accentGold },
  offerIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)' },
  offerName: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 15 },
  offerDesc: { color: GameColors.textSecondary, fontSize: 11, fontFamily: 'Inter_400Regular' },
  offerPrice: { color: GameColors.accentGold, fontFamily: 'Inter_700Bold', fontSize: 15 },
  cardLoading: { opacity: 0.6 },
  exchangeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: 'rgba(206,147,216,0.06)', borderWidth: 1, borderColor: 'rgba(206,147,216,0.25)' },
  exchangeCardMaxed: { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: GameColors.border },
  exchangeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  exchangeTitle: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 15 },
  exchangeSub: { color: GameColors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 11 },
  exchBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: GameColors.border, backgroundColor: 'rgba(255,255,255,0.05)' },
  exchBtnReady: { backgroundColor: 'rgba(206,147,216,0.18)', borderColor: 'rgba(206,147,216,0.5)' },
  exchBtnMaxed: { opacity: 0.4 },
  exchBtnText: { color: GameColors.textSecondary, fontFamily: 'Inter_700Bold', fontSize: 12 },
  exchBtnTextReady: { color: '#CE93D8' },
  restoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  restoreText: { color: GameColors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 13 },
  empty: { paddingVertical: 48, alignItems: 'center', gap: 10 },
  emptyText: { color: GameColors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 14 },
  toast: { position: 'absolute', top: 108, alignSelf: 'center', zIndex: 10, color: GameColors.accentGreen, fontFamily: 'Inter_700Bold', fontSize: 17, textShadowColor: 'rgba(0,230,118,0.4)', textShadowRadius: 8 },
});
