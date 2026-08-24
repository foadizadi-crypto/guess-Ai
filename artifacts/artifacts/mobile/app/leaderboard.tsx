import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
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
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { AvatarFrame } from '@/components/AvatarFrame';
import { BackButton } from '@/components/BackButton';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { getApiUrl, safeApiTarget } from '@/services/apiConfig';
import { getPlayerId } from '@/services/authService';
import { getIdToken } from '@/services/authService';
import { formatScore } from '@/utils';

// This screen shows the REAL global leaderboard: Top 10 players ranked by
// real XP (from the `players` collection via the API server), plus the
// current player's real rank even when they fall outside the Top 10 (via
// GET /api/leaderboard/rank, a count() aggregation against the full player
// base — see artifacts/api-server/src/routes/leaderboard.ts). No mock,
// placeholder, or locally generated players are used anywhere on this screen.

// ─── Glow pulse wrapper ─────────────────────────────────────────────────────
// Purely visual: animates a soft glow ring around the podium/top rows and the
// current player's row. Does not intercept touches or alter layout/data flow.
const GlowPulse: React.FC<{
  color: string;
  delay?: number;
  style?: object;
  children: React.ReactNode;
}> = ({ color, delay = 0, style, children }) => {
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
        style,
        glowStyle,
        { shadowColor: color, borderColor: color },
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

interface RankEntry {
  rank: number | null;
  xp: number;
}

const RANK_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

// Real players' XP changes as anyone plays; poll periodically so the board
// (and the player's own rank) stays current without needing a manual reload.
const AUTO_REFRESH_MS = 20_000;
const REQUEST_TIMEOUT_MS = 8_000;

/** Prevent a network or Firestore request from leaving the screen loading forever. */
async function fetchWithTimeout(
  url: string,
  timeoutMs = REQUEST_TIMEOUT_MS,
  init: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function avatarKey(avatarId: string): string {
  return `avatar_${avatarId.replace('avatar_', '')}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const insets  = useSafeAreaInsets();
  const [top10, setTop10]     = useState<ApiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [myRank, setMyRank]   = useState<number | null>(null);

  const { xp, username, selectedAvatarId, avatars } = useUserStore();
  const currentAvatar = avatars.find((a) => a.id === selectedAvatarId);
  const uid = getPlayerId();

  // ── Fetch the real Top 10 + the real current-player rank ──────────────────
  const fetchLeaderboard = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError(null);

    try {
      // The rank endpoint is supplementary: a slow rank calculation must not
      // prevent the top-10 leaderboard from appearing.
      const [listResult, rankResult] = await Promise.allSettled([
        fetchWithTimeout(getApiUrl('/api/leaderboard?type=global&limit=10')),
        uid
           ? getIdToken().then((token) => {
               if (!token) throw new Error('not signed in');
               return fetchWithTimeout(
                 getApiUrl('/api/leaderboard/rank?type=global'),
                 REQUEST_TIMEOUT_MS,
                 { headers: { Authorization: `Bearer ${token}` } },
               );
             })
          : Promise.resolve(null as Response | null),
      ]);

      if (listResult.status === 'rejected') throw listResult.reason;
      const listRes = listResult.value;
      if (!listRes.ok) throw new Error(`Server returned ${listRes.status}`);
      const list = (await listRes.json()) as ApiEntry[];
      setTop10(list);

      // Prefer the dedicated rank endpoint (accurate even outside Top 10);
      // fall back to the Top 10 list itself if that request failed.
      const rankRes = rankResult.status === 'fulfilled' ? rankResult.value : null;
      if (rankRes?.ok) {
        const rankData = (await rankRes.json()) as RankEntry;
        setMyRank(rankData.rank);
      } else {
        const found = list.find((e) => e.userId === uid);
        setMyRank(found?.rank ?? null);
      }
    } catch (err) {
      console.warn('[Leaderboard] fetch failed:', err);
      setError('Could not load leaderboard. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  // Initial load + refresh whenever the screen regains focus (e.g. returning
  // from a game with new XP), so the board never shows stale standings.
  useFocusEffect(
    useCallback(() => {
      fetchLeaderboard(true);
    }, [fetchLeaderboard]),
  );

  // Real players' standings shift over time; poll while this screen is open.
  useEffect(() => {
    const id = setInterval(() => fetchLeaderboard(false), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchLeaderboard]);

  // The player's own XP can change on this device (e.g. a session finishing
  // in the background); re-sync immediately when it does.
  const lastXpRef = useRef(xp);
  useEffect(() => {
    if (lastXpRef.current !== xp) {
      lastXpRef.current = xp;
      fetchLeaderboard(false);
    }
  }, [xp, fetchLeaderboard]);

  // ── Layout ─────────────────────────────────────────────────────────────────
  const topPad    = Platform.OS === 'web' ? 40 : insets.top + 8;
  const bottomPad = Platform.OS === 'web' ? 20 : insets.bottom + 12;

  const podium = top10.slice(0, 3);
  const list10 = top10.slice(0, 10);

  return (
    <AnimatedBackground
      backgroundImage={require('../assets/background/leaderboard_BG.webp')}
      overlayOpacity={0.3}
    >
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>

        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title}>LEADERBOARD</Text>
          <View style={styles.spacer} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={GameColors.accentGold} />
            <Text style={styles.loadingText}>Loading rankings…</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={44} color={GameColors.textSecondary} />
            <Text style={styles.emptyTitle}>Couldn't load</Text>
            <Text style={styles.emptyBody}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchLeaderboard(true)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : top10.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="people-outline" size={44} color={GameColors.textSecondary} />
            <Text style={styles.emptyTitle}>No players yet</Text>
            <Text style={styles.emptyBody}>Be the first to play and claim the top spot!</Text>
          </View>
        ) : (
          <>
            {/* Top 3 podium */}
            <View style={styles.podiumRow}>
              {[1, 0, 2].map((idx) => {
                const entry = podium[idx];
                if (!entry) return <View key={idx} style={styles.podiumSlotEmpty} />;
                const isMe = entry.userId === uid;
                const color = RANK_COLORS[entry.rank] ?? GameColors.textSecondary;
                const isFirst = entry.rank === 1;
                return (
                  <GlowPulse
                    key={entry.userId}
                    color={color}
                    delay={entry.rank * 150}
                    style={[
                      styles.podiumSlot,
                      isFirst && styles.podiumSlotFirst,
                      { borderColor: color },
                      isMe && styles.myGlowBorder,
                    ]}
                  >
                    <Ionicons
                      name={isFirst ? 'trophy' : 'medal'}
                      size={isFirst ? 24 : 18}
                      color={color}
                      style={styles.podiumMedal}
                    />
                    <AvatarFrame imageKey={avatarKey(entry.avatarId)} size={isFirst ? 54 : 42} />
                    <Text style={styles.podiumRank}>#{entry.rank}</Text>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {entry.username}{isMe ? ' (You)' : ''}
                    </Text>
                    <Text style={[styles.podiumScore, { color }]} numberOfLines={1}>
                      {formatScore(entry.xp)} XP
                    </Text>
                  </GlowPulse>
                );
              })}
            </View>

            {/* Top 10 list */}
            <View style={styles.listContainer}>
              {list10.map((item) => {
                const color = RANK_COLORS[item.rank] ?? GameColors.textSecondary;
                const isTop = item.rank <= 3;
                const isMe  = item.userId === uid;

                const row = (
                  <View
                    style={[
                      styles.row,
                      isTop && styles.topRow,
                      isMe && styles.myRow,
                    ]}
                  >
                    <View style={styles.rankBadge}>
                      {isTop
                        ? <Ionicons name="trophy" size={16} color={color} />
                        : <Text style={[styles.rankText, { color }]}>{item.rank}</Text>}
                    </View>
                    <AvatarFrame imageKey={avatarKey(item.avatarId)} size={30} />
                    <View style={styles.identity}>
                      <Text style={styles.name} numberOfLines={1}>
                        {item.username}{isMe ? ' (You)' : ''}
                      </Text>
                      <Text style={styles.levelText}>Level {item.level}</Text>
                    </View>
                    <Text style={[styles.score, { color }]} numberOfLines={1}>
                      {formatScore(item.xp)} XP
                    </Text>
                  </View>
                );

                if (isMe) {
                  return (
                    <GlowPulse key={item.userId} color={GameColors.accentGold} style={styles.rowGlowWrap}>
                      {row}
                    </GlowPulse>
                  );
                }
                return <View key={item.userId} style={styles.rowFlexWrap}>{row}</View>;
              })}
            </View>

            {/* Current player's real rank (separate, compact — no duplicated info) */}
            <GlowPulse color={GameColors.accentGold} style={styles.myRankBar}>
              <AvatarFrame imageKey={currentAvatar?.imageKey ?? 'abigail'} size={28} />
              <Text style={styles.myRankLabel} numberOfLines={1}>{username || 'You'}</Text>
              <View style={styles.myRankDivider} />
              <Text style={styles.myRankValue}>
                {myRank != null ? `#${myRank}` : 'Unranked'}
              </Text>
            </GlowPulse>
          </>
        )}
      </View>
    </AnimatedBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:       { flex: 1, paddingHorizontal: 16 },
  header:          { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  title:           { ...Typography.header, fontSize: 20, letterSpacing: 2, color: GameColors.textWhite, flex: 1, textAlign: 'center' },
  spacer:          { width: 40 },

  // ── Podium ──
  podiumRow:       { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 10, marginBottom: 10 },
  podiumSlot:      { flex: 1, maxWidth: 130, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6, borderRadius: 18, borderWidth: 1.5, backgroundColor: 'rgba(24, 8, 44, 0.55)' },
  podiumSlotFirst: { paddingVertical: 14, backgroundColor: 'rgba(40, 14, 66, 0.6)' },
  podiumSlotEmpty: { flex: 1, maxWidth: 130 },
  podiumMedal:     { marginBottom: 4 },
  podiumRank:      { ...Typography.small, color: GameColors.textWhite, fontFamily: 'Inter_700Bold', marginTop: 6, fontSize: 12 },
  podiumName:      { ...Typography.small, color: GameColors.textWhite, fontSize: 12, marginTop: 2, maxWidth: 110 },
  podiumScore:     { fontSize: 11, fontFamily: 'Inter_700Bold', marginTop: 2 },

  // ── Top 10 list (fixed, no scroll — rows share the remaining space) ──
  listContainer:   { flex: 1, gap: 6 },
  rowFlexWrap:     { flex: 1 },
  rowGlowWrap:     { flex: 1, marginBottom: 0 },
  row:             { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: 'rgba(20, 6, 38, 0.6)' },
  topRow:          { backgroundColor: 'rgba(255,215,0,0.09)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.22)' },
  myRow:           { borderWidth: 1.5, borderColor: GameColors.accentGold },
  rankBadge:       { width: 22, alignItems: 'center' },
  rankText:        { fontSize: 13, fontFamily: 'Inter_700Bold' },
  identity:        { flex: 1, minWidth: 0 },
  name:            { ...Typography.bodyMedium, color: GameColors.textWhite, fontSize: 13 },
  levelText:       { ...Typography.small, color: GameColors.textSecondary, fontSize: 10 },
  score:           { fontSize: 13, fontFamily: 'Inter_700Bold' },

  // Glow wrapper shared by podium slots, "my row" in the list, and the rank bar.
  glowWrap:        { borderRadius: 16, borderWidth: 1.5, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  myGlowBorder:    { borderColor: GameColors.accentGold },

  // ── Current player's real rank (compact, separate section) ──
  myRankBar:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 14, marginTop: 8, backgroundColor: 'rgba(30, 10, 50, 0.6)' },
  myRankLabel:     { ...Typography.bodyMedium, color: GameColors.textWhite, fontSize: 13, flex: 1 },
  myRankDivider:   { width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.15)' },
  myRankValue:     { fontSize: 17, fontFamily: 'Inter_700Bold', color: GameColors.accentGold },

  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle:      { ...Typography.bodyMedium, color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 16 },
  emptyBody:       { ...Typography.small, color: GameColors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  loadingText:     { ...Typography.small, color: GameColors.textSecondary, marginTop: 8 },
  retryBtn:        { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, backgroundColor: GameColors.accentGold },
  retryText:       { fontFamily: 'Inter_700Bold', color: GameColors.backgroundPrimary, fontSize: 14 },
});
