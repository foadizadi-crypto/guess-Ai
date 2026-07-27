import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { AvatarFrame } from '@/components/AvatarFrame';
import { BackButton } from '@/components/BackButton';
import { CoinDisplay } from '@/components/CoinDisplay';
import { ProgressBar } from '@/components/ProgressBar';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { ACHIEVEMENTS, CATEGORIES, GAME_CONSTANTS } from '@/constants';
import { calculateXPProgress, formatScore } from '@/utils';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { username, coins, xp, level, selectedAvatarId, avatars, statistics } = useUserStore();
  const currentAvatar = avatars.find((avatar) => avatar.id === selectedAvatarId);
  const xpInLevel = xp % GAME_CONSTANTS.XP_PER_LEVEL;
  const winRate = statistics.totalGamesPlayed ? Math.round((statistics.totalWins / statistics.totalGamesPlayed) * 100) : 0;
  const topPad = Platform.OS === 'web' ? 62 : insets.top + 12;
  const bottomPad = Platform.OS === 'web' ? 28 : insets.bottom + 24;
  const unlocked = (id: string) => {
    if (id === 'first-win') return statistics.totalWins >= 1;
    if (id === 'sharp-eye') return statistics.totalCorrectAnswers >= 10;
    if (id === 'streak-master') return statistics.longestStreak >= 7;
    if (id === 'collector') return avatars.filter((avatar) => avatar.unlocked).length >= 5;
    if (id === 'high-roller') return statistics.totalCoinsEarned >= 1000;
    return statistics.totalGamesPlayed >= 25;
  };

  const stats = [
    ['game-controller-outline', 'Games Played', `${statistics.totalGamesPlayed}`],
    ['trophy-outline', 'Win Rate', `${winRate}%`],
    ['analytics-outline', 'Total Score', formatScore(statistics.bestScore)],
    ['checkmark-circle-outline', 'Correct Answers', `${statistics.totalCorrectAnswers}`],
    ['grid-outline', 'Favorite Category', statistics.favoriteCategory ? statistics.favoriteCategory[0].toUpperCase() + statistics.favoriteCategory.slice(1) : '—'],
    ['flame-outline', 'Best Streak', `${statistics.longestStreak}`],
  ] as const;

  return (
    <AnimatedBackground>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><BackButton /><Text style={styles.title}>Profile</Text><View style={styles.spacer} /></View>
        <View style={styles.hero}>
          <AvatarFrame imageKey={currentAvatar?.imageKey ?? 'wolf'} size={78} showLevel level={level} />
          <Text style={styles.username}>{username || 'Player'}</Text>
          <CoinDisplay amount={coins} size="medium" animate />
          <View style={styles.xpWrap}>
            <View style={styles.xpLabels}><Text style={styles.muted}>Level {level}</Text><Text style={styles.xpText}>{xpInLevel} / {GAME_CONSTANTS.XP_PER_LEVEL} XP</Text></View>
            <ProgressBar progress={calculateXPProgress(xp)} height={7} animated />
          </View>
        </View>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          {stats.map(([icon, label, value]) => (
            <View key={label} style={styles.statCard}>
              <Ionicons name={icon} size={21} color={GameColors.accentGold} />
              <Text style={styles.statLabel}>{label}</Text>
              <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementGrid}>
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = unlocked(achievement.id);
            return (
              <View key={achievement.id} style={[styles.achievement, isUnlocked && styles.achievementUnlocked]}>
                <View style={[styles.achievementIcon, isUnlocked && styles.achievementIconUnlocked]}>
                  <Ionicons name={achievement.icon as keyof typeof Ionicons.glyphMap} size={25} color={isUnlocked ? GameColors.accentGold : GameColors.textSecondary} />
                </View>
                <Text style={[styles.achievementTitle, !isUnlocked && styles.lockedText]}>{achievement.title}</Text>
                <Text style={styles.achievementDesc}>{isUnlocked ? 'Unlocked' : achievement.description}</Text>
                {!isUnlocked && <Ionicons name="lock-closed" size={12} color={GameColors.textSecondary} style={styles.lock} />}
              </View>
            );
          })}
        </View>
        <Text style={styles.footerNote}>{CATEGORIES.length} categories mastered one blurred image at a time.</Text>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, minHeight: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  spacer: { width: 44 },
  title: { ...Typography.header, color: GameColors.textWhite, fontSize: 28 },
  hero: { alignItems: 'center', padding: 22, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: GameColors.border },
  username: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 22, marginTop: 10 },
  xpWrap: { width: '100%', marginTop: 18, gap: 8 },
  xpLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  muted: { color: GameColors.textSecondary, fontSize: 12 },
  xpText: { color: GameColors.accentGold, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  sectionTitle: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 18, marginTop: 22, marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '31.8%', minHeight: 92, flexGrow: 1, padding: 11, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: GameColors.border, gap: 5 },
  statLabel: { color: GameColors.textSecondary, fontSize: 10 },
  statValue: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 15 },
  achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  achievement: { width: '31.8%', minHeight: 124, flexGrow: 1, alignItems: 'center', padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: GameColors.border, position: 'relative' },
  achievementUnlocked: { backgroundColor: 'rgba(255,215,0,0.08)', borderColor: 'rgba(255,215,0,0.35)' },
  achievementIcon: { width: 45, height: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 7 },
  achievementIconUnlocked: { backgroundColor: 'rgba(255,215,0,0.18)' },
  achievementTitle: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 11, textAlign: 'center' },
  achievementDesc: { color: GameColors.textSecondary, fontSize: 9, textAlign: 'center', marginTop: 4 },
  lockedText: { color: GameColors.textSecondary },
  lock: { position: 'absolute', top: 7, right: 7 },
  footerNote: { color: GameColors.textSecondary, textAlign: 'center', fontSize: 11, marginTop: 20 },
});