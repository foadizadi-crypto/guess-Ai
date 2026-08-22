import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { ACHIEVEMENTS } from '@/constants/achievements';

export default function AchievementsScreen() {
  const insets    = useSafeAreaInsets();
  const achievements = useUserStore((s) => s.achievements);
  const clearBadge   = useUserStore((s) => s.clearNewAchievementBadge);

  // Clear the red-dot badge when user opens this screen
  React.useEffect(() => { clearBadge(); }, [clearBadge]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top + 12;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom + 24;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <AnimatedBackground
      backgroundImage={require('../assets/background/achievements_BG.png')}
      overlayOpacity={0.48}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title}>Achievements</Text>
          <View style={styles.spacer} />
        </View>

        {/* Progress summary */}
        <View style={styles.progressCard}>
          <View style={styles.progressLeft}>
            <Text style={styles.progressCount}>{unlockedCount}</Text>
            <Text style={styles.progressTotal}>/ {ACHIEVEMENTS.length}</Text>
          </View>
          <View style={styles.progressRight}>
            <Text style={styles.progressLabel}>Achievements unlocked</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Achievement grid */}
        <View style={styles.grid}>
          {ACHIEVEMENTS.map((def) => {
            const stored    = achievements.find((a) => a.id === def.id);
            const isUnlocked = stored?.unlocked ?? false;
            const unlockedAt = stored?.unlockedAt
              ? new Date(stored.unlockedAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })
              : null;

            return (
              <View
                key={def.id}
                style={[
                  styles.card,
                  isUnlocked
                    ? [styles.cardUnlocked, { borderColor: `${def.color}55` }]
                    : styles.cardLocked,
                ]}
              >
                {/* Icon */}
                <View
                  style={[
                    styles.iconWrap,
                    isUnlocked
                      ? { backgroundColor: `${def.color}22`, borderColor: `${def.color}55` }
                      : styles.iconWrapLocked,
                  ]}
                >
                  <Ionicons
                    name={def.icon as React.ComponentProps<typeof Ionicons>['name']}
                    size={26}
                    color={isUnlocked ? def.color : GameColors.textSecondary}
                  />
                </View>

                {/* Name + description */}
                <Text
                  style={[styles.name, !isUnlocked && styles.nameLocked]}
                  numberOfLines={2}
                >
                  {def.title}
                </Text>
                <Text style={styles.desc} numberOfLines={2}>
                  {def.description}
                </Text>

                {/* Rewards */}
                <View style={styles.rewards}>
                  <Text style={[styles.reward, !isUnlocked && styles.rewardLocked]}>
                    🪙 {def.rewardCoins}
                  </Text>
                </View>

                {/* Status */}
                {isUnlocked ? (
                  <View style={[styles.badge, { backgroundColor: `${def.color}22` }]}>
                    <Ionicons name="checkmark-circle" size={11} color={def.color} />
                    <Text style={[styles.badgeText, { color: def.color }]}>
                      {unlockedAt ?? 'Unlocked'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.badge}>
                    <Ionicons name="lock-closed" size={11} color={GameColors.textSecondary} />
                    <Text style={styles.badgeText}>Locked</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 18, gap: 18 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spacer: { width: 44 },
  title: {
    ...Typography.semibold,
    color: GameColors.textWhite,
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
  },

  // Progress summary card
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,215,0,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  progressLeft: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  progressCount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    color: GameColors.accentGold,
    lineHeight: 40,
  },
  progressTotal: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: GameColors.textSecondary,
  },
  progressRight: { flex: 1, gap: 8 },
  progressLabel: {
    ...Typography.small,
    color: GameColors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: GameColors.accentGold,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // Achievement cards
  card: {
    width: '47%',
    flexGrow: 1,
    flexBasis: '45%',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 5,
    alignItems: 'center',
  },
  cardUnlocked: {
    backgroundColor: 'rgba(255,215,0,0.05)',
  },
  cardLocked: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.07)',
  },

  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  iconWrapLocked: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
  },

  name: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: GameColors.textWhite,
    textAlign: 'center',
    lineHeight: 16,
  },
  nameLocked: { color: GameColors.textSecondary },

  desc: {
    ...Typography.small,
    fontSize: 9.5,
    color: GameColors.textSecondary,
    textAlign: 'center',
    lineHeight: 13,
  },

  rewards: { flexDirection: 'row', gap: 8, marginTop: 2 },
  reward: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: GameColors.accentGold,
  },
  rewardLocked: { color: GameColors.textSecondary },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  badgeText: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    color: GameColors.textSecondary,
  },
});
