import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedGradientBackground } from '@/components/AnimatedGradientBackground';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { storageService } from '@/services/StorageService';
import { ROUTES } from '@/navigation/routes';
import { waitForAuthReady, completeRedirectSignIn } from '@/services/authService';
import { fetchRegisteredNickname } from '@/services/nicknameService';
import { useUserStore } from '@/store/userStore';

// ─── Single loading dot ────────────────────────────────────────────────────

const LoadingDot: React.FC<{ delay: number }> = ({ delay }) => {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withSpring(1.4, { damping: 6, stiffness: 300 }),
          withSpring(0.7, { damping: 8, stiffness: 200 }),
        ),
        -1,
        true,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 320 }),
          withTiming(0.3, { duration: 320 }),
        ),
        -1,
        true,
      ),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, style]} />;
};

// ─── Screen ───────────────────────────────────────────────────────────────

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const navigated = useRef(false);

  // Logo — elastic spring overshoot
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const logoRotate = useSharedValue(-8);

  // Tagline
  const taglineY = useSharedValue(24);
  const taglineOpacity = useSharedValue(0);

  // Glow ring pulse
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.5);

  useEffect(() => {
    // ── Logo elastic pop ──────────────────────────────────────────────────
    logoOpacity.value = withTiming(1, { duration: 250 });
    logoScale.value = withSpring(1, { damping: 7, stiffness: 80, mass: 1.2 }); // visible overshoot
    logoRotate.value = withSpring(0, { damping: 8, stiffness: 90 });

    // ── Tagline slides up ─────────────────────────────────────────────────
    taglineOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    taglineY.value = withDelay(
      600,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );

    // ── Glow ring breathes ────────────────────────────────────────────────
    ringScale.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    ringOpacity.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );

    // ── Navigate after 3s ─────────────────────────────────────────────────
    const timer = setTimeout(async () => {
      if (navigated.current) return;
      navigated.current = true;
      try {
        // Complete a pending web redirect sign-in (if the player just came
        // back from Google) before deciding where to route.
        await completeRedirectSignIn();

        const [done, user] = await Promise.all([
          storageService.isOnboardingDone(),
          waitForAuthReady(),
        ]);

        if (!done) {
          router.replace(ROUTES.ONBOARDING);
          return;
        }
        if (!user) {
          // No Google session — Google Sign-In is mandatory, there is no
          // guest path.
          router.replace(ROUTES.LOGIN);
          return;
        }

        // Signed in: restore this account's registered nickname (if any)
        // so a returning player never sees the nickname modal again.
        // Never trust a leftover local `username` from a previous account on
        // this device — only a nickname verified for THIS uid counts.
        if (!useUserStore.getState().isNicknameVerifiedFor(user.uid)) {
          const nickname = await fetchRegisteredNickname();
          if (nickname) useUserStore.getState().setVerifiedNickname(user.uid, nickname);
        }
        router.replace(ROUTES.LOBBY);
      } catch (err) {
        // Never strand the player on the splash screen: if the startup
        // check fails we cannot tell where they belong, so send them
        // through onboarding rather than leaving the logo spinning forever.
        console.warn('[Splash] startup check failed', err);
        router.replace(ROUTES.ONBOARDING);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const topPad = Platform.OS === 'web' ? 60 : insets.top;
  const botPad = Platform.OS === 'web' ? 40 : insets.bottom;

  return (
    <AnimatedGradientBackground>
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad + 32 }]}>
        {/* ── Logo area ─────────────────────────────────────────────────── */}
        <View style={styles.logoSection}>
          {/* Glow ring behind logo */}
          <Animated.View style={[styles.glowRing, ringStyle]} />

          <Animated.View style={[styles.logoWrap, logoStyle]}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoLetterW}>B</Text>
              <Text style={styles.logoLetterGold}>Q</Text>
            </View>
          </Animated.View>

          <Animated.View style={taglineStyle}>
            <Text style={styles.appName}>BlurQuiz</Text>
            <Text style={styles.tagline}>GUESS WHAT YOU SEE</Text>
          </Animated.View>
        </View>

        {/* ── Loading dots ──────────────────────────────────────────────── */}
        <View style={styles.dotsRow}>
          <LoadingDot delay={0} />
          <LoadingDot delay={160} />
          <LoadingDot delay={320} />
        </View>
      </View>
    </AnimatedGradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  glowRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    borderColor: GameColors.accentGold,
    backgroundColor: 'rgba(255,215,0,0.06)',
  },
  logoWrap: { alignItems: 'center' },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: GameColors.card,
    borderWidth: 2.5,
    borderColor: GameColors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: GameColors.accentGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 14,
  },
  logoLetterW: {
    fontSize: 44,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: GameColors.textWhite,
    lineHeight: 52,
  },
  logoLetterGold: {
    fontSize: 44,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: GameColors.accentGold,
    lineHeight: 52,
  },
  appName: {
    ...Typography.title,
    color: GameColors.textWhite,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 3,
    textAlign: 'center',
    textShadowColor: GameColors.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    marginTop: 20,
  },
  tagline: {
    ...Typography.small,
    color: GameColors.textSecondary,
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: 6,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GameColors.accentGold,
  },
});
