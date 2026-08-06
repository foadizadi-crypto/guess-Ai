import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { AvatarFrame } from '@/components/AvatarFrame';
import { BackButton } from '@/components/BackButton';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { getPlayerId } from '@/services/authService';
import { formatScore } from '@/utils';
import type { LeaderboardEntry } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiEntry {
  rank:     number;
  userId:   string;
  username: string;
  xp:       number;
  level:    number;
  avatarId: string;
}

const RANK_COLORS: Record<number, string> = {
  1: GameColors.accentGold,
  2: '#C0C0C0',
  3: '#CD7F32',
};

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const insets  = useSafeAreaInsets();
  const [tab, setTab]         = useState<'global' | 'weekly'>('global');
  const [rows, setRows]       = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [myRank, setMyRank]   = useState<number | null>(null);

  const { xp, username, level, selectedAvatarId, avatars, equippedCosmetics } = useUserStore();
  const currentAvatar = avatars.find((a) => a.id === selectedAvatarId);

  // ── Fetch leaderboard from API ─────────────────────────────────────────────
  const fetchLeaderboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/leaderboard?type=${tab}&limit=50`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data = (await res.json()) as ApiEntry[];

      // Map API shape → LeaderboardEntry shape expected by the render function
      const entries: LeaderboardEntry[] = data.map((e) => ({
        rank:     e.rank,
        userId:   e.userId,
        username: e.username,
        score:    e.xp,      // display XP as the "score" on the leaderboard
        avatarId: e.avatarId,
        level:    e.level,
      }));

      setRows(entries);

      // Find the current player's rank
      const uid = getPlayerId();
      const found = entries.find((e) => e.userId === uid);
      setMyRank(found?.rank ?? null);
    } catch (err) {
      console.warn('[Leaderboard] fetch failed:', err);
      setError('Could not load leaderboard. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const onRefresh = useCallback(() => fetchLeaderboard(true), [fetchLeaderboard]);

  // ── Layout ─────────────────────────────────────────────────────────────────
  const topPad    = Platform.OS === 'web' ? 62 : insets.top + 12;
  const bottomPad = Platform.OS === 'web' ? 28 : insets.bottom + 24;

  // ── Row renderer ───────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const color = RANK_COLORS[item.rank] ?? GameColors.textSecondary;
    const isTop = item.rank <= 3;
    const isMe  = item.userId === getPlayerId();

    return (
      <View style={[styles.row, isTop && styles.topRow, isMe && styles.myRow]}>
        <View style={styles.rank}>
          {isTop
            ? <Ionicons name="trophy" size={20} color={color} />
            : <Text style={[styles.rankText, { color }]}>{item.rank}</Text>}
        </View>
        <AvatarFrame imageKey={`avatar_${item.avatarId.replace('avatar_', '')}`} size={36} />
        <View style={styles.identity}>
          <Text style={styles.name}>
            {item.username}{isMe ? ' (You)' : ''}
          </Text>
          <Text style={styles.levelText}>Level {item.level}</Text>
        </View>
        <Text style={[styles.score, { color }]}>{formatScore(item.score)}</Text>
      </View>
    );
  };

  // ── Empty / error states ───────────────────────────────────────────────────
  const ListEmpty = () => {
    if (loading) return null;
    if (error) {
      return (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={GameColors.textSecondary} />
          <Text style={styles.emptyTitle}>Couldn't load</Text>
          <Text style={styles.emptyBody}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchLeaderboard()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.center}>
        <Ionicons name="people-outline" size={48} color={GameColors.textSecondary} />
        <Text style={styles.emptyTitle}>No players yet</Text>
        <Text style={styles.emptyBody}>
          {tab === 'weekly'
            ? 'Play a game this week to appear here!'
            : 'Be the first to play and claim the top spot!'}
        </Text>
      </View>
    );
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>

        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title}>Leaderboard</Text>
          <View style={styles.spacer} />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['global', 'weekly'] as const).map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.tab, tab === value && styles.activeTab]}
              onPress={() => setTab(value)}
            >
              <Ionicons
                name={value === 'global' ? 'globe-outline' : 'calendar-outline'}
                size={17}
                color={tab === value ? GameColors.backgroundPrimary : GameColors.textSecondary}
              />
              <Text style={[styles.tabText, tab === value && styles.activeTabText]}>
                {value === 'global' ? 'Global' : 'This Week'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Your stats card */}
        <View style={styles.currentCard}>
          <View style={styles.currentIdentity}>
            <AvatarFrame
              imageKey={currentAvatar?.imageKey ?? 'abigail'}
              frameId={equippedCosmetics?.frame}
              size={42}
              showLevel
              level={level}
            />
            <View>
              <Text style={styles.currentName}>{username || 'You'}</Text>
              <Text style={styles.currentMeta}>
                {myRank != null ? `Rank #${myRank}` : 'Not ranked yet'} · Level {level}
              </Text>
            </View>
          </View>
          <Text style={styles.currentScore}>{formatScore(xp)}</Text>
        </View>

        {/* Loading spinner */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={GameColors.accentGold} />
            <Text style={styles.loadingText}>Loading rankings…</Text>
          </View>
        )}

        {/* Leaderboard list */}
        {!loading && (
          <>
            <Text style={styles.listHeading}>
              {tab === 'global' ? 'Top 50 Players' : 'Top 50 This Week'}
            </Text>
            <FlatList
              data={rows}
              keyExtractor={(item) => item.userId}
              renderItem={renderItem}
              ListEmptyComponent={ListEmpty}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={GameColors.accentGold}
                />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={rows.length === 0 ? styles.emptyList : undefined}
            />
          </>
        )}
      </View>
    </AnimatedBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:       { flex: 1, paddingHorizontal: 20 },
  header:          { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title:           { ...Typography.header, fontSize: 22, color: GameColors.textWhite, flex: 1, textAlign: 'center' },
  spacer:          { width: 40 },

  tabs:            { flexDirection: 'row', gap: 10, marginBottom: 14 },
  tab:             { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: GameColors.border },
  activeTab:       { backgroundColor: GameColors.accentGold, borderColor: GameColors.accentGold },
  tabText:         { ...Typography.bodyMedium, color: GameColors.textSecondary, fontSize: 13 },
  activeTabText:   { color: GameColors.backgroundPrimary, fontFamily: 'Inter_700Bold' },

  currentCard:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: GameColors.border, marginBottom: 14 },
  currentIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  currentName:     { ...Typography.bodyMedium, color: GameColors.textWhite, fontFamily: 'Inter_700Bold' },
  currentMeta:     { ...Typography.small, color: GameColors.textSecondary, marginTop: 2 },
  currentScore:    { fontSize: 20, fontFamily: 'Inter_700Bold', color: GameColors.accentGold },

  listHeading:     { ...Typography.small, color: GameColors.textSecondary, letterSpacing: 1.5, marginBottom: 10 },

  row:             { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.04)' },
  topRow:          { backgroundColor: 'rgba(255,215,0,0.07)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.18)' },
  myRow:           { borderWidth: 1, borderColor: GameColors.accentGold + '55' },
  rank:            { width: 28, alignItems: 'center' },
  rankText:        { fontSize: 15, fontFamily: 'Inter_700Bold' },
  identity:        { flex: 1 },
  name:            { ...Typography.bodyMedium, color: GameColors.textWhite, fontSize: 14 },
  levelText:       { ...Typography.small, color: GameColors.textSecondary, fontSize: 12 },
  score:           { fontSize: 15, fontFamily: 'Inter_700Bold' },

  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 40 },
  emptyList:       { flex: 1 },
  emptyTitle:      { ...Typography.bodyMedium, color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 16 },
  emptyBody:       { ...Typography.small, color: GameColors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  loadingText:     { ...Typography.small, color: GameColors.textSecondary, marginTop: 8 },
  retryBtn:        { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, backgroundColor: GameColors.accentGold },
  retryText:       { fontFamily: 'Inter_700Bold', color: GameColors.backgroundPrimary, fontSize: 14 },
});
