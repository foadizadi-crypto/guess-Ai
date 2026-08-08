/**
 * lobby.tsx — Main Menu (redesigned to match reference UI)
 *
 * Layout: full-screen, no scroll.
 *   • Header bar   — avatar chip + username, currency pills, settings
 *   • Hero section — game title / floating hero frame + avatar / right nav / PLAY
 *   • Bottom bar   — 5 nav tabs
 *
 * Features added:
 *   • Energy system — ⚡ pill shows current/max; PLAY is gated by energy
 *   • Daily reward auto-pop on focus when unclaimed
 *   • Spin FAB appears when free spin is ready
 *   • Hero avatar displayed with heroMode AvatarFrame (frame wings visible)
 */
import React, { useEffect, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
  BackHandler,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AvatarFrame } from '@/components/AvatarFrame';
import { DailyRewardModal } from '@/components/DailyRewardModal';
import { useUserStore } from '@/store/userStore';
import { useAudio } from '@/hooks/useAudio';
import { ROUTES } from '@/navigation/routes';
import { isToday } from '@/utils';
import { DEFAULT_AVATARS, DAILY_REWARDS } from '@/constants';
import { MAX_ENERGY, STAMINA_PER_GAME, STAMINA_AD_REWARD, STAMINA_ADS_PER_DAY, ENERGY_REFILL_INTERVAL_MIN } from '@/constants/economy';
import { useAdStore } from '@/store/adStore';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Design tokens ────────────────────────────────────────────────────────────
const PURPLE      = '#8B5CF6';
const PURPLE_MID  = '#6D28D9';
const PURPLE_DARK = '#3B0764';
const PURPLE_LT   = '#A78BFA';
const GOLD        = '#FFD700';
const BLUE_NEON   = '#38BDF8';
const GREEN       = '#4ADE80';
const BG          = '#02000A';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Compute the reward coins for today's unclaimed daily reward */
function computeTodayReward(streak: number, lastClaimed: string | null): number {
  const isConsecutive =
    lastClaimed !== null &&
    (() => {
      const last = new Date(lastClaimed);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return last.toDateString() === yesterday.toDateString();
    })();
  const newStreak = isConsecutive ? streak + 1 : 1;
  const cycleDay  = ((newStreak - 1) % 7) + 1;
  return (DAILY_REWARDS as any)[cycleDay - 1]?.coins ?? 15;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Top-bar currency pill */
const Pill: React.FC<{
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  val: string;
  badge?: boolean;
  onPress: () => void;
}> = ({ icon, color, val, badge, onPress }) => (
  <TouchableOpacity style={[styles.pill, { borderColor: `${color}40` }]} onPress={onPress} activeOpacity={0.75}>
    <Ionicons name={icon} size={12} color={color} />
    <Text style={[styles.pillVal, { color }]}>{val}</Text>
    {badge ? (
      <View style={styles.pillBadge} />
    ) : (
      <Ionicons name="add-circle" size={12} color={`${color}90`} />
    )}
  </TouchableOpacity>
);

/** Right-side vertical nav button */
const NavBtn: React.FC<{
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  onPress: () => void;
  badge?: boolean;
}> = ({ icon, label, color, onPress, badge }) => (
  <TouchableOpacity style={styles.navBtn} onPress={onPress} activeOpacity={0.8}>
    <LinearGradient
      colors={['rgba(88,28,135,0.55)', 'rgba(30,0,60,0.8)']}
      style={styles.navBtnGrad}
    >
      <View style={[styles.navBtnIconWrap, { borderColor: `${color}55` }]}>
        <Ionicons name={icon} size={22} color={color} />
        {badge && <View style={styles.badgeDot} />}
      </View>
      <Text style={[styles.navBtnLabel, { color }]} numberOfLines={1}>{label}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

/** Bottom nav tab */
const BotBtn: React.FC<{
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  badge?: boolean;
  center?: boolean;
}> = ({ icon, label, onPress, badge, center }) => (
  <TouchableOpacity style={[styles.botBtn, center && styles.botBtnCenter]} onPress={onPress} activeOpacity={0.8}>
    {center ? (
      <LinearGradient colors={[PURPLE, PURPLE_DARK]} style={styles.botBtnCenterGrad}>
        <Ionicons name={icon} size={22} color={GOLD} />
        {badge && <View style={[styles.badgeDot, { top: 2, right: 2 }]} />}
      </LinearGradient>
    ) : (
      <View style={styles.botBtnIconWrap}>
        <Ionicons name={icon} size={20} color={PURPLE_LT} />
        {badge && <View style={styles.badgeDot} />}
      </View>
    )}
    <Text style={[styles.botBtnLabel, center && { color: GOLD }]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LobbyScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const {
    username, coins, gems, level, selectedAvatarId,
    dailyReward, claimDailyReward,
    hasNewAchievement, equippedCosmetics,
    energy, staminaReserve, tickEnergy, spendEnergy, addStamina, canFreeSpin,
  } = useUserStore();
  const {
    showRewarded,
    canWatchStaminaAd, recordStaminaAdWatched,
    staminaAdsToday, lastStaminaAdDate,
  } = useAdStore();
  const { playMusic, stopMusic } = useAudio();

  useFocusEffect(useCallback(() => {
    playMusic('menu_music');
    return () => { stopMusic(); };
  }, [playMusic, stopMusic]));

  const [dailyModal,   setDailyModal]   = useState(false);
  const [dailyClaimed, setDailyClaimed] = useState(isToday(dailyReward.lastClaimed));
  const [spinReady,    setSpinReady]    = useState(false);
  const [adAvailable,  setAdAvailable]  = useState(false);
  const [watchingAd,   setWatchingAd]   = useState(false);

  // ── On focus: tick energy, check spin/daily/ad availability ─────────────────
  useFocusEffect(useCallback(() => {
    tickEnergy();
    setSpinReady(canFreeSpin());
    setAdAvailable(canWatchStaminaAd());
    const claimed = isToday(dailyReward.lastClaimed);
    setDailyClaimed(claimed);
    // Auto-pop daily reward modal after a short entrance delay
    if (!claimed) {
      const t = setTimeout(() => setDailyModal(true), 900);
      return () => clearTimeout(t);
    }
  }, [dailyReward.lastClaimed, tickEnergy, canFreeSpin, canWatchStaminaAd]));

  // ── Periodic energy tick (every 60 s while lobby is visible) ────────────────
  useEffect(() => {
    const id = setInterval(() => tickEnergy(), 60_000);
    return () => clearInterval(id);
  }, [tickEnergy]);

  // ── Animations ──────────────────────────────────────────────────────────────
  const headerOp  = useSharedValue(0);
  const heroOp    = useSharedValue(0);
  const heroY     = useSharedValue(24);
  const playPulse = useSharedValue(1);
  const avatarY   = useSharedValue(0);
  const ringOp    = useSharedValue(0.55);
  const spinPulse = useSharedValue(1);

  useEffect(() => {
    headerOp.value = withTiming(1, { duration: 480 });
    heroOp.value   = withDelay(200, withTiming(1, { duration: 520 }));
    heroY.value    = withDelay(200, withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) }));

    avatarY.value = withDelay(700, withRepeat(
      withSequence(
        withTiming(-10, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,   { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ), -1, false,
    ));

    playPulse.value = withDelay(900, withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(1,    { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      ), -1, false,
    ));

    ringOp.value = withRepeat(
      withSequence(
        withTiming(0.95, { duration: 1800 }),
        withTiming(0.35, { duration: 1800 }),
      ), -1, false,
    );

    spinPulse.value = withDelay(400, withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1,    { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ), -1, false,
    ));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hardware back ───────────────────────────────────────────────────────────
  useFocusEffect(useCallback(() => {
    if (Platform.OS !== 'android') return;
    const h = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert('Exit Game', 'Are you sure you want to exit BlurQuiz?', [
        { text: 'Stay',  style: 'cancel' },
        { text: 'Exit',  style: 'destructive', onPress: () => BackHandler.exitApp() },
      ], { cancelable: true });
      return true;
    });
    return () => h.remove();
  }, []));

  const nav = useCallback((route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }, [router]);

  // ── PLAY — costs STAMINA_PER_GAME stamina ───────────────────────────────────
  const handlePlay = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ok = spendEnergy(); // defaults to STAMINA_PER_GAME (10)
    if (!ok) {
      Alert.alert(
        '⚡ Not Enough Stamina',
        `Each round costs ${STAMINA_PER_GAME} stamina.\n\n` +
        `⚡ Active: ${energy}/${MAX_ENERGY}` +
        (staminaReserve > 0 ? `\n📦 Reserve: ${staminaReserve}` : '') +
        `\n\nActive stamina refills 1 point every ${ENERGY_REFILL_INTERVAL_MIN} minutes, ` +
        `or watch an ad to add ${STAMINA_AD_REWARD} to your reserve.`,
        [
          { text: 'OK', style: 'cancel' },
          { text: '💎 Shop', onPress: () => nav(ROUTES.SHOP) },
        ],
      );
      return;
    }
    router.push(ROUTES.LEVEL_SELECT as any);
  }, [spendEnergy, nav, router]);

  // ── Watch rewarded ad for +STAMINA_AD_REWARD stamina ────────────────────────
  const handleWatchAd = useCallback(async () => {
    if (!canWatchStaminaAd() || watchingAd) return;
    setWatchingAd(true);
    try {
      const success = await showRewarded();
      if (success) {
        addStamina(STAMINA_AD_REWARD);
        recordStaminaAdWatched();
        setAdAvailable(canWatchStaminaAd());
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setWatchingAd(false);
    }
  }, [canWatchStaminaAd, showRewarded, addStamina, recordStaminaAdWatched, watchingAd]);

  // ── Animated styles ─────────────────────────────────────────────────────────
  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOp.value }));
  const heroStyle   = useAnimatedStyle(() => ({ opacity: heroOp.value, transform: [{ translateY: heroY.value }] }));
  const playStyle   = useAnimatedStyle(() => ({ transform: [{ scale: playPulse.value }] }));
  const avatarStyle = useAnimatedStyle(() => ({ transform: [{ translateY: avatarY.value }] }));
  const ringStyle   = useAnimatedStyle(() => ({ opacity: ringOp.value }));
  const spinStyle   = useAnimatedStyle(() => ({ transform: [{ scale: spinPulse.value }] }));

  const avatar  = DEFAULT_AVATARS.find((a) => a.id === selectedAvatarId) ?? DEFAULT_AVATARS[0];
  const topPad  = Platform.OS === 'web' ? 16 : insets.top;
  const botPad  = Platform.OS === 'web' ? 0  : insets.bottom;

  // Hero avatar size — larger to make the frame frame prominent
  const heroAvatarSize = SH > 750 ? 130 : 108;

  // Today's unclaimed reward amount (computed fresh so it's accurate)
  const todayRewardCoins = computeTodayReward(dailyReward.streak, dailyReward.lastClaimed);

  // Active stamina colour — based on whether active alone covers a round
  const energyColor =
    energy < STAMINA_PER_GAME && staminaReserve < STAMINA_PER_GAME ? '#FF4444' :
    energy < STAMINA_PER_GAME ? '#FFB020' :
    energy <= 20              ? '#FFB020' : PURPLE_LT;

  // Stamina-ad remaining count
  const today = new Date().toISOString().slice(0, 10);
  const staminaAdsUsed = lastStaminaAdDate === today ? staminaAdsToday : 0;
  const staminaAdsLeft = STAMINA_ADS_PER_DAY - staminaAdsUsed;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>

      {/* ── Atmospheric glow layers ──────────────────────────────────────── */}
      <View style={styles.atmTop}    pointerEvents="none" />
      <View style={styles.atmCenter} pointerEvents="none" />
      <View style={styles.atmBot}    pointerEvents="none" />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.header, headerStyle]}>

        {/* Left: avatar chip */}
        <TouchableOpacity style={styles.userChip} onPress={() => nav(ROUTES.PROFILE)} activeOpacity={0.8}>
          <View style={styles.chipFrame}>
            <AvatarFrame
              imageKey={selectedAvatarId}
              frameId={equippedCosmetics?.frame}
              size={32}
              showLevel
              level={level}
            />
          </View>
          <Text style={styles.chipName} numberOfLines={1}>{username || 'Player'}</Text>
          <Ionicons name="star" size={11} color={GOLD} />
        </TouchableOpacity>

        {/* Right: currencies */}
        <View style={styles.currRow}>
          <Pill icon="logo-usd"  color={GOLD}        val={formatNum(coins)} onPress={() => nav(ROUTES.SHOP)} />
          <Pill icon="diamond"   color={BLUE_NEON}   val={formatNum(gems)}  onPress={() => nav(ROUTES.SHOP)} />
          {/* ⚡ Active stamina pill — shows active/max */}
          <Pill
            icon="flash"
            color={energyColor}
            val={`${energy}/${MAX_ENERGY}`}
            badge={energy < STAMINA_PER_GAME}
            onPress={() => nav(ROUTES.SHOP)}
          />
          {/* 📦 Reserve pill — only shown when reserve > 0 */}
          {staminaReserve > 0 && (
            <TouchableOpacity
              style={[styles.pill, styles.reservePill]}
              onPress={() => nav(ROUTES.SHOP)}
              activeOpacity={0.75}
            >
              <Text style={styles.reservePillIcon}>📦</Text>
              <Text style={styles.reservePillText}>Reserve {staminaReserve}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.gearBtn} onPress={() => nav(ROUTES.SETTINGS)}>
            <Ionicons name="settings-outline" size={18} color={PURPLE_LT} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Hero section ───────────────────────────────────────────────── */}
      <Animated.View style={[styles.heroSection, heroStyle]}>

        {/* Left: title + avatar stage + PLAY */}
        <View style={styles.heroLeft}>

          {/* Game title */}
          <View style={styles.titleBlock}>
            <Text style={styles.titleMain}>BlurQuiz</Text>
            <View style={styles.titleSubRow}>
              <View style={styles.titleLine} />
              <Text style={styles.titleSub}>The Blur Challenge</Text>
              <View style={styles.titleLine} />
            </View>
          </View>

          {/* Avatar + platform */}
          <View style={styles.avatarStage}>
            {/* Floating hero avatar — heroMode lets frame wings extend outward */}
            <Animated.View style={[styles.avatarWrap, avatarStyle]}>
              <AvatarFrame
                imageKey={avatar.imageKey}
                frameId={equippedCosmetics?.frame}
                size={heroAvatarSize}
                showLevel
                level={level}
                heroMode
              />
            </Animated.View>

            {/* Neon platform rings */}
            <Animated.View style={[styles.ring1, ringStyle]} />
            <View style={styles.ring2} />
            <View style={styles.ring3} />

            {/* Spin FAB — glows gold when a free spin is ready */}
            {spinReady && (
              <Animated.View style={[styles.spinFab, spinStyle]}>
                <TouchableOpacity
                  style={styles.spinFabBtn}
                  onPress={() => nav(ROUTES.SPIN)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[GOLD, '#B45309']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.spinFabGrad}
                  >
                    <Ionicons name="refresh-circle" size={14} color="#000" />
                    <Text style={styles.spinFabText}>SPIN</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

          {/* PLAY button */}
          <Animated.View style={[styles.playWrap, playStyle]}>
            <TouchableOpacity
              style={styles.playOuter}
              onPress={handlePlay}
              activeOpacity={0.85}
              testID="play-button"
            >
              <LinearGradient
                colors={['#7C3AED', '#4C1D95', '#6D28D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.playGrad}
              >
                {/* Hex corner accents */}
                <View style={[styles.hexCorner, styles.hexTL]} />
                <View style={[styles.hexCorner, styles.hexTR]} />
                <View style={[styles.hexCorner, styles.hexBL]} />
                <View style={[styles.hexCorner, styles.hexBR]} />

                <Ionicons name="diamond" size={18} color={GOLD} />
                <Text style={styles.playText}>PLAY</Text>

                {/* Stamina cost indicator inside PLAY button */}
                <View style={styles.playEnergy}>
                  <Ionicons name="flash" size={10} color={energyColor} />
                  <Text style={[styles.playEnergyText, { color: energyColor }]}>
                    {energy}/{MAX_ENERGY}
                    {staminaReserve > 0 ? ` + 📦${staminaReserve}` : ''}
                    {' · '}{STAMINA_PER_GAME}/round
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Watch Ad for +STAMINA_AD_REWARD stamina — visible when ads remain today */}
          {adAvailable && (
            <TouchableOpacity
              style={[styles.adBtn, watchingAd && { opacity: 0.5 }]}
              onPress={handleWatchAd}
              activeOpacity={0.8}
              disabled={watchingAd}
            >
              <Ionicons name="play-circle" size={13} color={GREEN} />
              <Text style={styles.adBtnText}>
                {watchingAd ? 'Loading…' : `Watch Ad +${STAMINA_AD_REWARD}⚡  (${staminaAdsLeft}/${STAMINA_ADS_PER_DAY} left)`}
              </Text>
            </TouchableOpacity>
          )}

        </View>

        {/* Right nav column */}
        <View style={styles.rightNav}>
          <NavBtn icon="person"  label="PROFILE"      color={PURPLE_LT}  onPress={() => nav(ROUTES.PROFILE)} />
          <NavBtn icon="ribbon"  label="ACHIEVEMENTS" color={GOLD}       onPress={() => nav(ROUTES.ACHIEVEMENTS)} badge={hasNewAchievement} />
          <NavBtn icon="people"  label="FRIENDS"      color={BLUE_NEON}  onPress={() => nav(ROUTES.COLLECTIONS)} />
          <NavBtn icon="trophy"  label="LEADERBOARD"  color="#F59E0B"    onPress={() => nav(ROUTES.LEADERBOARD)} />
        </View>

      </Animated.View>

      {/* ── Bottom nav bar ─────────────────────────────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: botPad + 6 }]}>
        {/* SPIN tab gets a green badge when free spin is available */}
        <BotBtn icon="cart"        label="SHOP"         onPress={() => nav(ROUTES.SHOP)} />
        <BotBtn icon="sync-circle" label="SPIN"         onPress={() => nav(ROUTES.SPIN)} badge={spinReady} />
        <BotBtn icon="ribbon"      label="ACHIEVEMENTS" onPress={() => nav(ROUTES.ACHIEVEMENTS)} badge={hasNewAchievement} center />
        <BotBtn icon="calendar"    label="DAILY"        onPress={() => setDailyModal(true)} badge={!dailyClaimed} />
        <BotBtn icon="trophy"      label="LEADERBOARD"  onPress={() => nav(ROUTES.LEADERBOARD)} />
      </View>

      {/* Daily reward modal */}
      <DailyRewardModal
        visible={dailyModal}
        amount={todayRewardCoins}
        streak={dailyReward.streak}
        alreadyClaimed={dailyClaimed}
        onClaim={() => { claimDailyReward(); setDailyClaimed(true); }}
        onClose={() => setDailyModal(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const NAV_BTN_W = 72;

const styles = StyleSheet.create({

  root: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Atmospheric layers ────────────────────────────────────────────────────
  atmTop: {
    ...StyleSheet.absoluteFillObject,
    top: -SH * 0.15,
    alignSelf: 'center',
    width: SW * 0.9,
    height: SH * 0.45,
    borderRadius: 9999,
    backgroundColor: 'rgba(109, 40, 217, 0.13)',
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 80,
  },
  atmCenter: {
    ...StyleSheet.absoluteFillObject,
    top: SH * 0.3,
    left: SW * 0.1,
    width: SW * 0.8,
    height: SH * 0.4,
    borderRadius: 9999,
    backgroundColor: 'rgba(56, 189, 248, 0.04)',
  },
  atmBot: {
    ...StyleSheet.absoluteFillObject,
    bottom: -SH * 0.1,
    alignSelf: 'center',
    width: SW * 0.7,
    height: SH * 0.3,
    borderRadius: 9999,
    backgroundColor: 'rgba(109, 40, 217, 0.08)',
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139,92,246,0.2)',
    backgroundColor: 'rgba(4,0,15,0.7)',
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(88,28,135,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.45)',
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: SW * 0.38,
  },
  chipFrame: { borderRadius: 20, overflow: 'hidden' },
  chipName: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  currRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(30,0,60,0.8)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  pillVal: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 0.2,
  },
  pillBadge: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FF1744',
  },
  gearBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(88,28,135,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
  },

  // ── Hero ─────────────────────────────────────────────────────────────────
  heroSection: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 4,
  },
  heroLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },

  // Title
  titleBlock: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
  },
  titleMain: {
    fontSize: SH > 750 ? 42 : 34,
    fontFamily: 'Inter_700Bold',
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: PURPLE,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  titleSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(167,139,250,0.4)',
    maxWidth: 30,
  },
  titleSub: {
    color: PURPLE_LT,
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    letterSpacing: 1.5,
  },

  // Avatar stage
  avatarStage: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  avatarWrap: {
    zIndex: 10,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
    elevation: 20,
  },

  // Platform rings
  ring1: {
    position: 'absolute',
    bottom: '15%',
    alignSelf: 'center',
    width: SW * 0.42,
    height: SW * 0.12,
    borderRadius: 9999,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: BLUE_NEON,
    shadowColor: BLUE_NEON,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  ring2: {
    position: 'absolute',
    bottom: '12%',
    alignSelf: 'center',
    width: SW * 0.3,
    height: SW * 0.08,
    borderRadius: 9999,
    backgroundColor: 'rgba(56,189,248,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.35)',
  },
  ring3: {
    position: 'absolute',
    bottom: '10%',
    alignSelf: 'center',
    width: SW * 0.18,
    height: SW * 0.05,
    borderRadius: 9999,
    backgroundColor: 'rgba(56,189,248,0.15)',
  },

  // Spin FAB
  spinFab: {
    position: 'absolute',
    top: '8%',
    right: 0,
    zIndex: 20,
  },
  spinFabBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 20,
  },
  spinFabGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  spinFabText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 1,
    color: '#000',
  },

  // PLAY button
  playWrap: {
    width: '80%',
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 14,
  },
  playOuter: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: GOLD,
    overflow: 'hidden',
  },
  playGrad: {
    paddingVertical: SH > 750 ? 14 : 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    position: 'relative',
  },
  playText: {
    fontSize: SH > 750 ? 32 : 26,
    fontFamily: 'Inter_700Bold',
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 5,
    textShadowColor: 'rgba(255,255,255,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  playEnergy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  playEnergyText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  // Corner hex accent decorations
  hexCorner: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderColor: GOLD,
  },
  hexTL: { top: 4,  left: 4,  borderTopWidth: 2,    borderLeftWidth: 2  },
  hexTR: { top: 4,  right: 4, borderTopWidth: 2,    borderRightWidth: 2 },
  hexBL: { bottom: 4, left: 4,  borderBottomWidth: 2, borderLeftWidth: 2  },
  hexBR: { bottom: 4, right: 4, borderBottomWidth: 2, borderRightWidth: 2 },

  // ── Right nav column ─────────────────────────────────────────────────────
  rightNav: {
    width: NAV_BTN_W + 8,
    paddingRight: 8,
    justifyContent: 'center',
    gap: 8,
  },
  navBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.45)',
  },
  navBtnGrad: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 5,
  },
  navBtnIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.15)',
    position: 'relative',
  },
  navBtnLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 7.5,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FF1744',
    borderWidth: 1.5,
    borderColor: BG,
  },

  // ── Bottom bar ───────────────────────────────────────────────────────────
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(4,0,15,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(139,92,246,0.35)',
  },
  botBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingBottom: 2,
  },
  botBtnCenter: {
    flex: 1.2,
    marginTop: -14,
  },
  botBtnCenterGrad: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: GOLD,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
    position: 'relative',
  },
  botBtnIconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  botBtnLabel: {
    color: PURPLE_LT,
    fontFamily: 'Inter_700Bold',
    fontSize: 8,
    letterSpacing: 0.7,
    textAlign: 'center',
  },

  // ── Stamina reserve pill (header) ────────────────────────────────────────
  reservePill: {
    backgroundColor: 'rgba(167,139,250,0.12)',
    borderColor: 'rgba(167,139,250,0.35)',
    gap: 3,
  },
  reservePillIcon: {
    fontSize: 11,
    lineHeight: 14,
  },
  reservePillText: {
    color: '#A78BFA',
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },

  // ── Watch-ad stamina button (below PLAY) ──────────────────────────────────
  adBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.35)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 4,
  },
  adBtnText: {
    color: '#4ADE80',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
