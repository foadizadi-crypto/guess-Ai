import React, { memo, useState } from 'react';
import {
  Alert,
  LayoutChangeEvent,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { hapticsService } from '@/services/HapticsService';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { GradientButton } from '@/components/GradientButton';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import {
  PlayColumn,
  TILE_GAP,
  TILE_PAD_H,
  TILE_PAD_V,
  TILE_TITLE_LINES,
  categoryColumnCount,
  categoryTileSize,
  layoutStyles,
  playColumnMaxWidth,
  usePopupChromeSize,
} from '@/theme/webLayout';
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

function startCopy(category: Category, difficulty: string): string {
  if (category === 'speed_card') return `5 cards • Speed Card\n${difficulty} mode`;
  if (category === 'count_quick') return `5 questions • Count Quick\n${difficulty} mode`;
  if (category === 'lost_item') return `5 questions • Lost Item\n${difficulty} mode`;
  if (category === 'flip_mind') return `Flip Mind\n${difficulty} mode`;
  if (category === 'gold_rush') return `Gold Rush\n${difficulty} mode`;
  if (category === 'tick_lock') return `Tick Lock\n${difficulty} mode`;
  if (category === 'twin_link') return `Twin Link\n${difficulty} mode`;
  if (category === 'neon_flash') return `Neon Flash\n${difficulty} mode`;
  if (category === 'glitch_spy') return `Glitch Spy\n${difficulty} mode`;
  if (category === 'color_trap') return `Color Trap\n${difficulty} mode`;
  return `20 questions • 120 seconds\n${category} • ${difficulty} mode`;
}

const CategoryTile = memo(function CategoryTile({
  item,
  index,
  size,
  columns,
  selected,
  locked,
  onPress,
}: {
  item: CatItem;
  index: number;
  size: number;
  columns: number;
  selected: boolean;
  locked: boolean;
  onPress: () => void;
}) {
  const lastInRow = (index + 1) % columns === 0;
  const color = locked ? GameColors.textSecondary : selected ? item.color : GameColors.textSecondary;
  return (
    <TouchableOpacity
      style={[
        styles.catCard,
        {
          width: size,
          height: size,
          marginRight: lastInRow ? 0 : TILE_GAP,
          marginBottom: TILE_GAP,
          borderColor: selected && !locked ? item.color : GameColors.border,
        },
        selected && !locked && { backgroundColor: `${item.color}18` },
        locked && styles.catLocked,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.slot, { color }]}>{index + 1}</Text>
      <Ionicons name={item.icon} size={32} color={color} />
      <Text
        style={[layoutStyles.tileTitle, { color }]}
        numberOfLines={TILE_TITLE_LINES}
        ellipsizeMode="tail"
      >
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
});

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
  const popupH = usePopupChromeSize();
  const { width: windowWidth } = useWindowDimensions();
  const [gridW, setGridW] = useState(0);

  const onGridLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setGridW((prev) => (prev === next ? prev : next));
  };

  const innerWidth = gridW > 0 ? gridW : Math.max(0, playColumnMaxWidth(windowWidth) - 40);
  const columns = categoryColumnCount(innerWidth);
  const tileSize = categoryTileSize(innerWidth, columns);

  return (
    <AnimatedBackground>
      <PlayColumn>
        <View style={[styles.container, { paddingTop: topPad + 16, paddingBottom: botPad + 24 }]}>
          <View style={styles.header}>
            <BackButton />
            <Text style={[styles.title, { textAlign }]}>Pick a Category</Text>
            <View style={styles.placeholder} />
          </View>

          <Text style={[styles.sub, { textAlign }]}>
            Animals, Nature, and Food start unlocked. Independent games are categories 16–25.
          </Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={[styles.grid, Platform.OS === 'web' && styles.gridWeb]}
            showsVerticalScrollIndicator
          >
            <View style={styles.gridWrap} onLayout={onGridLayout}>
              {tileSize > 0
                ? CATEGORIES.map((item, index) => (
                    <CategoryTile
                      key={item.key}
                      item={item}
                      index={index}
                      size={tileSize}
                      columns={columns}
                      selected={selectedCategory === item.key}
                      locked={!isCategoryUnlocked(item.key, playerLevel)}
                      onPress={() => handleSelect(item.key)}
                    />
                  ))
                : null}
            </View>
          </ScrollView>

          <GradientButton
            title="Start Game"
            onPress={() => {
              if (selectedCategory === 'gold_rush') handlePlay();
              else setConfirmVisible(true);
            }}
            testID="start-game-button"
          />
        </View>
      </PlayColumn>
      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={layoutStyles.popupBackdrop}>
          <View style={[layoutStyles.popupCard, { height: popupH }]}>
            <Ionicons name="eye-outline" size={42} color={GameColors.accentGold} />
            <Text style={layoutStyles.popupTitle}>Start Game?</Text>
            <ScrollView style={layoutStyles.popupScroller} contentContainerStyle={layoutStyles.popupScrollContent}>
              <Text style={[layoutStyles.popupBody, styles.modalCopy]}>{startCopy(selectedCategory, selectedDifficulty)}</Text>
            </ScrollView>
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
  gridWeb: { paddingRight: 14 },
  gridWrap: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  catCard: {
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: TILE_PAD_H,
    paddingVertical: TILE_PAD_V,
    backgroundColor: 'rgba(255,255,255,0.04)',
    position: 'relative',
    overflow: 'hidden',
    flexGrow: 0,
    flexShrink: 0,
  },
  slot: {
    position: 'absolute',
    top: 8,
    left: 8,
    fontSize: 11,
    lineHeight: 14,
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
  modalCopy: { textTransform: 'capitalize' },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginTop: 6,
    flexShrink: 0,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GameColors.border,
    alignItems: 'center',
  },
  cancelText: { ...Typography.small, color: GameColors.textWhite, fontFamily: 'Inter_600SemiBold' },
  confirmButton: { flex: 1 },
});
