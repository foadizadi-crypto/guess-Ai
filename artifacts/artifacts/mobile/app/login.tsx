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
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { ROUTES } from '@/navigation/routes';
import { signInWithGoogle, GoogleSignInError, getPlayerId } from '@/services/authService';
import { useGoogleSignIn, isNativeGoogleSignInConfigured } from '@/services/googleAuthNative';
import { fetchRegisteredNickname } from '@/services/nicknameService';

/**
 * Mandatory Google Sign-In — the only way into the game. There is no
 * "Play as Guest" path: every player must resolve to a Firebase Auth UID
 * before reaching the lobby, since that UID is the canonical playerId
 * every backend feature (nickname, leaderboard, sessions, push tokens…)
 * keys off of.
 */
export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setVerifiedNickname = useUserStore((s) => s.setVerifiedNickname);

  const [googleLoading, setGoogleLoading] = useState(false);
  const { configured: nativeConfigured, response, promptAsync } = useGoogleSignIn();

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

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 400 });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    cardOpacity.value = withDelay(250, withTiming(1, { duration: 500 }));
    cardY.value = withDelay(
      250,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Once we have a Firebase UID, restore any nickname already registered
   * for this account (returning player / second device) before entering
   * the lobby — so they never see the nickname modal twice. */
  const finishSignIn = useCallback(
    async () => {
      const existing = await fetchRegisteredNickname();
      const uid = getPlayerId();
      if (existing && uid) setVerifiedNickname(uid, existing);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(ROUTES.LOBBY);
    },
    [setVerifiedNickname, router],
  );

  // ── Native: handle the AuthSession response once Google redirects back ──
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!response) return;

    if (response.type === 'success') {
      const idToken = response.params?.id_token;
      if (!idToken) {
        setGoogleLoading(false);
        Alert.alert('Sign-In Failed', 'Google did not return a valid credential.');
        return;
      }
      (async () => {
        try {
          const { signInWithGoogleIdToken } = await import('@/services/authService');
          await signInWithGoogleIdToken(idToken);
          await finishSignIn();
        } catch (err) {
          console.warn('[Login] native Google sign-in failed:', err);
          Alert.alert('Sign-In Failed', 'Could not sign in with Google. Please try again.');
        } finally {
          setGoogleLoading(false);
        }
      })();
    } else if (response.type === 'error') {
      setGoogleLoading(false);
      Alert.alert('Sign-In Failed', 'Could not sign in with Google. Please try again.');
    } else if (response.type === 'dismiss' || response.type === 'cancel') {
      setGoogleLoading(false);
    }
  }, [response, finishSignIn]);

  const handleGoogle = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS === 'web') {
      setGoogleLoading(true);
      try {
        await signInWithGoogle();
        await finishSignIn();
      } catch (err) {
        if (err instanceof GoogleSignInError && err.code === 'popup_blocked') {
          // A redirect is already underway — the page will reload.
          return;
        }
        if (err instanceof GoogleSignInError && err.code === 'cancelled') {
          // Silent — the player just closed the popup.
        } else {
          console.warn('[Login] Google sign-in failed:', err);
          Alert.alert('Sign-In Failed', 'Could not sign in with Google. Please try again.');
        }
      } finally {
        setGoogleLoading(false);
      }
      return;
    }

    if (!nativeConfigured) {
      Alert.alert(
        'Google Sign-In Not Ready',
        "This build's Google OAuth client hasn't been finished yet in Google Cloud Console. Web sign-in is fully working in the meantime.",
      );
      return;
    }

    setGoogleLoading(true);
    try {
      await promptAsync();
    } catch (err) {
      console.warn('[Login] promptAsync failed:', err);
      setGoogleLoading(false);
      Alert.alert('Sign-In Failed', 'Could not open Google Sign-In. Please try again.');
    }
  }, [finishSignIn, nativeConfigured, promptAsync]);

  const topPad = Platform.OS === 'web' ? 60 : insets.top;
  const botPad = Platform.OS === 'web' ? 40 : insets.bottom;

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
              <Text style={styles.cardSub}>Sign in to start playing</Text>
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
                {googleLoading ? 'Signing in…' : 'Continue with Google'}
              </Text>
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
