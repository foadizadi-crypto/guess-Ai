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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
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

// ─── Glow pulse wrapper ─────────────────────────────────────────────────────
// Purely visual: animates a soft glow ring behind top-3 rows and the current
// player's row. Does not intercept touches or alter layout/data flow.
const GlowPulse: React.FC<{ color: string; delay?: number; children: React.ReactNode }> = ({
  color,
  delay = 0,
  children,
}) => {
  const glow = useSharedValue(0.35);

  useEffect(() => {
    glow.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.9, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    shadowOpacity: glow.value,
  }));

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.glowWrap,
        glowStyle,
        {
          shadowColor: color,
          borderColor: color,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

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

    const row = (
      <View
        style={[
          styles.row,
          isTop && styles.topRow,
          item.rank === 1 && styles.rankGold,
          item.rank === 2 && styles.rankSilver,
          item.rank === 3 && styles.rankBronze,
          isMe && styles.myRow,
        ]}
      >
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

    // Top-3 ranks and the current player's row get an animated glow pulse.
    // Everything else about the row (data, layout, touch targets) is untouched.
    if (isTop || isMe) {
      const glowColor = isTop ? color : GameColors.accentGold;
      return (
        <GlowPulse color={glowColor} delay={item.rank * 150}>
          {row}
        </GlowPulse>
      );
    }
    return row;
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
    <AnimatedBackground
      backgroundImage={require('../assets/background/leaderboard_BG.webp')}
      overlayOpacity={0.3}
    >
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

  currentCard:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 18, backgroundColor: 'rgba(30, 10, 50, 0.55)', borderWidth: 1, borderColor: GameColors.cardBorder, marginBottom: 14, shadowColor: GameColors.accentGold, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  currentIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  currentName:     { ...Typography.bodyMedium, color: GameColors.textWhite, fontFamily: 'Inter_700Bold' },
  currentMeta:     { ...Typography.small, color: GameColors.textSecondary, marginTop: 2 },
  currentScore:    { fontSize: 20, fontFamily: 'Inter_700Bold', color: GameColors.accentGold },

  listHeading:     { ...Typography.small, color: GameColors.textSecondary, letterSpacing: 1.5, marginBottom: 10 },

  row:             { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, marginBottom: 8, backgroundColor: 'rgba(20, 6, 38, 0.6)' },
  topRow:          { backgroundColor: 'rgba(255,215,0,0.09)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.22)' },
  myRow:           { borderWidth: 1.5, borderColor: GameColors.accentGold },
  rankGold:        { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.12)' },
  rankSilver:      { borderColor: '#C0C0C0', backgroundColor: 'rgba(192,192,192,0.10)' },
  rankBronze:      { borderColor: '#CD7F32', backgroundColor: 'rgba(205,127,50,0.10)' },
  rank:            { width: 28, alignItems: 'center' },
  rankText:        { fontSize: 15, fontFamily: 'Inter_700Bold' },
  identity:        { flex: 1 },
  name:            { ...Typography.bodyMedium, color: GameColors.textWhite, fontSize: 14 },
  levelText:       { ...Typography.small, color: GameColors.textSecondary, fontSize: 12 },
  score:           { fontSize: 15, fontFamily: 'Inter_700Bold' },

  // Glow wrapper around top-3 / current-player rows. `marginBottom` moved
  // here from `row` since the glow wrapper is now the outer, spacing element.
  glowWrap:        { borderRadius: 16, borderWidth: 1.5, marginBottom: 8, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },

  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 40 },
  emptyList:       { flex: 1 },
  emptyTitle:      { ...Typography.bodyMedium, color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 16 },
  emptyBody:       { ...Typography.small, color: GameColors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  loadingText:     { ...Typography.small, color: GameColors.textSecondary, marginTop: 8 },
  retryBtn:        { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, backgroundColor: GameColors.accentGold },
  retryText:       { fontFamily: 'Inter_700Bold', color: GameColors.backgroundPrimary, fontSize: 14 },
});
