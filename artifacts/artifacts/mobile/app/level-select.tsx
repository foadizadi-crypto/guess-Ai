import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { hapticsService } from '@/services/HapticsService';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useGameStore } from '@/store/gameStore';
import { ROUTES } from '@/navigation/routes';
import type { Difficulty } from '@/types';
import { useRTL } from '@/hooks/useRTL';
import { GAME_CONSTANTS } from '@/constants';
import { DIFFICULTY_CONFIG } from '@/gameEngine';

interface LevelCard {
  difficulty: Difficulty;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  blur: string;
  hints: string;
  multiplier: string;
}

const LEVELS: LevelCard[] = [
  {
    difficulty: 'easy',
    label: 'Easy',
    icon: 'leaf-outline',
    color: GameColors.accentGreen,
    blur: '50% Blur',
    hints: '2 Hints',
    multiplier: '1x Score',
  },
  {
    difficulty: 'medium',
    label: 'Medium',
    icon: 'flame-outline',
    color: GameColors.accentGold,
    blur: '80% Blur',
    hints: '1 Hint',
    multiplier: '2x Score',
  },
  {
    difficulty: 'hard',
    label: 'Hard',
    icon: 'skull-outline',
    color: GameColors.accentRed,
    blur: '100% Blur',
    hints: 'No hints',
    multiplier: '3x Score',
  },
];

export default function LevelSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { textAlign } = useRTL();
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const selectedDifficulty = useGameStore((s) => s.selectedDifficulty);

  const handleSelect = (difficulty: Difficulty) => {
    hapticsService.impact(1);
    setDifficulty(difficulty);
    router.push(ROUTES.CATEGORY_SELECT);
  };

  const handleNext = () => {
    router.push(ROUTES.CATEGORY_SELECT);
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: topPad + 16, paddingBottom: botPad + 24 }]}>
        <View style={styles.header}>
          <BackButton />
          <Text style={[styles.title, { textAlign }]}>Select Difficulty</Text>
          <View style={styles.placeholder} />
        </View>

        <Text style={[styles.sub, { textAlign }]}>
          Choose how challenging you want it to be
        </Text>

        <ScrollView style={styles.cards} contentContainerStyle={styles.cardContent} showsVerticalScrollIndicator={false}>
          {LEVELS.map((lvl) => {
            const selected = selectedDifficulty === lvl.difficulty;
            return (
              <TouchableOpacity
                key={lvl.difficulty}
                style={[
                  styles.card,
                  { borderColor: selected ? lvl.color : GameColors.border },
                  selected && { backgroundColor: `${lvl.color}15` },
                ]}
                onPress={() => handleSelect(lvl.difficulty)}
                activeOpacity={0.8}
              >
                <View style={[styles.cardIcon, { borderColor: lvl.color }]}>
                  <Ionicons name={lvl.icon} size={32} color={lvl.color} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardLabel, { color: lvl.color }]}>{lvl.label}</Text>
                  <View style={styles.metaGrid}>
                    <Text style={styles.cardMeta}>{lvl.blur}</Text>
                    <Text style={styles.cardMeta}>{lvl.hints}</Text>
                    <Text style={styles.cardMeta}>{lvl.multiplier}</Text>
                  </View>
                  <Text style={styles.unlockText}>Unlocked</Text>
                </View>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={24} color={lvl.color} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={[styles.nextBtn, { borderColor: GameColors.accentGold }]}
          onPress={handleNext}
          activeOpacity={0.8}
          testID="next-button"
        >
          <Text style={styles.nextText}>Next: Choose Category</Text>
          <Ionicons name="arrow-forward" size={20} color={GameColors.accentGold} />
        </TouchableOpacity>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, gap: 24 },
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
  cards: { flex: 1 },
  cardContent: { gap: 12, paddingBottom: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 16,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cardInfo: { flex: 1, gap: 4 },
  cardLabel: { ...Typography.semibold, fontFamily: 'Inter_700Bold' },
  lockedCard: { opacity: 0.48 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  cardMeta: { ...Typography.small, color: GameColors.textSecondary },
  unlockText: { ...Typography.small, color: GameColors.textSecondary, marginTop: 2 },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    gap: 8,
  },
  nextText: {
    ...Typography.caption,
    color: GameColors.accentGold,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
});
