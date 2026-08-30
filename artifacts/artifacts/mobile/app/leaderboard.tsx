import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { AvatarFrame } from '@/components/AvatarFrame';
import { BackButton } from '@/components/BackButton';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { getApiUrl } from '@/services/apiConfig';
import { getPlayerId } from '@/services/authService';
import { getIdToken } from '@/services/authService';
import { formatScore } from '@/utils';

// This screen shows the REAL global leaderboard: Top 10 players ranked by
// real XP (from the `players` collection via the API server), plus the
// current player's real rank even when they fall outside the Top 10 (via
// GET /api/leaderboard/rank, a count() aggregation against the full player
// base — see artifacts/api-server/src/routes/leaderboard.ts). No mock,
// placeholder, or locally generated players are used anywhere on this screen.

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

  const { xp, level, username, selectedAvatarId, avatars } = useUserStore();
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
      const payload = await listRes.json() as ApiEntry[] | { entries?: ApiEntry[] };
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.entries)
          ? payload.entries
          : [];
      setTop10(list.slice(0, 10));

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

  const list10 = top10.slice(0, 10);
  const showPinnedSelf = uid != null;

  return (
    <AnimatedBackground>
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
            {/* Top 10 — one row per rank, no duplicate podium */}
            <View style={styles.listContainer}>
              {list10.map((item) => {
                const color = RANK_COLORS[item.rank] ?? GameColors.textSecondary;
                const isTop = item.rank <= 3;
                const isMe  = item.userId === uid;

                return (
                  <View
                    key={item.userId}
                    style={[
                      styles.row,
                      isTop && styles.topRow,
                      isMe && styles.myRow,
                    ]}
                  >
                    <View style={styles.rankBadge}>
                      <Text style={[styles.rankText, { color }]}>{item.rank}</Text>
                    </View>
                    <AvatarFrame imageKey={avatarKey(item.avatarId)} size={30} />
                    <View style={styles.identity}>
                      <Text style={styles.name} numberOfLines={1}>
                        {item.username}{isMe ? ' (You)' : ''}
                      </Text>
                      <Text style={styles.levelText}>Level {item.level}</Text>
                    </View>
                    <Text style={[styles.score, { color }]} numberOfLines={1}>
                      {formatScore(Number(item.xp) || 0)} XP
                    </Text>
                  </View>
                );
              })}
            </View>

            {showPinnedSelf && (
              <>
                {(myRank == null || myRank > 10) && (
                  <Text style={styles.ellipsis}>------------------------</Text>
                )}
                <View style={styles.myRankBar}>
                  <AvatarFrame imageKey={currentAvatar?.imageKey ?? 'abigail'} size={30} />
                  <View style={styles.identity}>
                    <Text style={styles.myRankLabel} numberOfLines={1}>
                      {username || 'You'}
                    </Text>
                    <Text style={styles.levelText}>Level {level}</Text>
                  </View>
                  <Text style={styles.myRankXp} numberOfLines={1}>
                    {formatScore(Number(xp) || 0)} XP
                  </Text>
                  <Text style={styles.myRankValue}>
                    {myRank != null ? String(myRank) : 'Unranked'}
                  </Text>
                </View>
              </>
            )}
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

  // ── Top 10 list (fixed height rows — no scroll) ──
  listContainer:   { flex: 1, gap: 5, justifyContent: 'space-evenly' },
  row:             { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, minHeight: 44, flexShrink: 0, borderRadius: 14, backgroundColor: 'rgba(20, 6, 38, 0.6)' },
  topRow:          { backgroundColor: 'rgba(255,215,0,0.09)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.22)' },
  myRow:           { borderWidth: 1.5, borderColor: GameColors.accentGold },
  rankBadge:       { width: 22, alignItems: 'center' },
  rankText:        { fontSize: 13, fontFamily: 'Inter_700Bold' },
  identity:        { flex: 1, minWidth: 0 },
  name:            { ...Typography.bodyMedium, color: GameColors.textWhite, fontSize: 13 },
  levelText:       { ...Typography.small, color: GameColors.textSecondary, fontSize: 10 },
  score:           { fontSize: 13, fontFamily: 'Inter_700Bold' },

  ellipsis:        { textAlign: 'center', color: GameColors.textSecondary, letterSpacing: 2, fontSize: 12, marginVertical: 4 },
  myRankBar:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14, marginTop: 4, borderRadius: 14, borderWidth: 1.5, borderColor: GameColors.accentGold, backgroundColor: 'rgba(30, 10, 50, 0.75)' },
  myRankLabel:     { ...Typography.bodyMedium, color: GameColors.textWhite, fontSize: 13 },
  myRankXp:        { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#CE93D8' },
  myRankValue:     { fontSize: 16, fontFamily: 'Inter_700Bold', color: GameColors.accentGold, minWidth: 52, textAlign: 'right' },

  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle:      { ...Typography.bodyMedium, color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 16 },
  emptyBody:       { ...Typography.small, color: GameColors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  loadingText:     { ...Typography.small, color: GameColors.textSecondary, marginTop: 8 },
  retryBtn:        { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, backgroundColor: GameColors.accentGold },
  retryText:       { fontFamily: 'Inter_700Bold', color: GameColors.backgroundPrimary, fontSize: 14 },
});
