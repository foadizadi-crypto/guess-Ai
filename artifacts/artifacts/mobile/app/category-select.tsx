import React, { useState } from 'react';
import { Alert, StyleSheet, View, Text, TouchableOpacity, FlatList, Platform, ListRenderItem, Modal } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { hapticsService } from '@/services/HapticsService';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { GradientButton } from '@/components/GradientButton';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { ROUTES } from '@/navigation/routes';
import type { Category } from '@/types';
import { useRTL } from '@/hooks/useRTL';
import { CATEGORY_LAYOUT, categoryUnlockLevel, isCategoryUnlocked } from '@/constants/categories';
import { STAMINA_PER_GAME } from '@/constants/economy';
import { isDifficultyOpen } from '@/shared/difficulty';

interface CatItem {
  key: Category;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const CATEGORY_TILES: Record<Category, Omit<CatItem, 'key'>> = {
  animals: { label: 'Animals', icon: 'paw-outline', color: GameColors.accentOrange },
  nature: { label: 'Nature', icon: 'leaf-outline', color: GameColors.accentGreen },
  food: { label: 'Food', icon: 'pizza-outline', color: '#FF6584' },
  landmarks: { label: 'Landmarks', icon: 'business-outline', color: '#64B5F6' },
  movies: { label: 'Movies', icon: 'film-outline', color: '#CE93D8' },
  sports: { label: 'Sports', icon: 'football-outline', color: GameColors.accentGold },
  technology: { label: 'Technology', icon: 'hardware-chip-outline', color: '#80DEEA' },
  art: { label: 'Art', icon: 'color-palette-outline', color: '#F48FB1' },
  vehicles: { label: 'Vehicles', icon: 'car-outline', color: '#B39DDB' },
  celebrities: { label: 'Celebrities', icon: 'star-outline', color: '#FF8A65' },
  history: { label: 'History', icon: 'time-outline', color: '#A5D6A7' },
  space: { label: 'Space', icon: 'planet-outline', color: '#90CAF9' },
  cities: { label: 'Cities', icon: 'business-outline', color: '#81D4FA' },
  music: { label: 'Music', icon: 'musical-notes-outline', color: '#F48FB1' },
  science: { label: 'Science', icon: 'flask-outline', color: '#80CBC4' },
  speed_card: { label: 'Speed Card', icon: 'albums-outline', color: '#FFD54F' },
  count_quick: { label: 'Count Quick', icon: 'apps-outline', color: '#FF4D6D' },
  lost_item: { label: 'Lost Item', icon: 'images-outline', color: '#FF7043' },
  flip_mind: { label: 'Flip Mind', icon: 'swap-horizontal-outline', color: '#7C4DFF' },
  gold_rush: { label: 'Gold Rush', icon: 'diamond-outline', color: '#FFC107' },
  tick_lock: { label: 'Tick Lock', icon: 'timer-outline', color: '#4DD0E1' },
  twin_link: { label: 'Twin Link', icon: 'copy-outline', color: '#81C784' },
  neon_flash: { label: 'Neon Flash', icon: 'flash-outline', color: '#EA80FC' },
  glitch_spy: { label: 'Glitch Spy', icon: 'search-outline', color: '#90A4AE' },
  color_trap: { label: 'Color Trap', icon: 'color-filter-outline', color: '#26A69A' },
};

const CATEGORIES: CatItem[] = CATEGORY_LAYOUT.map((key) => ({ key, ...CATEGORY_TILES[key] }));

export default function CategorySelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { textAlign } = useRTL();
  const setCategory = useGameStore((s) => s.setCategory);
  const selectedCategory = useGameStore((s) => s.selectedCategory);
  const selectedDifficulty = useGameStore((s) => s.selectedDifficulty);
  const startSession = useGameStore((s) => s.startSession);
  const playerLevel = useUserStore((s) => s.level);
  const spendEnergy = useUserStore((s) => s.spendEnergy);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const handleSelect = (cat: Category) => {
    if (!isCategoryUnlocked(cat, playerLevel)) {
      hapticsService.notification(0);
      Alert.alert(
        'Category locked',
        `Unlocks at level ${categoryUnlockLevel(cat)}. Keep playing to reach it.`,
      );
      return;
    }
    hapticsService.impact(0);
    setCategory(cat);
  };

