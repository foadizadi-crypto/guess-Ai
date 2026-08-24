import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Platform, ListRenderItem, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { hapticsService } from '@/services/HapticsService';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { GradientButton } from '@/components/GradientButton';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useGameStore } from '@/store/gameStore';
import { ROUTES } from '@/navigation/routes';
import type { Category } from '@/types';
import { useRTL } from '@/hooks/useRTL';

interface CatItem {
  key: Category;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const CATEGORIES: CatItem[] = [
  { key: 'animals', label: 'Animals', icon: 'paw-outline', color: GameColors.accentOrange },
  { key: 'nature', label: 'Nature', icon: 'leaf-outline', color: GameColors.accentGreen },
  { key: 'food', label: 'Food', icon: 'pizza-outline', color: '#FF6584' },
  { key: 'landmarks', label: 'Landmarks', icon: 'business-outline', color: '#64B5F6' },
  { key: 'movies', label: 'Movies', icon: 'film-outline', color: '#CE93D8' },
  { key: 'sports', label: 'Sports', icon: 'football-outline', color: GameColors.accentGold },
  { key: 'technology', label: 'Technology', icon: 'hardware-chip-outline', color: '#80DEEA' },
  { key: 'art', label: 'Art', icon: 'color-palette-outline', color: '#F48FB1' },
  { key: 'vehicles', label: 'Vehicles', icon: 'car-outline', color: '#B39DDB' },
  { key: 'celebrities', label: 'Celebrities', icon: 'star-outline', color: '#FF8A65' },
  { key: 'history', label: 'History', icon: 'time-outline', color: '#A5D6A7' },
  { key: 'space', label: 'Space', icon: 'planet-outline', color: '#90CAF9' },
];

export default function CategorySelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { textAlign } = useRTL();
  const setCategory = useGameStore((s) => s.setCategory);
  const selectedCategory = useGameStore((s) => s.selectedCategory);
  const selectedDifficulty = useGameStore((s) => s.selectedDifficulty);
  const startSession = useGameStore((s) => s.startSession);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const handleSelect = (cat: Category) => {
    hapticsService.impact(0);
    setCategory(cat);
  };

  const handlePlay = () => {
    startSession(selectedDifficulty, selectedCategory);
    setConfirmVisible(false);
    router.replace(ROUTES.GAME);
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const renderItem: ListRenderItem<CatItem> = ({ item }) => {
    const selected = selectedCategory === item.key;
    return (
      <TouchableOpacity
        style={[
          styles.catCard,
          { borderColor: selected ? item.color : GameColors.border },
          selected && { backgroundColor: `${item.color}18` },
        ]}
        onPress={() => handleSelect(item.key)}
        activeOpacity={0.8}
      >
        <Ionicons name={item.icon} size={32} color={selected ? item.color : GameColors.textSecondary} />
        <Text style={[styles.catLabel, { color: selected ? item.color : GameColors.textSecondary }]}>
          {item.label}
        </Text>
        {selected && (
          <View style={[styles.badge, { backgroundColor: item.color }]}>
            <Ionicons name="checkmark" size={10} color={GameColors.backgroundPrimary} />
          </View>
        )}
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

        <Text style={[styles.sub, { textAlign }]}>What would you like to guess?</Text>

        <FlatList
          data={CATEGORIES}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          scrollEnabled
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
            <Text style={styles.modalCopy}>20 questions • 120 seconds{'\n'}{selectedCategory} • {selectedDifficulty} mode</Text>
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
  grid: { gap: 12 },
  row: { gap: 12 },
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
