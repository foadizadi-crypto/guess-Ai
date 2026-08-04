/**
 * collections.tsx — Collections Hub Screen (Phase 2 §5)
 *
 * Shows all 7 cosmetic collection types as cards with owned/total progress.
 * Tapping any card opens the collection-detail screen for that type.
 */
import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { CoinDisplay } from '@/components/CoinDisplay';
import { ProgressBar } from '@/components/ProgressBar';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { ROUTES } from '@/navigation/routes';
import {
  COLLECTION_META,
  GEM_AVATARS,
  FRAMES,
  THEMES,
  ENTRANCE_EFFECTS,
  BADGES,
  TITLES,
  PARTICLES,
  COIN_AVATAR_IDS,
  getCollectionTotal,
  type CosmeticType,
} from '@/constants/collections';
import { DEFAULT_AVATARS } from '@/constants';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useCollectionProgress(
  type: CosmeticType,
  ownedCosmetics: Record<string, boolean>,
  avatarUnlocked: (id: string) => boolean,
): { owned: number; total: number } {
  return useMemo(() => {
    const total = getCollectionTotal(type);
    let owned = 0;
    if (type === 'avatar') {
      // Coin-tier avatars
      owned += COIN_AVATAR_IDS.filter((id) => avatarUnlocked(id)).length;
      // Gem-tier avatars
      owned += GEM_AVATARS.filter((av) => ownedCosmetics[av.id]).length;
    } else {
      const items = {
        frame: FRAMES,
        theme: THEMES,
        entranceEffect: ENTRANCE_EFFECTS,
        badge: BADGES,
        title: TITLES,
        particle: PARTICLES,
      }[type] ?? [];
      owned = items.filter((i) => ownedCosmetics[i.id] || i.currency === 'free').length;
    }
    return { owned, total };
  }, [type, ownedCosmetics, avatarUnlocked]);
}

// ─── Collection card ──────────────────────────────────────────────────────────

interface CollectionCardProps {
  type: CosmeticType;
  label: string;
  icon: string;
  color: string;
  description: string;
  owned: number;
  total: number;
  delay: number;
  onPress: () => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  type, label, icon, color, description, owned, total, delay, onPress,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const progress = total > 0 ? owned / total : 0;

  return (
    <Animated.View style={[styles.cardWrap, animStyle]}>
      <TouchableOpacity style={[styles.card, { borderColor: `${color}44` }]} onPress={onPress} activeOpacity={0.8}>
        {/* Color glow */}
        <View style={[styles.cardGlow, { backgroundColor: `${color}12` }]} />

        {/* Icon */}
        <View style={[styles.cardIcon, { backgroundColor: `${color}22` }]}>
          <Ionicons
            name={icon as React.ComponentProps<typeof Ionicons>['name']}
            size={28}
            color={color}
          />
        </View>

        {/* Text */}
        <View style={styles.cardBody}>
          <Text style={styles.cardLabel}>{label}</Text>
          <Text style={styles.cardDesc} numberOfLines={1}>{description}</Text>

          {/* Progress */}
          <View style={styles.progressRow}>
            <ProgressBar progress={progress} height={4} color={color} style={{ flex: 1 }} />
            <Text style={[styles.progressText, { color }]}>{owned}/{total}</Text>
          </View>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={18} color={GameColors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CollectionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === 'web' ? 62 : insets.top + 12;
  const bottomPad = Platform.OS === 'web' ? 28 : insets.bottom + 24;

  const coins          = useUserStore((s) => s.coins);
  const gems           = useUserStore((s) => s.gems);
  const ownedCosmetics = useUserStore((s) => s.ownedCosmetics);
  const avatars        = useUserStore((s) => s.avatars);

  const avatarUnlocked = useMemo(
    () => (id: string) => avatars.find((a) => a.id === id)?.unlocked ?? false,
    [avatars],
  );

  const navigateTo = (type: CosmeticType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`${ROUTES.COLLECTION_DETAIL}?type=${type}` as never);
  };

  // Compute progress for each collection type
  const progressMap = useMemo(() => {
    const map: Record<CosmeticType, { owned: number; total: number }> = {} as never;
    for (const meta of COLLECTION_META) {
      const total = getCollectionTotal(meta.type);
      let owned = 0;
      if (meta.type === 'avatar') {
        owned += COIN_AVATAR_IDS.filter((id) => avatarUnlocked(id)).length;
        owned += GEM_AVATARS.filter((av) => ownedCosmetics[av.id]).length;
      } else {
        const items = {
          frame: FRAMES,
          theme: THEMES,
          entranceEffect: ENTRANCE_EFFECTS,
          badge: BADGES,
          title: TITLES,
          particle: PARTICLES,
        }[meta.type] ?? [];
        owned = items.filter((i) => ownedCosmetics[i.id] || i.currency === 'free').length;
      }
      map[meta.type] = { owned, total };
    }
    return map;
  }, [ownedCosmetics, avatarUnlocked]);

  const totalOwned = Object.values(progressMap).reduce((sum, p) => sum + p.owned, 0);
  const totalItems = Object.values(progressMap).reduce((sum, p) => sum + p.total, 0);

  return (
    <AnimatedBackground>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title}>Collections</Text>
          <View style={styles.currencyRow}>
            <CoinDisplay amount={coins} size="small" />
            <View style={styles.gemPill}>
              <Ionicons name="diamond-outline" size={12} color="#CE93D8" />
              <Text style={styles.gemText}>{gems}</Text>
            </View>
          </View>
        </View>

        {/* Overall progress banner */}
        <View style={styles.banner}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerTitle}>Total Collection</Text>
            <Text style={styles.bannerSub}>{totalOwned} of {totalItems} items unlocked</Text>
          </View>
          <View style={styles.bannerRight}>
            <Text style={styles.bannerPct}>{Math.round((totalOwned / totalItems) * 100)}%</Text>
          </View>
        </View>
        <ProgressBar
          progress={totalOwned / totalItems}
          height={6}
          color={GameColors.accentGold}
          style={{ marginBottom: 8 }}
        />

        {/* Collection cards */}
        <View style={styles.cards}>
          {COLLECTION_META.map((meta, i) => (
            <CollectionCard
              key={meta.type}
              type={meta.type}
              label={meta.label}
              icon={meta.icon}
              color={meta.color}
              description={meta.description}
              owned={progressMap[meta.type].owned}
              total={progressMap[meta.type].total}
              delay={i * 60}
              onPress={() => navigateTo(meta.type)}
            />
          ))}
        </View>
      </ScrollView>
    </AnimatedBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { paddingHorizontal: 18, gap: 14 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:  { ...Typography.header, color: GameColors.textWhite, fontSize: 26 },
  currencyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gemPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(206,147,216,0.15)', borderWidth: 1, borderColor: 'rgba(206,147,216,0.35)' },
  gemText: { color: '#CE93D8', fontFamily: 'Inter_700Bold', fontSize: 12 },

  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,215,0,0.07)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)' },
  bannerLeft: { gap: 3 },
  bannerTitle: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 15 },
  bannerSub:   { color: GameColors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 12 },
  bannerRight: {},
  bannerPct:   { color: GameColors.accentGold, fontFamily: 'Inter_700Bold', fontSize: 28 },

  cards: { gap: 10 },

  cardWrap: {},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
    position: 'relative',
  },
  cardGlow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  cardIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 4 },
  cardLabel: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 15 },
  cardDesc:  { color: GameColors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 11 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  progressText: { fontFamily: 'Inter_700Bold', fontSize: 11, minWidth: 36, textAlign: 'right' },
});
