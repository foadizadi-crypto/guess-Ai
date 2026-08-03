/**
 * AchievementToast — slides up from the bottom to announce a newly unlocked
 * achievement.  Multiple unlocks are queued and shown one at a time.
 */
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import type { AchievementDef } from '@/constants/achievements';

interface Props {
  queue: AchievementDef[];
  onItemShown: () => void; // called after each item to advance the queue
}

const SHOW_DURATION   = 2800;  // ms the toast stays fully visible
const SLIDE_IN_MS     = 320;
const SLIDE_OUT_MS    = 280;

export const AchievementToast: React.FC<Props> = ({ queue, onItemShown }) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(120);
  const opacity    = useSharedValue(0);
  const current    = queue[0] ?? null;
  const isAnimating = useRef(false);

  const animate = useCallback(() => {
    if (!current || isAnimating.current) return;
    isAnimating.current = true;

    // slide in
    translateY.value = 120;
    opacity.value    = 0;
    translateY.value = withTiming(0,   { duration: SLIDE_IN_MS });
    opacity.value    = withTiming(1,   { duration: SLIDE_IN_MS });

    // after visible period → slide out → notify parent
    translateY.value = withDelay(
      SLIDE_IN_MS + SHOW_DURATION,
      withSequence(
        withTiming(120, { duration: SLIDE_OUT_MS }),
      ),
    );
    opacity.value = withDelay(
      SLIDE_IN_MS + SHOW_DURATION,
      withTiming(0, { duration: SLIDE_OUT_MS }, (finished) => {
        if (finished) {
          isAnimating.current = false;
          runOnJS(onItemShown)();
        }
      }),
    );
  }, [current, onItemShown, opacity, translateY]);

  useEffect(() => {
    if (current) animate();
  }, [current, animate]);

  const toastStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!current) return null;

  const color = current.color ?? GameColors.accentGold;
  const bottomOffset = (insets.bottom || 16) + 80; // above bottom nav

  return (
    <Animated.View style={[styles.toast, { bottom: bottomOffset }, toastStyle]}>
      {/* Colored glow strip on left */}
      <View style={[styles.strip, { backgroundColor: color }]} />

      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
        <Ionicons
          name={current.icon as React.ComponentProps<typeof Ionicons>['name']}
          size={22}
          color={color}
        />
      </View>

      {/* Text */}
      <View style={styles.textWrap}>
        <Text style={styles.label}>🏆 Achievement Unlocked!</Text>
        <Text style={[styles.title, { color }]} numberOfLines={1}>{current.title}</Text>
        <Text style={styles.desc} numberOfLines={1}>{current.description}</Text>
      </View>

      {/* Rewards */}
      <View style={styles.rewards}>
        <Text style={styles.reward}>+{current.rewardCoins}🪙</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(26,11,46,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 200,
    overflow: 'hidden',
  },
  strip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 2,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  textWrap: { flex: 1, gap: 1 },
  label: {
    ...Typography.small,
    color: GameColors.textSecondary,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: 'Inter_600SemiBold',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    lineHeight: 18,
  },
  desc: {
    ...Typography.small,
    color: GameColors.textSecondary,
    fontSize: 10,
  },
  rewards: { alignItems: 'flex-end', gap: 3, flexShrink: 0 },
  reward: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: GameColors.accentGold,
  },
});
