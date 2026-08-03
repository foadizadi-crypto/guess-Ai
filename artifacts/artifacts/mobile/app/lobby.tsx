import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
  BackHandler,
  ScrollView,
  Animated as RNAnimated,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AnimatedGradientBackground } from '@/components/AnimatedGradientBackground';
import { CoinDisplay } from '@/components/CoinDisplay';
import { AvatarFrame } from '@/components/AvatarFrame';
import { ProgressBar } from '@/components/ProgressBar';
import { DailyRewardModal } from '@/components/DailyRewardModal';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { useAdStore, DAILY_AD_COOLDOWN_MS } from '@/store/adStore';
import { useAudio } from '@/hooks/useAudio';
import { ROUTES } from '@/navigation/routes';
import { calculateXPProgress, formatScore, isToday, xpInCurrentLevel, xpForCurrentLevel } from '@/utils';
import { GAME_CONSTANTS } from '@/constants';
import type { ConsumableId } from '@/constants/shopData';

// ─── Sub-components ───────────────────────────────────────────────────────

interface MainActionBtn {
  id: string;
  label: string;
  sublabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
  gradient?: boolean;
}

const MAIN_ACTIONS: MainActionBtn[] = [
  {
    id: 'play',
    label: 'Play Now',
    sublabel: 'Start a new game',
    icon: 'play-circle',
    color: GameColors.accentGold,
    route: ROUTES.LEVEL_SELECT,
    gradient: true,
  },
  {
    id: 'shop',
    label: 'Shop',
    sublabel: 'Hints & upgrades',
    icon: 'cart-outline',
    color: GameColors.accentOrange,
    route: ROUTES.SHOP,
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    sublabel: 'Top players',
    icon: 'trophy-outline',
    color: '#CE93D8',
    route: ROUTES.LEADERBOARD,
  },
];

interface BottomNavItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  route?: string;
  isHome?: boolean;
}

const BOTTOM_NAV: BottomNavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: 'home-outline',
    activeIcon: 'home',
    isHome: true,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: 'person-outline',
    activeIcon: 'person',
    route: ROUTES.PROFILE,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings-outline',
    activeIcon: 'settings',
    route: ROUTES.SETTINGS,
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────

