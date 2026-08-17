/**
 * collection-detail.tsx — Individual Collection Screen (Phase 2 §5)
 *
 * Receives `type` as a URL search param. Shows a filterable 2-column grid
 * of all items in that collection with owned/locked states and action buttons.
 *
 * Usage: router.push(`/collection-detail?type=avatar`)
 */
import React, { useState, useMemo } from 'react';
import {
  Alert,
  Image,
  ImageSourcePropType,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Badge PNG images ──────────────────────────────────────────────────────────
const BADGE_IMAGES: Record<string, ImageSourcePropType> = {
  badge_bronze:   require('@/assets/badges/badge_first_win.png'),
  badge_silver:   require('@/assets/badges/badge_quiz_veteran.png'),
  badge_gold:     require('@/assets/badges/badge_perfect_game.png'),
  badge_platinum: require('@/assets/badges/badge_combo_king.png'),
  badge_diamond:  require('@/assets/badges/badge_legend.png'),
};

// ─── Avatar PNG images (for avatar collection cards) ──────────────────────────
const AVATAR_IMAGES: Record<string, ImageSourcePropType> = {
  avatar_1:  require('@/assets/avatar/Abigail.webp'),
  avatar_2:  require('@/assets/avatar/chlöe.webp'),
  avatar_3:  require('@/assets/avatar/Daveigh.webp'),
  avatar_4:  require('@/assets/avatar/Haley.webp'),
  avatar_5:  require('@/assets/avatar/Heather.webp'),
  avatar_6:  require('@/assets/avatar/kirsten.webp'),
  avatar_7:  require('@/assets/avatar/Linda.webp'),
  avatar_8:  require('@/assets/avatar/Marilyn.webp'),
  avatar_9:  require('@/assets/avatar/Patty.webp'),
  avatar_10: require('@/assets/avatar/Sissy.webp'),
};

// ─── Frame PNG images (for frame collection cards) ────────────────────────────
const FRAME_IMAGES: Record<string, ImageSourcePropType> = {
  frame_0_simple:    require('@/assets/frames/0-simple.jpg'),
  frame_1_bronze:    require('@/assets/frames/1-bronze.jpg'),
  frame_2_silver:    require('@/assets/frames/2-silver.jpg'),
  frame_3_gold:      require('@/assets/frames/3-gold.jpg'),
  frame_4_neon:      require('@/assets/frames/4-neon.jpg'),
  frame_5_galaxy:    require('@/assets/frames/5-galaxy.jpg'),
  frame_6_diamond:   require('@/assets/frames/6-diamond.jpg'),
  frame_7_fire:      require('@/assets/frames/7-fire.jpg'),
  frame_8_animated:  require('@/assets/frames/8-animated.jpg'),
  frame_9_legendary: require('@/assets/frames/9-legendary.jpg'),
};
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { ProgressBar } from '@/components/ProgressBar';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { RARITY_COLORS } from '@/constants/shopConfig';
import {
  COLLECTION_META,
  COIN_AVATARS,
  COIN_AVATAR_IDS,
  GEM_AVATARS,
  FRAMES,
  THEMES,
  ENTRANCE_EFFECTS,
  BADGES,
  TITLES,
  PARTICLES,
  getCollectionTotal,
  type CosmeticItem,
  type CosmeticType,
} from '@/constants/collections';
import { useAudio } from '@/hooks/useAudio';

// ─── Filters ──────────────────────────────────────────────────────────────────

const FILTERS = ['All', 'Owned', 'Locked', 'Rare', 'Epic', 'Legendary'] as const;
type Filter = typeof FILTERS[number];

// ─── Item resolution for each type ────────────────────────────────────────────

function getItemsForType(type: CosmeticType): CosmeticItem[] {
  switch (type) {
    case 'avatar':        return [...COIN_AVATARS, ...GEM_AVATARS]; // level/achievement-tier first, then gem-tier
    case 'frame':         return FRAMES;
    case 'theme':         return THEMES;
    case 'entranceEffect':return ENTRANCE_EFFECTS;
    case 'badge':         return BADGES;
    case 'title':         return TITLES;
    case 'particle':      return PARTICLES;
    default:              return [];
  }
}

// Unlock type label for locked items that aren't purchasable
function unlockLabel(item: CosmeticItem): string {
  switch (item.unlockType) {
    case 'level':       return `Level ${item.unlockLevel ?? '?'}`;
    case 'achievement': return '🏆 Collect 5 Avatars';
    case 'event':       return 'Event';
    case 'season':      return 'Season';
    case 'special':     return 'Default';
    default:            return 'Shop';
  }
}

// ─── Runtime item (item + ownership from store) ───────────────────────────────

interface RuntimeItem extends CosmeticItem {
  owned: boolean;
  equipped: boolean;
}

// ─── Item Card ────────────────────────────────────────────────────────────────

interface CardProps {
  item: RuntimeItem;
  balance: number;    // coins or gems balance
  onAction: (item: RuntimeItem) => void;
}

const ItemCard: React.FC<CardProps> = ({ item, balance, onAction }) => {
  const rarityColor = RARITY_COLORS[item.rarity] ?? GameColors.textSecondary;
  const shopBuyable = item.unlockType === 'shop' && item.currency !== 'free' && item.currency !== 'coins';
  const isFree      = item.unlockType === 'special' || (item.currency === 'free' && item.unlockType === 'shop');
  const canAfford   = balance >= item.price;
  const isCoinAvatar = COIN_AVATAR_IDS.includes(item.id); // level/achievement unlock — never purchasable

  // Button label
  let label: string;
  let btnVariant: 'equipped' | 'equip' | 'buy' | 'locked' | 'free';
  if (item.equipped) {
    label = 'Equipped ✓';
    btnVariant = 'equipped';
  } else if (item.owned) {
    label = 'Equip';
    btnVariant = 'equip';
  } else if (isCoinAvatar) {
    // Show the unlock requirement — not purchasable
    label = unlockLabel(item);
    btnVariant = 'locked';
  } else if (isFree) {
    label = 'Free · Claim';
    btnVariant = 'free';
  } else if (shopBuyable) {
    const cur = item.currency === 'gems' ? '💎' : '🪙';
    label = `${item.price} ${cur}`;
    btnVariant = canAfford ? 'buy' : 'locked';
  } else {
    label = unlockLabel(item);
    btnVariant = 'locked';
  }

  const btnS =
    btnVariant === 'equipped' ? styles.btnEquipped :
    btnVariant === 'equip'    ? styles.btnEquip    :
    btnVariant === 'free'     ? styles.btnFree     :
    btnVariant === 'buy'      ? styles.btnBuy      :
                                styles.btnLocked;

  const btnTS =
    btnVariant === 'equipped' ? styles.btnTEquipped :
    btnVariant === 'equip'    ? styles.btnTEquip    :
    btnVariant === 'free'     ? styles.btnTFree     :
    btnVariant === 'buy'      ? styles.btnTBuy      :
                                styles.btnTLocked;

  const pressable = btnVariant !== 'locked';

  return (
    <View style={[styles.card, { borderColor: `${rarityColor}44` }]}>
      {/* Icon area */}
      <View style={[styles.iconWrap, { backgroundColor: `${rarityColor}18` }]}>
        {BADGE_IMAGES[item.id] ? (
          <Image
            source={BADGE_IMAGES[item.id]}
            style={[styles.itemImg, { opacity: item.owned ? 1 : 0.35 }]}
            resizeMode="contain"
          />
        ) : FRAME_IMAGES[item.id] ? (
          <Image
            source={FRAME_IMAGES[item.id]}
            style={[styles.itemImgRound, { opacity: item.owned ? 1 : 0.4 }]}
            resizeMode="cover"
          />
        ) : AVATAR_IMAGES[item.id] ? (
          <Image
            source={AVATAR_IMAGES[item.id]}
            style={[styles.itemImgRound, { opacity: item.owned ? 1 : 0.4 }]}
            resizeMode="cover"
          />
        ) : (
          <Ionicons
            name={item.icon as React.ComponentProps<typeof Ionicons>['name']}
            size={28}
            color={item.owned ? rarityColor : GameColors.textSecondary}
          />
        )}
        {item.equipped && (
          <View style={styles.equippedDot}>
            <Ionicons name="checkmark" size={8} color="#000" />
          </View>
        )}
      </View>

      {/* Name */}
      <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>

      {/* Rarity */}
      <View style={[styles.rarityBadge, { backgroundColor: `${rarityColor}22` }]}>
        <Text style={[styles.rarityText, { color: rarityColor }]}>{item.rarity.toUpperCase()}</Text>
      </View>

      {/* Description */}
      <Text style={styles.cardDesc} numberOfLines={3}>{item.description ?? ''}</Text>

      {/* Action */}
      <TouchableOpacity
        style={[styles.cardBtn, btnS]}
        onPress={() => onAction(item)}
        disabled={!pressable}
        activeOpacity={0.75}
      >
        <Text style={[styles.cardBtnText, btnTS]}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CollectionDetailScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 62 : insets.top + 12;
  const bottomPad = Platform.OS === 'web' ? 28 : insets.bottom + 24;
  const { playEffect } = useAudio();

  const { type } = useLocalSearchParams<{ type: string }>();
  const cosmeticType = (type ?? 'avatar') as CosmeticType;
  const meta = COLLECTION_META.find((m) => m.type === cosmeticType)!;

  const [filter, setFilter] = useState<Filter>('All');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1400);
  };

  // ── Store ──────────────────────────────────────────────────────────────────
  const coins           = useUserStore((s) => s.coins);
  const gems            = useUserStore((s) => s.gems);
  const ownedCosmetics  = useUserStore((s) => s.ownedCosmetics);
  const equippedCosmetics = useUserStore((s) => s.equippedCosmetics);
  const buyCosmetic     = useUserStore((s) => s.buyCosmetic);
  const equipCosmetic   = useUserStore((s) => s.equipCosmetic);
  const avatars         = useUserStore((s) => s.avatars);
  const selectAvatar    = useUserStore((s) => s.selectAvatar);
  const unlockAvatar    = useUserStore((s) => s.unlockAvatar);
  const selectedAvatarId = useUserStore((s) => s.selectedAvatarId);

  // ── Build runtime items ────────────────────────────────────────────────────

  const allItems = useMemo<RuntimeItem[]>(() => {
    const base = getItemsForType(cosmeticType);
    return base.map((item) => {
      let owned = false;
      let equipped = false;
      if (cosmeticType === 'avatar') {
        const av = avatars.find((a) => a.id === item.id);
        owned   = av?.unlocked ?? ownedCosmetics[item.id] ?? false;
        equipped = selectedAvatarId === item.id;
      } else {
        owned   = ownedCosmetics[item.id] ?? item.currency === 'free';
        equipped = equippedCosmetics[cosmeticType] === item.id;
      }
      return { ...item, owned, equipped };
    });
  }, [cosmeticType, avatars, ownedCosmetics, equippedCosmetics, selectedAvatarId]);

  const displayItems = useMemo(() => {
    const key = filter.toLowerCase();
    if (key === 'all')    return allItems;
    if (key === 'owned')  return allItems.filter((i) => i.owned);
    if (key === 'locked') return allItems.filter((i) => !i.owned);
    return allItems.filter((i) => i.rarity === key);
  }, [allItems, filter]);

  const ownedCount = allItems.filter((i) => i.owned).length;
  const totalCount = getCollectionTotal(cosmeticType);
  const progress   = totalCount > 0 ? ownedCount / totalCount : 0;

  // ── Action handler ─────────────────────────────────────────────────────────

  const handleAction = (item: RuntimeItem) => {
    if (item.equipped) {
      // Unequip
      equipCosmetic(item.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showToast('Unequipped');
      return;
    }

    if (item.owned) {
      // Equip
      if (cosmeticType === 'avatar') {
        selectAvatar(item.id);
      } else {
        equipCosmetic(item.id);
      }
      playEffect('purchase');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showToast('Equipped!');
      return;
    }

    if (item.currency === 'free') {
      buyCosmetic(item.id, 0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Claimed!');
      return;
    }

    if (item.unlockType !== 'shop') {
      Alert.alert('Locked', `This item unlocks via: ${unlockLabel(item)}`);
      return;
    }

    // Purchase
    const balance = item.currency === 'gems' ? gems : coins;
    if (balance < item.price) {
      const cur = item.currency === 'gems' ? 'gems' : 'coins';
      Alert.alert('Not enough ' + cur, `You need ${item.price} ${cur} to unlock "${item.name}".`);
      return;
    }

    // Coin-tier avatars unlock through gameplay only — never purchasable
    if (COIN_AVATAR_IDS.includes(item.id)) {
      Alert.alert('Locked', `${item.name} unlocks at ${unlockLabel(item)}`);
      return;
    }

    // Generic buyCosmetic
    const ok = buyCosmetic(item.id, item.price);
    Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
    if (ok) { playEffect('purchase'); showToast(`−${item.price} ${item.currency === 'gems' ? '💎' : '🪙'}`); }
    else Alert.alert('Purchase failed', 'Something went wrong. Please try again.');
  };

  const balanceForItem = (item: RuntimeItem) =>
    item.currency === 'gems' ? gems : coins;

  return (
    <AnimatedBackground>
      {/* Toast */}
      {toast ? <Text style={styles.toast}>{toast}</Text> : null}

      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title}>{meta?.label ?? 'Collection'}</Text>
          <View style={styles.gemPill}>
            <Ionicons name="diamond-outline" size={12} color="#CE93D8" />
            <Text style={styles.gemText}>{gems}</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Ionicons
              name={meta?.icon as React.ComponentProps<typeof Ionicons>['name']}
              size={20}
              color={meta?.color}
            />
            <Text style={[styles.progressLabel, { color: meta?.color }]}>
              {ownedCount} / {totalCount} Unlocked
            </Text>
          </View>
          <ProgressBar progress={progress} height={6} color={meta?.color ?? GameColors.accentGold} />
        </View>

        {/* Filters */}
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

        {/* Grid */}
        {displayItems.length > 0 ? (
          <View style={styles.grid}>
            {displayItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                balance={balanceForItem(item)}
                onAction={handleAction}
              />
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={40} color={GameColors.textSecondary} />
            <Text style={styles.emptyText}>No items match this filter</Text>
          </View>
        )}
      </ScrollView>
    </AnimatedBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { paddingHorizontal: 18, gap: 14 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:  { ...Typography.header, color: GameColors.textWhite, fontSize: 24 },
  gemPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(206,147,216,0.15)', borderWidth: 1, borderColor: 'rgba(206,147,216,0.35)' },
  gemText: { color: '#CE93D8', fontFamily: 'Inter_700Bold', fontSize: 12 },

  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: GameColors.border,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressLabel: { fontFamily: 'Inter_700Bold', fontSize: 14 },

  filterBar:    { flexGrow: 0 },
  filterContent:{ flexDirection: 'row', gap: 8, paddingRight: 4 },
  chip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: GameColors.border, backgroundColor: 'rgba(255,255,255,0.04)' },
  chipActive:   { backgroundColor: 'rgba(255,215,0,0.15)', borderColor: 'rgba(255,215,0,0.5)' },
  chipText:     { color: GameColors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  chipTextActive:{ color: GameColors.accentGold, fontFamily: 'Inter_700Bold' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

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
  iconWrap: {
    width: 58, height: 58, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', marginBottom: 2,
  },
  itemImg:      { width: 42, height: 42 },
  itemImgRound: { width: 50, height: 50, borderRadius: 25 },
  equippedDot: {
    position: 'absolute', bottom: -2, right: -2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: GameColors.accentGreen,
    alignItems: 'center', justifyContent: 'center',
  },
  cardName: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 12, textAlign: 'center' },
  rarityBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  rarityText:  { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.8 },
  cardDesc:    { color: GameColors.textSecondary, fontSize: 10, textAlign: 'center', lineHeight: 14, minHeight: 42, fontFamily: 'Inter_400Regular' },

  cardBtn:     { width: '100%', paddingVertical: 9, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  btnBuy:      { backgroundColor: GameColors.accentGold },
  btnFree:     { backgroundColor: GameColors.accentGreen },
  btnEquip:    { backgroundColor: 'rgba(255,215,0,0.18)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.5)' },
  btnEquipped: { backgroundColor: 'rgba(0,230,118,0.15)', borderWidth: 1, borderColor: 'rgba(0,230,118,0.5)' },
  btnLocked:   { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: GameColors.border },
  cardBtnText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  btnTBuy:     { color: GameColors.backgroundPrimary },
  btnTFree:    { color: GameColors.backgroundPrimary },
  btnTEquip:   { color: GameColors.accentGold },
  btnTEquipped:{ color: GameColors.accentGreen },
  btnTLocked:  { color: GameColors.textSecondary },

  empty: { paddingVertical: 48, alignItems: 'center', gap: 10 },
  emptyText: { color: GameColors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 14 },

  toast: {
    position: 'absolute', top: 108, alignSelf: 'center', zIndex: 10,
    color: GameColors.accentGreen, fontFamily: 'Inter_700Bold', fontSize: 17,
    textShadowColor: 'rgba(0,230,118,0.4)', textShadowRadius: 8,
  },
});
