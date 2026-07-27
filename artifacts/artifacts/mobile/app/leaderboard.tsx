import React, { useMemo, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { AvatarFrame } from '@/components/AvatarFrame';
import { BackButton } from '@/components/BackButton';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { MOCK_LEADERBOARD } from '@/constants';
import { formatScore } from '@/utils';
import type { LeaderboardEntry } from '@/types';

const RANK_COLORS: Record<number, string> = { 1: GameColors.accentGold, 2: '#C0C0C0', 3: '#CD7F32' };

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'global' | 'weekly'>('global');
  const { bestScore, username, level, selectedAvatarId, avatars } = useUserStore();
  const currentAvatar = avatars.find((avatar) => avatar.id === selectedAvatarId);
  const rows = useMemo(
    () =>
      MOCK_LEADERBOARD.map((item, index) => ({
        ...item,
        score: tab === 'weekly' ? Math.max(120, Math.round(item.score * 0.32) - (index % 3) * 17) : item.score,
      })),
    [tab],
  );
  const topPad = Platform.OS === 'web' ? 62 : insets.top + 12;
  const bottomPad = Platform.OS === 'web' ? 28 : insets.bottom + 24;

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const color = RANK_COLORS[item.rank] ?? GameColors.textSecondary;
    const isTop = item.rank <= 3;
    return (
      <View style={[styles.row, isTop && styles.topRow]}>
        <View style={styles.rank}>
          {isTop ? <Ionicons name="trophy" size={20} color={color} /> : <Text style={[styles.rankText, { color }]}>{item.rank}</Text>}
        </View>
        <AvatarFrame imageKey={`avatar_${item.avatarId.replace('avatar_', '')}`} size={36} />
        <View style={styles.identity}>
          <Text style={styles.name}>{item.username}</Text>
          <Text style={styles.level}>Level {item.level}</Text>
        </View>
        <Text style={[styles.score, { color }]}>{formatScore(item.score)}</Text>
      </View>
    );
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title}>Leaderboard</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.tabs}>
          {(['global', 'weekly'] as const).map((value) => (
            <TouchableOpacity key={value} style={[styles.tab, tab === value && styles.activeTab]} onPress={() => setTab(value)}>
              <Ionicons name={value === 'global' ? 'globe-outline' : 'calendar-outline'} size={17} color={tab === value ? GameColors.backgroundPrimary : GameColors.textSecondary} />
              <Text style={[styles.tabText, tab === value && styles.activeTabText]}>{value === 'global' ? 'Global' : 'Weekly'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.currentCard}>
          <View style={styles.currentIdentity}>
            <AvatarFrame imageKey={currentAvatar?.imageKey ?? 'wolf'} size={42} showLevel level={level} />
            <View>
              <Text style={styles.currentName}>{username || 'You'}</Text>
              <Text style={styles.currentMeta}>Your best score · Level {level}</Text>
            </View>
          </View>
          <Text style={styles.currentScore}>{formatScore(bestScore)}</Text>
        </View>
        <Text style={styles.listHeading}>Top 50 players</Text>
        <FlatList
          data={rows}
          keyExtractor={(item) => item.userId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  spacer: { width: 44 },
  title: { ...Typography.header, color: GameColors.textWhite, fontSize: 28 },
  tabs: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  tab: { flex: 1, height: 42, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: GameColors.border },
  activeTab: { backgroundColor: GameColors.accentGold, borderColor: GameColors.accentGold },
  tabText: { color: GameColors.textSecondary, fontFamily: 'Inter_700Bold', fontSize: 13 },
  activeTabText: { color: GameColors.backgroundPrimary },
  currentCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,215,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.45)', marginBottom: 14 },
  currentIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  currentName: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 16 },
  currentMeta: { color: GameColors.textSecondary, fontSize: 11, marginTop: 4 },
  currentScore: { color: GameColors.accentGold, fontFamily: 'Inter_700Bold', fontSize: 18 },
  listHeading: { color: GameColors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 8 },
  list: { gap: 8, paddingBottom: 18 },
  row: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: GameColors.border },
  topRow: { backgroundColor: 'rgba(255,215,0,0.07)', borderColor: 'rgba(255,215,0,0.22)' },
  rank: { width: 28, alignItems: 'center' },
  rankText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  identity: { flex: 1 },
  name: { color: GameColors.textWhite, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  level: { color: GameColors.textSecondary, fontSize: 11, marginTop: 2 },
  score: { fontFamily: 'Inter_700Bold', fontSize: 14 },
});