export default function LobbyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    username, coins, xp, level, selectedAvatarId,
    bestScore, dailyReward, claimDailyReward,
    addCoins, addConsumable,
  } = useUserStore();
  const {
    isDailyAdAvailable,
    setLastDailyAdClaimed,
    showRewarded,
    isAdFreePassActive,
  } = useAdStore();
  const { playEffect, playMusic, stopMusic } = useAudio();

  // Play menu music whenever this screen is focused
  useFocusEffect(
    useCallback(() => {
      playMusic('menu_music');
      return () => { stopMusic(); };
    }, [playMusic, stopMusic]),
  );

  const xpProgress = calculateXPProgress(xp);
  const xpInLevel = xpInCurrentLevel(xp);
  const xpLevelCap = xpForCurrentLevel(level);

  const [dailyModalVisible, setDailyModalVisible] = useState(false);
  const [dailyClaimed, setDailyClaimed] = useState(isToday(dailyReward.lastClaimed));
  const [adLoading, setAdLoading] = useState(false);
  const [activeNav, setActiveNav] = useState<string>('home');
  const [, forceUpdate] = useState(0); // used to refresh cooldown timer display

  // ── Staggered entrance animations ────────────────────────────────────────
  const headerY = useSharedValue(-40);
  const headerOp = useSharedValue(0);
  const userCardY = useSharedValue(30);
  const userCardOp = useSharedValue(0);
  const actionsY = useSharedValue(40);
  const actionsOp = useSharedValue(0);
  const fabScale = useSharedValue(0);
  const fabPulse = useSharedValue(1);

  useEffect(() => {
    headerY.value = withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) });
    headerOp.value = withTiming(1, { duration: 420 });

    userCardY.value = withDelay(150, withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }));
    userCardOp.value = withDelay(150, withTiming(1, { duration: 420 }));

    actionsY.value = withDelay(280, withTiming(0, { duration: 440, easing: Easing.out(Easing.cubic) }));
    actionsOp.value = withDelay(280, withTiming(1, { duration: 440 }));

    fabScale.value = withDelay(500, withSpring(1, { damping: 10, stiffness: 120 }));

    // FAB pulse
    fabPulse.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hardware back → exit confirmation (Android) ───────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        Alert.alert(
          'Exit Game',
          'Are you sure you want to exit BlurQuiz?',
          [
            { text: 'Stay', style: 'cancel' },
            {
              text: 'Exit',
              style: 'destructive',
              onPress: () => BackHandler.exitApp(),
            },
          ],
          { cancelable: true },
        );
        return true; // prevent default
      });
      return () => handler.remove();
    }, []),
  );

  // ── Refresh cooldown display every 30 s while screen is focused ──────────
  useFocusEffect(
    useCallback(() => {
      const timer = setInterval(() => forceUpdate((n) => n + 1), 30_000);
      return () => clearInterval(timer);
    }, []),
  );

  // ── Daily Gift handler (spec §7.1) ────────────────────────────────────────
  // Cooldown: 4 hours.  Reward: 50-150 coins + 10% chance for a consumable.
  // Ad-free pass: grant instantly without showing an ad.
  const handleDailyGift = useCallback(async () => {
    if (adLoading || !isDailyAdAvailable()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAdLoading(true);
    try {
      const adFreeActive = isAdFreePassActive();
      const watched = adFreeActive ? true : await showRewarded();
      if (watched) {
        // Random coins 50-150 (spec §7.1)
        const coins = Math.floor(Math.random() * 101) + 50;
        addCoins(coins);
        // 10% chance for a bonus consumable
        if (Math.random() < 0.1) {
          const bonus: ConsumableId = Math.random() < 0.5 ? 'time_boost' : 'error_nullifier';
          addConsumable(bonus, 1);
        }
        setLastDailyAdClaimed();
        playEffect('coin');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        forceUpdate((n) => n + 1); // refresh cooldown display immediately
      }
    } finally {
      setAdLoading(false);
    }
  }, [adLoading, isDailyAdAvailable, isAdFreePassActive, showRewarded, addCoins, addConsumable, setLastDailyAdClaimed, playEffect]);

  // ── Daily reward ─────────────────────────────────────────────────────────
  const handleDailyReward = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDailyModalVisible(true);
  }, []);

  const handleClaimReward = useCallback(() => {
    claimDailyReward();
    setDailyClaimed(true);
  }, [claimDailyReward]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const navigateTo = useCallback(
    (route: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(route as any);
    },
    [router],
  );

  // ── Animated styles ───────────────────────────────────────────────────────
  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerY.value }],
    opacity: headerOp.value,
  }));
  const userCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: userCardY.value }],
    opacity: userCardOp.value,
  }));
  const actionsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: actionsY.value }],
    opacity: actionsOp.value,
  }));
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value * fabPulse.value }],
  }));

  const topPad = Platform.OS === 'web' ? 60 : insets.top;
  const botPad = Platform.OS === 'web' ? 80 : insets.bottom + 60; // space for bottom nav

  const nextReward =
    GAME_CONSTANTS.DAILY_REWARD_BASE + (dailyReward.streak + 1) * GAME_CONSTANTS.DAILY_REWARD_STREAK_BONUS;

  return (
    <AnimatedGradientBackground>
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ── Top bar ──────────────────────────────────────────────────── */}
          <Animated.View style={[styles.topBar, headerStyle]}>
            {/* Menu icon */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigateTo(ROUTES.SETTINGS)}
              activeOpacity={0.75}
            >
              <Ionicons name="menu-outline" size={24} color={GameColors.textWhite} />
            </TouchableOpacity>

            {/* Logo */}
            <View style={styles.logoWrap}>
              <Text style={styles.logoText}>BlurQuiz</Text>
            </View>

            {/* Right cluster: coins + settings */}
            <View style={styles.topRight}>
              <CoinDisplay amount={coins} size="small" animate />
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigateTo(ROUTES.SETTINGS)}
                activeOpacity={0.75}
              >
                <Ionicons name="settings-outline" size={22} color={GameColors.textSecondary} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ── User card ────────────────────────────────────────────────── */}
          <Animated.View style={userCardStyle}>
            <View style={styles.userCard}>
              <AvatarFrame imageKey={selectedAvatarId} size={56} showLevel level={level} />

              <View style={styles.userInfo}>
                <Text style={styles.username} numberOfLines={1}>
                  {username || 'Player'}
                </Text>

                <View style={styles.xpRow}>
                  <Text style={styles.xpLabel}>Level {level}</Text>
                  <Text style={styles.xpVal}>{xpInLevel}/{xpLevelCap === Infinity ? '∞' : xpLevelCap} XP</Text>
                </View>

                <ProgressBar
                  progress={xpProgress}
                  height={5}
                  color={GameColors.accentGold}
                  style={{ width: '100%' }}
                />
              </View>

              <View style={styles.bestScoreWrap}>
                <Text style={styles.bestScoreLabel}>Best</Text>
                <Text style={styles.bestScoreVal}>{formatScore(bestScore)}</Text>
              </View>
            </View>
          </Animated.View>

          {/* ── Main action buttons ───────────────────────────────────────── */}
          <Animated.View style={[styles.actionsWrap, actionsStyle]}>
            {/* Play Now — full width, prominent */}
            <TouchableOpacity
              style={styles.playBtn}
              onPress={() => navigateTo(ROUTES.LEVEL_SELECT)}
              activeOpacity={0.85}
              testID="play-button"
            >
              <View style={styles.playBtnInner}>
                <View style={styles.playBtnLeft}>
                  <View style={[styles.playBtnIcon, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                    <Ionicons name="play-circle" size={32} color={GameColors.backgroundPrimary} />
                  </View>
                  <View>
                    <Text style={styles.playBtnLabel}>Play Now</Text>
                    <Text style={styles.playBtnSub}>Start a new game</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={22} color="rgba(0,0,0,0.5)" />
              </View>
            </TouchableOpacity>

            {/* Secondary actions row */}
            <View style={styles.secondaryRow}>
              {/* Shop */}
              <ActionCard
                icon="cart-outline"
                label="Shop"
                sublabel="Hints & upgrades"
                color={GameColors.accentOrange}
                onPress={() => navigateTo(ROUTES.SHOP)}
              />

              {/* Leaderboard */}
              <ActionCard
                icon="trophy-outline"
                label="Leaderboard"
                sublabel="Top players"
                color="#CE93D8"
                onPress={() => navigateTo(ROUTES.LEADERBOARD)}
              />

              {/* Daily Reward */}
              <ActionCard
                icon={dailyClaimed ? 'checkmark-circle-outline' : 'gift-outline'}
                label="Daily"
                sublabel={dailyClaimed ? 'Claimed' : `+${nextReward}`}
                color={dailyClaimed ? GameColors.textSecondary : GameColors.accentGreen}
                onPress={() => navigateTo(ROUTES.DAILY_REWARD)}
                badge={!dailyClaimed}
              />
            </View>
          </Animated.View>

        </ScrollView>

        {/* ── Daily Gift FAB (spec §7.1) ────────────────────────────────── */}
        <DailyGiftFab
          onPress={handleDailyGift}
          loading={adLoading}
          available={isDailyAdAvailable()}
          adFree={isAdFreePassActive()}
          style={[styles.fabWrap, fabStyle, { bottom: botPad + 16 }]}
        />

        {/* ── Bottom navigation bar ─────────────────────────────────────── */}
        <View
          style={[
            styles.bottomNav,
            {
              paddingBottom: Platform.OS === 'web' ? 16 : insets.bottom + 8,
              bottom: 0,
            },
          ]}
        >
          {BOTTOM_NAV.map((item) => {
            const isActive = activeNav === item.id;
            const color = isActive ? GameColors.accentGold : GameColors.textSecondary;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.navItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveNav(item.id);
                  if (item.route) navigateTo(item.route);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.navIcon, isActive && styles.navIconActive]}>
                  <Ionicons
                    name={isActive ? item.activeIcon : item.icon}
                    size={22}
                    color={color}
                  />
                </View>
                <Text style={[styles.navLabel, { color }]}>{item.label}</Text>
                {isActive && <View style={styles.navDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Daily reward modal ──────────────────────────────────────────── */}
      <DailyRewardModal
        visible={dailyModalVisible}
        amount={nextReward}
        streak={dailyReward.streak}
        alreadyClaimed={dailyClaimed}
        onClaim={handleClaimReward}
        onClose={() => setDailyModalVisible(false)}
      />
    </AnimatedGradientBackground>
  );
}

// ─── Action card sub-component ────────────────────────────────────────────

interface ActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel: string;
  color: string;
  onPress: () => void;
  badge?: boolean;
}

const ActionCard: React.FC<ActionCardProps> = ({ icon, label, sublabel, color, onPress, badge }) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.actionIcon, { borderColor: color, shadowColor: color }]}>
      <Ionicons name={icon} size={26} color={color} />
      {badge && <View style={styles.badgeDot} />}
    </View>
    <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    <Text style={styles.actionSublabel}>{sublabel}</Text>
  </TouchableOpacity>
);

