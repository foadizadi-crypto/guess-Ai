import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AnimatedGradientBackground } from '@/components/AnimatedGradientBackground';
import { GoldParticles } from '@/components/GoldParticles';
import { GlassCard } from '@/components/GlassCard';
import { GradientButton } from '@/components/GradientButton';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { storageService } from '@/services/StorageService';
import { ROUTES } from '@/navigation/routes';

// ─── Helper ───────────────────────────────────────────────────────────────

const generateGuestUsername = (): string => {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `Player${suffix}`;
};

// ─── Screen ───────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setUsername = useUserStore((s) => s.setUsername);

  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Entrance animations
  const cardY = useSharedValue(60);
  const cardOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardY.value }],
    opacity: cardOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  // ── Auto-skip if username already saved ─────────────────────────────────
  useEffect(() => {
    const check = async () => {
      const saved = await storageService.loadUsername();
      if (saved) {
        setUsername(saved);
        router.replace(ROUTES.LOBBY);
        return;
      }
      setLoading(false);
      // Run entrance animations
      logoOpacity.value = withTiming(1, { duration: 400 });
      logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      cardOpacity.value = withDelay(250, withTiming(1, { duration: 500 }));
      cardY.value = withDelay(
        250,
        withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
      );
    };
    check();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Play as Guest ────────────────────────────────────────────────────────
  const handleGuest = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const guest = generateGuestUsername();
    setUsername(guest);
    await storageService.saveUsername(guest);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(ROUTES.LOBBY);
  }, [setUsername, router]);

  // ── Google Sign In (placeholder) ─────────────────────────────────────────
  const handleGoogle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoogleLoading(true);
    setTimeout(() => {
      setGoogleLoading(false);
      Alert.alert(
        'Coming Soon',
        'Google Sign-In will be available in a future update!',
        [{ text: 'OK', style: 'default' }],
      );
    }, 600);
  }, []);

  const topPad = Platform.OS === 'web' ? 60 : insets.top;
  const botPad = Platform.OS === 'web' ? 40 : insets.bottom;

  if (loading) return null;

  return (
    <AnimatedGradientBackground>
      {/* Gold particles float in background */}
      <GoldParticles />

      <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
        {/* ── Logo ────────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.logoArea, logoStyle]}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoW}>B</Text>
            <Text style={styles.logoG}>Q</Text>
          </View>
          <Text style={styles.appName}>BlurQuiz</Text>
          <Text style={styles.tagline}>GUESS WHAT YOU SEE</Text>
        </Animated.View>

        {/* ── Glassmorphism login card ─────────────────────────────────────── */}
        <Animated.View style={[styles.cardWrap, cardStyle]}>
          <GlassCard intensity={22} padding={28} style={styles.card}>
            {/* Welcome text */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Welcome!</Text>
              <Text style={styles.cardSub}>Choose how you'd like to play</Text>
            </View>

            {/* ── Play as Guest ────────────────────────────────────────────── */}
            <GradientButton
              title="Play as Guest"
              onPress={handleGuest}
              style={styles.guestBtn}
              testID="guest-button"
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── Google Sign In ────────────────────────────────────────────── */}
            <TouchableOpacity
              style={[styles.googleBtn, googleLoading && styles.googleBtnLoading]}
              onPress={handleGoogle}
              activeOpacity={0.8}
              disabled={googleLoading}
              testID="google-button"
            >
              <View style={styles.googleIcon}>
                <Ionicons
                  name={googleLoading ? 'hourglass-outline' : 'logo-google'}
                  size={20}
                  color={GameColors.textWhite}
                />
              </View>
              <Text style={styles.googleText}>
                {googleLoading ? 'Please wait…' : 'Continue with Google'}
              </Text>
              {!googleLoading && (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Soon</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Fine print */}
            <Text style={styles.finePrint}>
              By continuing you agree to our Terms of Service and Privacy Policy.
            </Text>
          </GlassCard>
        </Animated.View>
      </View>
    </AnimatedGradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoArea: { alignItems: 'center', gap: 12, paddingTop: 20 },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 26,
    backgroundColor: GameColors.card,
    borderWidth: 2.5,
    borderColor: GameColors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: GameColors.accentGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  logoW: {
    fontSize: 40,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: GameColors.textWhite,
    lineHeight: 48,
  },
  logoG: {
    fontSize: 40,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: GameColors.accentGold,
    lineHeight: 48,
  },
  appName: {
    ...Typography.header,
    color: GameColors.textWhite,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
    textShadowColor: GameColors.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  tagline: {
    ...Typography.small,
    color: GameColors.textSecondary,
    letterSpacing: 2.5,
  },

  // ── Card ────────────────────────────────────────────────────────────────
  cardWrap: { width: '100%', paddingBottom: 8 },
  card: { gap: 0 },
  cardHeader: { marginBottom: 24, gap: 6 },
  cardTitle: {
    ...Typography.semibold,
    color: GameColors.textWhite,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  cardSub: { ...Typography.caption, color: GameColors.textSecondary },

  // ── Guest button ─────────────────────────────────────────────────────────
  guestBtn: { width: '100%' },

  // ── Divider ──────────────────────────────────────────────────────────────
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: GameColors.border },
  dividerText: {
    ...Typography.small,
    color: GameColors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },

  // ── Google button ────────────────────────────────────────────────────────
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: GameColors.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  googleBtnLoading: { opacity: 0.65 },
  googleIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleText: {
    ...Typography.caption,
    color: GameColors.textWhite,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    flex: 1,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GameColors.coinBorder,
  },
  comingSoonText: {
    ...Typography.small,
    color: GameColors.accentGold,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },

  // ── Fine print ────────────────────────────────────────────────────────────
  finePrint: {
    ...Typography.small,
    color: 'rgba(176,176,176,0.6)',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 16,
    fontSize: 11,
  },
});
