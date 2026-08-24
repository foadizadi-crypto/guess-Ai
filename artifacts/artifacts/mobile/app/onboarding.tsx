/**
 * onboarding.tsx — Welcome / intro sequence
 *
 * Displays the 3 full-screen onboarding images (assets/onboarding/).
 * Swipe horizontally or tap Next to advance; Skip jumps straight to login.
 */
import React, { useRef, useCallback, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hapticsService } from '@/services/HapticsService';
import { GradientButton } from '@/components/GradientButton';
import { storageService } from '@/services/StorageService';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Slide data ───────────────────────────────────────────────────────────────
const SLIDES = [
  { id: '1', image: require('@/assets/onboarding/1_onboarding-screen.webp') },
  { id: '2', image: require('@/assets/onboarding/2_onboarding-screen.webp') },
  { id: '3', image: require('@/assets/onboarding/3_onboarding-screen.webp') },
] as const;

// ─── Pagination dot ───────────────────────────────────────────────────────────
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

interface DotProps {
  index: number;
  scrollX: ReturnType<typeof useSharedValue<number>>;
}

const Dot: React.FC<DotProps> = ({ index, scrollX }) => {
  const style = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * SW, index * SW, (index + 1) * SW];
    return {
      width: interpolate(scrollX.value, inputRange, [8, 28, 8], Extrapolation.CLAMP),
      opacity: interpolate(scrollX.value, inputRange, [0.35, 1, 0.35], Extrapolation.CLAMP),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);
  const [jsIndex, setJsIndex] = useState<number>(0);

  const topPad = Platform.OS === 'web' ? 40 : insets.top;
  const botPad = Platform.OS === 'web' ? 32 : Math.max(insets.bottom, 16);

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const handleScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setJsIndex(Math.round(e.nativeEvent.contentOffset.x / SW));
  }, []);

  const goTo = useCallback((index: number) => {
    scrollRef.current?.scrollTo({ x: index * SW, animated: true });
    hapticsService.impact(0);
  }, []);

  // --- CRITICAL FLOW FIX: Connect finishing step directly to Global State App Flow Checkpoints ---
  // Reached by both "Next" on the last slide and by "Skip".
  const finish = useCallback(async () => {
    try {
      hapticsService.impact(1);

      // Record completion BEFORE navigating. app/splash.tsx reads this flag on
      // every cold start to decide where to send the player; without it the
      // intro replays on every single launch.
      await storageService.setOnboardingDone();
    } catch (error) {
      console.error('[Onboarding] could not persist completion flag:', error);
    } finally {
      router.replace('/login');
    }
  }, [router]);

  const handleNext = useCallback(async () => {
    if (jsIndex >= SLIDES.length - 1) {
      await finish();
    } else {
      goTo(jsIndex + 1);
    }
  }, [jsIndex, goTo, finish]);

  const isLast = jsIndex === SLIDES.length - 1;

  return (
    <View style={styles.root}>
      {/* ── Full-screen swipeable slides ─────────────────────────────────── */}
      <AnimatedScrollView
        ref={scrollRef as React.RefObject<any>}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScrollEnd}
        decelerationRate="fast"
        bounces={false}
        style={StyleSheet.absoluteFill}
      >
        {SLIDES.map((slide) => (
          <Image
            key={slide.id}
            source={slide.image}
            style={{ width: SW, height: SH }}
            resizeMode="cover"
          />
        ))}
      </AnimatedScrollView>

      {/* ── Dark gradient overlay (bottom 40% for readability) ───────────── */}
      <View style={styles.gradient} pointerEvents="none" />

      {/* ── Skip button (top-right) ──────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View style={{ flex: 1 }} />
        {!isLast && (
          <TouchableOpacity style={styles.skipBtn} onPress={finish} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Bottom controls ──────────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: botPad }]}>
        {/* Pagination dots */}
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <TouchableOpacity key={slide.id} onPress={() => goTo(i)} hitSlop={10}>
              <Dot index={i} scrollX={scrollX} />
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA button */}
        <GradientButton
          title={isLast ? 'Get Started 🎮' : 'Next'}
          onPress={handleNext}
          colors={[GameColors.accentGold, GameColors.accentOrange] as unknown as readonly [string, string]}
          style={styles.cta}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  gradient: {
    position: 'absolute',
    left: 0, 
    right: 0, 
    bottom: 0,
    height: SH * 0.38,
    backgroundColor: 'transparent',
  } as never,
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  skipText: {
    ...Typography.small,
    color: '#fff',
    fontFamily: 'Inter_500Medium',
  },
  footer: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: 28,
    gap: 20,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    minWidth: 8,
  },
  cta: { width: '100%' },
});
