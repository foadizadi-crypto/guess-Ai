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
import { calculateXPProgress, formatScore, xpInCurrentLevel, xpForCurrentLevel } from '@/utils';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { username, coins, xp, level, selectedAvatarId, avatars, statistics, equippedCosmetics } = useUserStore();
  const currentAvatar = avatars.find((avatar) => avatar.id === selectedAvatarId);
  const xpInLevel  = xpInCurrentLevel(xp);
  const xpLevelCap = xpForCurrentLevel(level);
  const winRate = statistics.totalGamesPlayed ? Math.round((statistics.totalWins / statistics.totalGamesPlayed) * 100) : 0;
  const topPad = Platform.OS === 'web' ? 62 : insets.top + 12;
  const bottomPad = Platform.OS === 'web' ? 28 : insets.bottom + 24;

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
          <AvatarFrame imageKey={currentAvatar?.imageKey ?? 'abigail'} frameId={equippedCosmetics?.frame} size={78} showLevel level={level} />
          <Text style={styles.username}>{username || 'Player'}</Text>
          <CoinDisplay amount={coins} size="medium" animate />
          <View style={styles.xpWrap}>
            <View style={styles.xpLabels}><Text style={styles.muted}>Level {level}</Text><Text style={styles.xpText}>{xpInLevel} / {xpLevelCap === Infinity ? '∞' : xpLevelCap} XP</Text></View>
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
        <Text style={styles.footerNote}>15 categories · one blurred image at a time.</Text>
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
  footerNote: { color: GameColors.textSecondary, textAlign: 'center', fontSize: 11, marginTop: 20 },
});