// ─── Daily Gift FAB sub-component (spec §7.1) ─────────────────────────────

function formatCooldownRemaining(lastTimestamp: number | null): string {
  if (lastTimestamp === null) return '';
  const elapsed = Date.now() - lastTimestamp;
  const remaining = Math.max(0, DAILY_AD_COOLDOWN_MS - elapsed);
  if (remaining === 0) return '';
  const totalMinutes = Math.ceil(remaining / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

interface DailyGiftFabProps {
  onPress: () => void;
  loading: boolean;
  available: boolean;
  adFree: boolean;
  style?: object | object[];
}

const DailyGiftFab: React.FC<DailyGiftFabProps> = ({ onPress, loading, available, adFree, style }) => {
  const { lastDailyAdTimestamp } = useAdStore();
  const cooldown = !available ? formatCooldownRemaining(lastDailyAdTimestamp) : '';

  const fabColor = available ? GameColors.accentGreen : 'rgba(100,100,100,0.6)';

  return (
    <Animated.View style={[styles.fabWrap, style]}>
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: fabColor }, (loading || !available) && styles.fabLoading]}
        onPress={onPress}
        activeOpacity={0.85}
        disabled={loading || !available}
      >
        <Ionicons
          name={loading ? 'hourglass-outline' : available ? 'gift-outline' : 'time-outline'}
          size={16}
          color={available ? GameColors.backgroundPrimary : GameColors.textSecondary}
        />
        <Text style={[styles.fabText, !available && { color: GameColors.textSecondary }]}>
          {loading
            ? 'Loading…'
            : available
            ? adFree ? 'Free Lucky Spin ⚡' : 'Free Lucky Spin'
            : `Lucky Spin ${cooldown}`}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  container: {
    paddingHorizontal: 20,
    gap: 16,
  },

  // ── Top bar ────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GameColors.border,
  },
  logoWrap: { flex: 1, alignItems: 'center' },
  logoText: {
    ...Typography.semibold,
    color: GameColors.textWhite,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
    textShadowColor: GameColors.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // ── User card ──────────────────────────────────────────────────────────
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: GameColors.border,
  },
  userInfo: { flex: 1, gap: 5 },
  username: {
    ...Typography.bodyMedium,
    color: GameColors.textWhite,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpLabel: { ...Typography.small, color: GameColors.textSecondary, fontFamily: 'Inter_500Medium' },
  xpVal: { ...Typography.small, color: GameColors.accentGold, fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
  bestScoreWrap: { alignItems: 'center', gap: 2 },
  bestScoreLabel: { ...Typography.small, color: GameColors.textSecondary, fontSize: 10 },
  bestScoreVal: {
    ...Typography.bodyMedium,
    color: GameColors.accentGold,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },

  // ── Actions ────────────────────────────────────────────────────────────
  actionsWrap: { gap: 12 },

  playBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: GameColors.accentGold,
    shadowColor: GameColors.accentGold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  playBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  playBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  playBtnIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnLabel: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: GameColors.backgroundPrimary,
    lineHeight: 26,
  },
  playBtnSub: {
    ...Typography.small,
    color: 'rgba(0,0,0,0.55)',
    fontFamily: 'Inter_500Medium',
  },

  secondaryRow: { flexDirection: 'row', gap: 10 },

  actionCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: GameColors.border,
    position: 'relative',
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  actionLabel: {
    ...Typography.small,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  actionSublabel: {
    ...Typography.small,
    color: GameColors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GameColors.accentRed,
    borderWidth: 1.5,
    borderColor: GameColors.backgroundPrimary,
  },

  // ── Banner ─────────────────────────────────────────────────────────────
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  bannerText: {
    ...Typography.small,
    color: 'rgba(176,176,176,0.5)',
    fontFamily: 'Inter_500Medium',
  },

  // ── FAB ────────────────────────────────────────────────────────────────
  fabWrap: {
    position: 'absolute',
    right: 20,
    zIndex: 50,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GameColors.accentGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: GameColors.accentGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabLoading: { opacity: 0.65 },
  fabText: {
    ...Typography.small,
    color: GameColors.backgroundPrimary,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },

  // ── Bottom nav ─────────────────────────────────────────────────────────
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(13,2,33,0.92)',
    borderTopWidth: 1,
    borderTopColor: GameColors.border,
  },
  navItem: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 16,
    paddingVertical: 4,
    minWidth: 64,
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconActive: {
    backgroundColor: 'rgba(255,215,0,0.12)',
  },
  navLabel: {
    ...Typography.small,
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    lineHeight: 14,
  },
  navDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GameColors.accentGold,
  },
});
