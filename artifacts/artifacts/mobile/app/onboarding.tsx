/**
 * onboarding.tsx — Welcome / intro sequence (3 screens)
 *
 * Welcome → Game introduction → Tutorial
 */
import React, { useRef, useCallback, useState } from 'react';
import {
  Dimensions,
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hapticsService } from '@/services/HapticsService';
import { GradientButton } from '@/components/GradientButton';
import { storageService } from '@/services/StorageService';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { ROUTES } from '@/navigation/routes';

const { width: SW, height: SH } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'sparkles' as const,
    title: 'Welcome to GUESSAi',
    body: 'Train your eye, beat the blur, and climb the global ranks.',
    colors: ['#1a0533', '#3d0f6b', '#0D0221'] as const,
  },
  {
    id: '2',
    icon: 'eye' as const,
    title: 'Guess What You See',
    body: 'Images start heavily blurred. Answer fast to earn coins, XP, and combo bonuses.',
    colors: ['#0f2847', '#1e4a7a', '#0D0221'] as const,
  },
  {
    id: '3',
    icon: 'school' as const,
    title: 'Quick Tutorial',
    body: 'Pick a category and difficulty, use power-ups wisely, and claim daily rewards from the lobby.',
    colors: ['#2a1030', '#5c1a4a', '#0D0221'] as const,
  },
] as const;

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

  const finish = useCallback(async () => {
    try {
      hapticsService.impact(1);
      await storageService.setOnboardingDone();
    } catch (error) {
      console.error('[Onboarding] could not persist completion flag:', error);
    } finally {
      router.replace(ROUTES.LOGIN);
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
      <AnimatedScrollView
        ref={scrollRef as React.RefObject<ScrollView>}
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
          <LinearGradient
            key={slide.id}
            colors={[...slide.colors]}
            style={{ width: SW, height: SH, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 36 }}
          >
            <View style={styles.iconRing}>
              <Ionicons name={slide.icon} size={56} color={GameColors.accentGold} />
            </View>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideBody}>{slide.body}</Text>
          </LinearGradient>
        ))}
      </AnimatedScrollView>

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View style={{ flex: 1 }} />
        {!isLast && (
          <TouchableOpacity style={styles.skipBtn} onPress={finish} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: botPad }]}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <TouchableOpacity key={slide.id} onPress={() => goTo(i)} hitSlop={10}>
              <Dot index={i} scrollX={scrollX} />
            </TouchableOpacity>
          ))}
        </View>
        <GradientButton
          title={isLast ? 'Get Started' : 'Next'}
          onPress={handleNext}
          colors={[GameColors.accentGold, GameColors.accentOrange] as unknown as readonly [string, string]}
          style={styles.cta}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0221' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
  iconRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.45)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  slideTitle: {
    ...Typography.header,
    color: GameColors.textWhite,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 14,
  },
  slideBody: {
    ...Typography.bodyMedium,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 16,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
