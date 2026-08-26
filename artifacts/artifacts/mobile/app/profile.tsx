import React, { useCallback, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { hapticsService } from '@/services/HapticsService';
import { AvatarFrame } from '@/components/AvatarFrame';
import { BackButton } from '@/components/BackButton';
import { ProgressBar } from '@/components/ProgressBar';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { calculateXPProgress, formatCoins, xpInCurrentLevel, xpForCurrentLevel } from '@/utils';
import { useAudio } from '@/hooks/useAudio';
import { ALL_WINGS } from '@/constants/wings';
import { COSMETIC_BY_ID } from '@/constants/collections';
import { ACHIEVEMENTS } from '@/constants/achievements';
import { getApiUrl } from '@/services/apiConfig';
import { getIdToken, getPlayerId } from '@/services/authService';
import { ROUTES } from '@/navigation/routes';

const REQUEST_TIMEOUT_MS = 8_000;

async function fetchPlayerRank(): Promise<number | null> {
  const uid = getPlayerId();
  if (!uid) return null;
  try {
    const token = await getIdToken();
    if (!token) return null;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(getApiUrl('/api/leaderboard/rank?type=global'), {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
        cache: 'no-store',
      });
      if (!response.ok) return null;
      const data = (await response.json()) as { rank?: number | null };
      return typeof data.rank === 'number' ? data.rank : null;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    return null;
  }
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    username,
    coins,
    gems,
    xp,
    level,
    selectedAvatarId,
    avatars,
    equippedCosmetics,
    equippedWing,
    achievements,
  } = useUserStore();

  const currentAvatar = avatars.find((avatar) => avatar.id === selectedAvatarId);
  const xpInLevel = xpInCurrentLevel(xp);
  const xpLevelCap = xpForCurrentLevel(level);
  const wing = ALL_WINGS.find((item) => item.id === equippedWing);
  const frame = equippedCosmetics?.frame
    ? COSMETIC_BY_ID.get(equippedCosmetics.frame)
    : undefined;
  const unlockedBadges = ACHIEVEMENTS.filter((def) =>
    achievements.some((owned) => owned.id === def.id && owned.unlocked),
  );

  const [rank, setRank] = useState<number | null>(null);
  const { playEffect } = useAudio();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      fetchPlayerRank().then((value) => {
        if (!cancelled) setRank(value);
      });
      return () => { cancelled = true; };
    }, [xp, username]),
  );

  const handleBack = () => {
    hapticsService.impact(1);
    playEffect('button_click');
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.LOBBY);
  };

  const topPad = Platform.OS === 'web' ? 20 : insets.top + 6;
  const bottomPad = Platform.OS === 'web' ? 28 : insets.bottom + 24;

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require('../assets/background/profile_bg.png')}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={[styles.header, { paddingTop: topPad }]}>
          <BackButton onPress={handleBack} />
          <Text style={styles.title}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <AvatarFrame
              imageKey={currentAvatar?.imageKey ?? 'abigail'}
              frameId={equippedCosmetics?.frame}
              size={88}
              showLevel
              level={level}
            />
            <Text style={styles.username}>{username || 'Player'}</Text>
            <Text style={styles.levelLine}>Level {level}</Text>
          </View>

          <View style={styles.xpCard}>
            <View style={styles.xpLabels}>
              <Text style={styles.muted}>XP</Text>
              <Text style={styles.xpValue}>
                {xpInLevel} / {xpLevelCap === Infinity ? 'MAX' : xpLevelCap}
              </Text>
            </View>
            <ProgressBar progress={calculateXPProgress(xp)} height={8} animated />
          </View>

          <View style={styles.currencyRow}>
            <StatChip icon="logo-bitcoin" label="Coins" value={formatCoins(coins)} />
            <StatChip icon="diamond-outline" label="Gems" value={gems.toLocaleString()} />
            <StatChip icon="podium-outline" label="Rank" value={rank != null ? `#${rank}` : '—'} />
          </View>

          <Text style={styles.section}>Equipped</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Avatar" value={currentAvatar?.name ?? '—'} />
            <InfoRow label="Wings" value={wing?.name ?? 'None'} />
            <InfoRow label="Frame" value={frame?.name ?? 'Default'} />
          </View>

          <Text style={styles.section}>Badges</Text>
          {unlockedBadges.length === 0 ? (
            <Text style={styles.empty}>Win achievements to earn badges.</Text>
          ) : (
            <View style={styles.badgeGrid}>
              {unlockedBadges.map((badge) => (
                <View key={badge.id} style={styles.badge}>
                  <Ionicons
                    name={badge.icon as React.ComponentProps<typeof Ionicons>['name']}
                    size={18}
                    color={badge.color}
                  />
                  <Text style={styles.badgeLabel} numberOfLines={2}>{badge.title}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

function StatChip({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={16} color={GameColors.accentGold} />
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#02000A' },
  bg: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerSpacer: { width: 44 },
  title: { ...Typography.header, color: GameColors.textWhite, fontSize: 24 },
  scroll: { paddingHorizontal: 20, gap: 14 },
  hero: { alignItems: 'center', gap: 6, marginTop: 8 },
  username: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 22 },
  levelLine: { color: GameColors.accentGold, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  xpCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  xpLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  muted: { color: GameColors.textSecondary, fontSize: 12 },
  xpValue: { color: GameColors.accentGold, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  currencyRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipLabel: { color: GameColors.textSecondary, fontSize: 10 },
  chipValue: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 14 },
  section: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 4 },
  infoCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  infoLabel: { color: GameColors.textSecondary, fontSize: 13 },
  infoValue: { color: GameColors.textWhite, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  empty: { color: GameColors.textSecondary, fontSize: 13 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    width: '31%',
    minHeight: 76,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 4,
  },
  badgeLabel: { color: GameColors.textWhite, fontSize: 10, textAlign: 'center' },
});