  const handlePlay = () => {
    if (!isCategoryUnlocked(selectedCategory, playerLevel)) return;
    if (!isDifficultyOpen(selectedDifficulty)) return;
    if (!spendEnergy()) {
      Alert.alert(
        'Not enough stamina',
        `Each round costs ${STAMINA_PER_GAME} stamina. Watch a rewarded ad on the lobby AdMob button to refill.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Lobby', onPress: () => router.replace(ROUTES.LOBBY) },
        ],
      );
      return;
    }
    startSession(selectedDifficulty, selectedCategory);
    setConfirmVisible(false);
    const independentRoutes: Partial<Record<Category, string>> = {
      speed_card: ROUTES.SPEED_CARD,
      count_quick: ROUTES.COUNT_QUICK,
      lost_item: ROUTES.LOST_ITEM,
      flip_mind: ROUTES.FLIP_MIND,
      gold_rush: ROUTES.GOLD_RUSH,
      tick_lock: ROUTES.TICK_LOCK,
      twin_link: ROUTES.TWIN_LINK,
      neon_flash: ROUTES.NEON_FLASH,
      glitch_spy: ROUTES.GLITCH_SPY,
      color_trap: ROUTES.COLOR_TRAP,
    };
    const nextRoute = independentRoutes[selectedCategory] ?? ROUTES.GAME;
    router.replace(nextRoute as Href);
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const renderItem: ListRenderItem<CatItem> = ({ item, index }) => {
    const selected = selectedCategory === item.key;
    const locked = !isCategoryUnlocked(item.key, playerLevel);
    const slot = index + 1;
    return (
      <TouchableOpacity
        style={[
          styles.catCard,
          { borderColor: selected && !locked ? item.color : GameColors.border },
          selected && !locked && { backgroundColor: `${item.color}18` },
          locked && styles.catLocked,
        ]}
        onPress={() => handleSelect(item.key)}
        activeOpacity={0.8}
      >
        <Text style={[styles.slot, { color: locked ? GameColors.textSecondary : item.color }]}>{slot}</Text>
        <Ionicons name={item.icon} size={32} color={locked ? GameColors.textSecondary : selected ? item.color : GameColors.textSecondary} />
        <Text style={[styles.catLabel, { color: locked ? GameColors.textSecondary : selected ? item.color : GameColors.textSecondary }]}>
          {item.label}
        </Text>
        {locked ? (
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={12} color={GameColors.textWhite} />
            <Text style={styles.lockText}>Lv {categoryUnlockLevel(item.key)}</Text>
          </View>
        ) : selected ? (
          <View style={[styles.badge, { backgroundColor: item.color }]}>
            <Ionicons name="checkmark" size={10} color={GameColors.backgroundPrimary} />
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: topPad + 16, paddingBottom: botPad + 24 }]}>
        <View style={styles.header}>
          <BackButton />
          <Text style={[styles.title, { textAlign }]}>Pick a Category</Text>
          <View style={styles.placeholder} />
        </View>

        <Text style={[styles.sub, { textAlign }]}>Animals, Nature, and Food start unlocked. Independent games are categories 16–25.</Text>

        <FlatList
          style={styles.list}
          data={CATEGORIES}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator
          initialNumToRender={CATEGORIES.length}
          windowSize={12}
          removeClippedSubviews={false}
        />

          <GradientButton
          title="Start Game"
            onPress={() => setConfirmVisible(true)}
          testID="start-game-button"
        />
      </View>
      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Ionicons name="eye-outline" size={42} color={GameColors.accentGold} />
            <Text style={styles.modalTitle}>Start Game?</Text>
            <Text style={styles.modalCopy}>
              {selectedCategory === 'speed_card'
                ? `5 cards • Speed Card\n${selectedDifficulty} mode`
                : selectedCategory === 'count_quick'
                  ? `5 questions • Count Quick\n${selectedDifficulty} mode`
                  : selectedCategory === 'lost_item'
                    ? `5 questions • Lost Item\n${selectedDifficulty} mode`
                    : selectedCategory === 'flip_mind'
                      ? `Flip Mind\n${selectedDifficulty} mode`
                      : selectedCategory === 'gold_rush'
                        ? `Gold Rush\n${selectedDifficulty} mode`
                        : selectedCategory === 'tick_lock'
                          ? `Tick Lock\n${selectedDifficulty} mode`
                          : selectedCategory === 'twin_link'
                            ? `Twin Link\n${selectedDifficulty} mode`
                            : selectedCategory === 'neon_flash'
                              ? `Neon Flash\n${selectedDifficulty} mode`
                              : selectedCategory === 'glitch_spy'
                                ? `Glitch Spy\n${selectedDifficulty} mode`
                                : selectedCategory === 'color_trap'
                                  ? `Color Trap\n${selectedDifficulty} mode`
                                  : `20 questions • 120 seconds\n${selectedCategory} • ${selectedDifficulty} mode`}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmVisible(false)}>
                <Text style={styles.cancelText}>Not yet</Text>
              </TouchableOpacity>
              <GradientButton title="Let's Play" onPress={handlePlay} style={styles.confirmButton} />
            </View>
          </View>
        </View>
      </Modal>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, gap: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholder: { width: 44 },
  title: {
    ...Typography.semibold,
    color: GameColors.textWhite,
    fontFamily: 'Inter_700Bold',
  },
  sub: { ...Typography.caption, color: GameColors.textSecondary },
  list: { flex: 1 },
  grid: { paddingBottom: 28 },
  row: { gap: 12, marginBottom: 12 },
  catCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    position: 'relative',
  },
  catLabel: {
    ...Typography.caption,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  slot: {
    position: 'absolute',
    top: 8,
    left: 8,
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  catLocked: { opacity: 0.55 },
  lockBadge: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  lockText: { color: GameColors.textWhite, fontSize: 10, fontFamily: 'Inter_700Bold' },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', borderRadius: 24, padding: 24, alignItems: 'center', backgroundColor: GameColors.card, borderWidth: 1, borderColor: GameColors.cardBorder, gap: 14 },
  modalTitle: { ...Typography.header, color: GameColors.textWhite, fontSize: 28 },
  modalCopy: { ...Typography.caption, color: GameColors.textSecondary, textAlign: 'center', textTransform: 'capitalize' },
  modalActions: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', marginTop: 6 },
  cancelButton: { flex: 1, paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: GameColors.border, alignItems: 'center' },
  cancelText: { ...Typography.small, color: GameColors.textWhite, fontFamily: 'Inter_600SemiBold' },
  confirmButton: { flex: 1 },
});
