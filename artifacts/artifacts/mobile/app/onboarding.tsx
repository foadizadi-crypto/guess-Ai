import React, { useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Dimensions,
  Platform,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
  SharedValue,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AnimatedGradientBackground } from '@/components/AnimatedGradientBackground';
import { GradientButton } from '@/components/GradientButton';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { storageService } from '@/services/StorageService';
import { ROUTES } from '@/navigation/routes';

const { width: SW } = Dimensions.get('window');

// ─── Slide data ───────────────────────────────────────────────────────────

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'eye-outline',
    iconColor: GameColors.accentGold,
    bgColor: 'rgba(255,215,0,0.08)',
    title: 'Blur & Guess',
    description: 'Each round reveals a blurry mystery image. Guess what it is before the timer runs out!',
  },
  {
    id: '2',
    icon: 'bulb-outline',
    iconColor: GameColors.accentOrange,
    bgColor: 'rgba(255,107,53,0.08)',
    title: 'Use Hints Wisely',
    description: 'Stuck? Spend coins to reduce the blur — but every hint costs you score points!',
  },
  {
    id: '3',
    icon: 'trophy-outline',
    iconColor: GameColors.accentGreen,
    bgColor: 'rgba(0,230,118,0.08)',
    title: 'Compete & Win',
    description: 'Earn XP, level up, unlock avatars, and battle your way to the top of the leaderboard!',
  },
  {
    id: '4',
    icon: 'gift-outline',
    iconColor: '#CE93D8',
    bgColor: 'rgba(206,147,216,0.08)',
    title: 'Daily Rewards',
    description: 'Log in every day to claim increasing coin bonuses. Streak higher for bigger rewards!',
  },
];

// ─── Animated pagination dot ──────────────────────────────────────────────

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

interface PaginationDotProps {
  index: number;
  scrollX: SharedValue<number>;
  color: string;
}

const PaginationDot: React.FC<PaginationDotProps> = ({ index, scrollX, color }) => {
  const style = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * SW, index * SW, (index + 1) * SW];

    const dotWidth = interpolate(
      scrollX.value,
      inputRange,
      [8, 28, 8],
      Extrapolation.CLAMP,
    );
    const dotOpacity = interpolate(
      scrollX.value,
      inputRange,
      [0.35, 1, 0.35],
      Extrapolation.CLAMP,
    );

    return { width: dotWidth, opacity: dotOpacity };
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color },
        style,
      ]}
    />
  );
};

// ─── Single slide ─────────────────────────────────────────────────────────

const SlideView: React.FC<{ slide: Slide; index: number; scrollX: SharedValue<number> }> = ({
  slide,
  index,
  scrollX,
}) => {
  const animStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * SW, index * SW, (index + 1) * SW];
    const opacity = interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], Extrapolation.CLAMP);
    const scale = interpolate(scrollX.value, inputRange, [0.88, 1, 0.88], Extrapolation.CLAMP);
    const translateY = interpolate(scrollX.value, inputRange, [24, 0, 24], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }, { translateY }] };
  });

  return (
    <View style={[styles.slide, { width: SW }]}>
      <Animated.View style={animStyle}>
        {/* Image placeholder */}
        <View style={[styles.imagePlaceholder, { backgroundColor: slide.bgColor }]}>
          <View style={[styles.iconRing, { borderColor: slide.iconColor }]}>
            <Ionicons name={slide.icon} size={72} color={slide.iconColor} />
          </View>
          {/* Corner accents */}
          <View style={[styles.cornerTL, { borderColor: slide.iconColor }]} />
          <View style={[styles.cornerBR, { borderColor: slide.iconColor }]} />
        </View>

        <View style={styles.slideText}>
          <Text style={[styles.slideTitle, { color: slide.iconColor }]}>{slide.title}</Text>
          <Text style={styles.slideDesc}>{slide.description}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);
  const currentIndex = useSharedValue(0);

  const topPad = Platform.OS === 'web' ? 60 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
    currentIndex.value = Math.round(event.contentOffset.x / SW);
  });

  const getCurrentIndex = () => Math.round(scrollX.value / SW);

  const goToSlide = useCallback((index: number) => {
    scrollRef.current?.scrollTo({ x: index * SW, animated: true });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleNext = useCallback(async () => {
    const idx = getCurrentIndex();
    if (idx >= SLIDES.length - 1) {
      await storageService.setOnboardingDone();
      router.replace(ROUTES.LOGIN);
    } else {
      goToSlide(idx + 1);
    }
  }, [goToSlide, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSkip = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await storageService.setOnboardingDone();
    router.replace(ROUTES.LOGIN);
  }, [router]);

  // Determine button label from scrollX
  const btnLabelStyle = useAnimatedStyle(() => {
    // This just triggers a re-check — actual label computed in render
    return {};
  });

  // Track JS-side index for button label
  const [jsIndex, setJsIndex] = React.useState(0);
  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / SW);
      setJsIndex(i);
    },
    [],
  );

  const isLast = jsIndex === SLIDES.length - 1;
  const activeColor = SLIDES[jsIndex]?.iconColor ?? GameColors.accentGold;

  return (
    <AnimatedGradientBackground>
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
        {/* ── Skip always visible ───────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* ── Swipeable slides ──────────────────────────────────────────── */}
        <AnimatedScrollView
          ref={scrollRef as React.RefObject<Animated.ScrollView>}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleScrollEnd}
          decelerationRate="fast"
          bounces={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {SLIDES.map((slide, index) => (
            <SlideView
              key={slide.id}
              slide={slide}
              index={index}
              scrollX={scrollX}
            />
          ))}
        </AnimatedScrollView>

        {/* ── Pagination dots ───────────────────────────────────────────── */}
        <View style={styles.pagination}>
          {SLIDES.map((slide, i) => (
            <TouchableOpacity key={slide.id} onPress={() => goToSlide(i)} hitSlop={8}>
              <PaginationDot
                index={i}
                scrollX={scrollX}
                color={slide.iconColor}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── CTA button ────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <GradientButton
            title={isLast ? 'Get Started' : 'Next'}
            onPress={handleNext}
            colors={[activeColor, GameColors.accentOrange] as unknown as readonly [string, string]}
            style={styles.cta}
          />
        </View>
      </View>
    </AnimatedGradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerSpacer: { width: 60 },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  skipText: {
    ...Typography.small,
    color: GameColors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
  scrollView: { flex: 1 },
  scrollContent: {},
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 32,
  },
  imagePlaceholder: {
    width: SW - 64,
    height: (SW - 64) * 0.85,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  iconRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cornerTL: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 24,
    height: 24,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRadius: 4,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 24,
    height: 24,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderRadius: 4,
  },
  slideText: { alignItems: 'center', gap: 12 },
  slideTitle: {
    ...Typography.header,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    fontSize: 28,
    lineHeight: 36,
  },
  slideDesc: {
    ...Typography.caption,
    color: GameColors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    minWidth: 8,
  },
  footer: { paddingHorizontal: 28, paddingBottom: 8 },
  cta: { width: '100%' },
});
