import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { ACHIEVEMENTS } from '@/constants/achievements';
import { getApiUrl } from '@/services/apiConfig';
import { getIdToken, getPlayerId } from '@/services/authService';
import { formatScore } from '@/utils';

const AUTO_REFRESH_MS = 20_000;

function shortPlayerId(uid: string | null): string {
  if (!uid) return '—';
  if (uid.length <= 12) return uid;
  return `${uid.slice(0, 6)}…${uid.slice(-4)}`;
}

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const achievements = useUserStore((s) => s.achievements);
  const clearBadge = useUserStore((s) => s.clearNewAchievementBadge);
  const username = useUserStore((s) => s.username);
  const xp = useUserStore((s) => s.xp);
  const level = useUserStore((s) => s.level);
  const statistics = useUserStore((s) => s.statistics);

  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [rankLoading, setRankLoading] = useState(true);

  const uid = getPlayerId();

  const fetchRank = useCallback(async () => {
    if (!uid) {
      setRankLoading(false);
      return;
    }
    try {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch(getApiUrl('/api/leaderboard/rank?type=global'), {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = (await res.json()) as { rank: number | null };
        setGlobalRank(data.rank);
      }
    } catch {
      /* offline — keep last rank */
    } finally {
      setRankLoading(false);
    }
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      clearBadge();
      setRankLoading(true);
      void fetchRank();
    }, [clearBadge, fetchRank]),
  );

  useEffect(() => {
    const id = setInterval(() => { void fetchRank(); }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchRank]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top + 12;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom + 24;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <AnimatedBackground overlayOpacity={0.35}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title}>Achievements</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Ionicons name="person-circle" size={22} color={GameColors.accentGold} />
            <Text style={styles.profileName} numberOfLines={1}>{username || 'Player'}</Text>
          </View>
          <Text style={styles.profileMeta}>Player ID · {shortPlayerId(uid)}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statChip}>Lvl {level}</Text>
            <Text style={styles.statChip}>{formatScore(xp)} XP</Text>
            <Text style={styles.statChip}>{statistics.totalWins} wins</Text>
            {rankLoading ? (
              <ActivityIndicator size="small" color={GameColors.accentGold} />
            ) : (
              <Text style={[styles.statChip, styles.rankChip]}>
                {globalRank != null ? `#${globalRank} global` : 'Unranked'}
              </Text>
            )}
          </View>
        </View>

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

        <View style={styles.grid}>
          {ACHIEVEMENTS.map((def) => {
            const stored = achievements.find((a) => a.id === def.id);
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

                <Text
                  style={[styles.name, !isUnlocked && styles.nameLocked]}
                  numberOfLines={2}
                >
                  {def.title}
                </Text>
                <Text style={styles.desc} numberOfLines={2}>
                  {def.description}
                </Text>

                <View style={styles.rewards}>
                  {def.rewardCoins > 0 && (
                    <Text style={[styles.reward, !isUnlocked && styles.rewardLocked]}>
                      🪙 {def.rewardCoins}
                    </Text>
                  )}
                  {def.rewardXP > 0 && (
                    <Text style={[styles.reward, !isUnlocked && styles.rewardLocked]}>
                      ⭐ {def.rewardXP} XP
                    </Text>
                  )}
                  {def.rewardGems != null && def.rewardGems > 0 && (
                    <Text style={[styles.reward, !isUnlocked && styles.rewardLocked]}>
                      💎 {def.rewardGems}
                    </Text>
                  )}
                </View>

                {isUnlocked && unlockedAt ? (
                  <Text style={styles.unlockedAt}>Unlocked {unlockedAt}</Text>
                ) : (
                  <Text style={styles.lockedLabel}>Locked</Text>
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
  container: { paddingHorizontal: 18, gap: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { ...Typography.header, color: GameColors.textWhite, fontSize: 26, flex: 1, textAlign: 'center' },
  spacer: { width: 44 },
  profileCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: GameColors.border,
    gap: 6,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileName: { ...Typography.bodyMedium, color: GameColors.textWhite, flex: 1, fontFamily: 'Inter_700Bold' },
  profileMeta: { ...Typography.small, color: GameColors.textSecondary, fontFamily: 'Inter_500Medium' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, alignItems: 'center' },
  statChip: {
    ...Typography.small,
    color: GameColors.textWhite,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  rankChip: { color: GameColors.accentGold, fontFamily: 'Inter_700Bold' },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: GameColors.border,
  },
  progressLeft: { flexDirection: 'row', alignItems: 'baseline' },
  progressCount: { fontSize: 36, fontFamily: 'Inter_700Bold', color: GameColors.accentGold },
  progressTotal: { fontSize: 16, fontFamily: 'Inter_500Medium', color: GameColors.textSecondary },
  progressRight: { flex: 1, gap: 6 },
  progressLabel: { ...Typography.small, color: GameColors.textSecondary },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: GameColors.accentGold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    flexGrow: 1,
    flexBasis: '44%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 4,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cardUnlocked: { backgroundColor: 'rgba(255,255,255,0.07)' },
  cardLocked: { opacity: 0.72, borderColor: GameColors.border },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 2,
  },
  iconWrapLocked: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: GameColors.border },
  name: { ...Typography.bodyMedium, color: GameColors.textWhite, textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 13 },
  nameLocked: { color: GameColors.textSecondary },
  desc: { ...Typography.small, color: GameColors.textSecondary, textAlign: 'center', fontSize: 10, lineHeight: 14, minHeight: 28 },
  rewards: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  reward: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: GameColors.accentGold },
  rewardLocked: { color: GameColors.textSecondary },
  unlockedAt: { fontSize: 9, color: GameColors.accentGreen, fontFamily: 'Inter_500Medium', marginTop: 2 },
  lockedLabel: { fontSize: 9, color: GameColors.textSecondary, fontFamily: 'Inter_500Medium', marginTop: 2 },
});
