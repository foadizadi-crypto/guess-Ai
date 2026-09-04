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
import { hapticsService } from '@/services/HapticsService';
import { AnimatedGradientBackground } from '@/components/AnimatedGradientBackground';
import { GoldParticles } from '@/components/GoldParticles';
import { GlassCard } from '@/components/GlassCard';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { preloadLobbyChrome } from '@/constants/lobbyAssets';
import { routeFromLaunchUrl } from '@/navigation/routes';
import { signInAsGuest, connectOrSignInWithGoogle, GoogleSignInError, getPlayerId, GOOGLE_SAVE_IN_USE_MESSAGE, isGuestUser, isGoogleUser, completeRedirectSignIn, isSignedInPlayer } from '@/services/authService';
import { fetchRegisteredNickname } from '@/services/nicknameService';
import * as Linking from 'expo-linking';

/**
 * Google or Guest sign-in. Guest gets a player id immediately (anonymous UID),
 * then the same nickname registration as Google. Connecting Google later
 * links that same player id.
 */
export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setVerifiedNickname = useUserStore((s) => s.setVerifiedNickname);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const busy = googleLoading || guestLoading;

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

  const finishSignIn = useCallback(async () => {
    const uid = getPlayerId();
    if (!uid) return;
    const store = useUserStore.getState();
    if (store.nicknameUid && store.nicknameUid !== uid) {
      store.resetUser();
    }
    const existing = await fetchRegisteredNickname();
    if (existing) setVerifiedNickname(uid, existing);
    hapticsService.notification(1);
    router.replace(routeFromLaunchUrl(await Linking.getInitialURL()) as Parameters<typeof router.replace>[0]);
  }, [setVerifiedNickname, router]);

  useEffect(() => {
    void preloadLobbyChrome();
    logoOpacity.value = withTiming(1, { duration: 400 });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    cardOpacity.value = withDelay(250, withTiming(1, { duration: 500 }));
    cardY.value = withDelay(
      250,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    void completeRedirectSignIn().then(async (uid) => {
      if (cancelled) return;
      if (uid || isSignedInPlayer()) {
        await finishSignIn();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [finishSignIn]);

  const handleGoogle = useCallback(async () => {
    if (busy) return;
    hapticsService.impact(0);
    setGoogleLoading(true);

    try {
      await connectOrSignInWithGoogle();
      await finishSignIn();
    } catch (err) {
      if (err instanceof GoogleSignInError && err.code === 'popup_blocked') {
        return;
      }
      if (err instanceof GoogleSignInError && err.code === 'cancelled') {
        return;
      }
      if (err instanceof GoogleSignInError && err.code === 'already_in_use') {
        Alert.alert('Google already in use', GOOGLE_SAVE_IN_USE_MESSAGE);
        return;
      }
      if (err instanceof GoogleSignInError && err.code === 'native_not_configured') {
        Alert.alert(
          'Google Sign-In Not Ready',
          "This build's Google OAuth client hasn't been finished yet in Google Cloud Console.",
        );
        return;
      }
      console.warn('[Login] Google sign-in failed:', err);
      Alert.alert('Sign-In Failed', 'Could not sign in with Google. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }, [busy, finishSignIn]);

  const handleGuest = useCallback(async () => {
    if (busy) return;
    hapticsService.impact(0);
    if (isGoogleUser() || isGuestUser()) {
      await finishSignIn();
      return;
    }
    setGuestLoading(true);
    try {
      await signInAsGuest();
      await finishSignIn();
    } catch (err) {
      console.warn('[Login] Guest sign-in failed:', err);
      const message = err instanceof GoogleSignInError
        ? err.message
        : 'Could not start as a guest. Please try again.';
      Alert.alert('Guest play unavailable', message);
    } finally {
      setGuestLoading(false);
    }
  }, [busy, finishSignIn, router]);

  const topPad = Platform.OS === 'web' ? 60 : insets.top;
  const botPad = Platform.OS === 'web' ? 40 : insets.bottom;

  return (
    <AnimatedGradientBackground>
      <GoldParticles />

      <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
        <Animated.View style={[styles.logoArea, logoStyle]}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoW}>B</Text>
            <Text style={styles.logoG}>Q</Text>
          </View>
          <Text style={styles.appName}>GUESSAi</Text>
          <Text style={styles.tagline}>GUESS WHAT YOU SEE</Text>
        </Animated.View>

        <Animated.View style={[styles.cardWrap, cardStyle]}>
          <GlassCard intensity={22} padding={28} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Welcome!</Text>
              <Text style={styles.cardSub}>Choose how to play</Text>
            </View>

            <TouchableOpacity
              style={[styles.googleBtn, busy && styles.googleBtnLoading]}
              onPress={handleGoogle}
              activeOpacity={0.8}
              disabled={busy}
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

            <TouchableOpacity
              style={[styles.guestBtn, busy && styles.googleBtnLoading]}
              onPress={handleGuest}
              activeOpacity={0.8}
              disabled={busy}
              testID="guest-button"
            >
              <View style={styles.googleIcon}>
                <Ionicons
                  name={guestLoading ? 'hourglass-outline' : 'person-outline'}
                  size={20}
                  color={GameColors.accentGold}
                />
              </View>
              <Text style={styles.googleText}>
                {guestLoading ? 'Starting…' : 'Continue as Guest'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.guestNote}>
              Guest progress stays on this player id. If you uninstall without connecting Google, that save is gone. Purchases require Google.
            </Text>

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
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: GameColors.accentGold,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 12,
    marginTop: 12,
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
  guestNote: {
    ...Typography.small,
    color: 'rgba(176,176,176,0.75)',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 14,
    fontSize: 11,
  },
  finePrint: {
    ...Typography.small,
    color: 'rgba(176,176,176,0.6)',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 16,
    fontSize: 11,
  },
});
