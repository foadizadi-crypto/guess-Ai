import React, { useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { CoinDisplay } from './CoinDisplay';
import { useRTL } from '@/hooks/useRTL';
import { DAILY_REWARDS } from '@/constants';

interface DailyRewardModalProps {
  visible: boolean;
  amount: number;
  streak: number;
  /** Index into DAILY_REWARDS of the reward claimable right now. */
  currentDay: number;
  alreadyClaimed: boolean;
  onClaim: () => void;
  onClose: () => void;
  /** Energy granted on claim (spec: +10 energy per daily reward). */
  energyReward?: number;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  visible,
  amount,
  streak,
  currentDay,
  alreadyClaimed,
  onClaim,
  onClose,
  energyReward = 0,
}) => {
  const { textAlign } = useRTL();
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  const trophyScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 14, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 250 });
      // Pulse trophy
      trophyScale.value = withSequence(
        withSpring(1.3, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 180 }),
      );
    } else {
      scale.value = withTiming(0.85, { duration: 200 });
      opacity.value = withTiming(0, { duration: 180 });
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trophyScale.value }],
  }));

  const handleClaim = useCallback(() => {
    if (alreadyClaimed) { onClose(); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClaim();
  }, [alreadyClaimed, onClaim, onClose]);

  // Preview of the current claim day plus the next two, from the configured schedule
  const streakPreview = [0, 1, 2].map((offset) => {
    const idx = (currentDay + offset) % DAILY_REWARDS.length;
    return {
      day: DAILY_REWARDS[idx].day,
      coins: DAILY_REWARDS[idx].coins,
      active: offset === 0 && !alreadyClaimed,
    };
  });

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.card, containerStyle]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* Close */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={GameColors.textSecondary} />
            </TouchableOpacity>

            {/* Icon */}
            <Animated.View style={[styles.iconWrap, trophyStyle]}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name={alreadyClaimed ? 'checkmark-circle' : 'gift'}
                  size={48}
                  color={alreadyClaimed ? GameColors.accentGreen : GameColors.accentGold}
                />
              </View>
            </Animated.View>

            {/* Title */}
            <Text style={[styles.title, { textAlign }]}>
              {alreadyClaimed ? 'Already Claimed!' : 'Daily Reward'}
            </Text>
            <Text style={[styles.sub, { textAlign }]}>
              {alreadyClaimed
                ? 'Come back tomorrow for your next reward'
                : `Day ${streak + 1} Streak Bonus`}
            </Text>

            {/* Reward amount */}
            {!alreadyClaimed && (
              <View style={styles.rewardRow}>
                <CoinDisplay amount={amount} size="large" animate={visible} />
                {energyReward > 0 && (
                  <View style={styles.energyPill}>
                    <Text style={styles.energyText}>+{energyReward} ⚡</Text>
                  </View>
                )}
              </View>
            )}

            {/* Streak preview dots */}
            <View style={styles.streakRow}>
              {streakPreview.map((s) => (
                <View
                  key={s.day}
                  style={[
                    styles.streakDot,
                    s.active && styles.streakDotActive,
                  ]}
                >
                  <Ionicons
                    name="gift-outline"
                    size={14}
                    color={s.active ? GameColors.backgroundPrimary : GameColors.textSecondary}
                  />
                  <Text style={[styles.streakDay, s.active && styles.streakDayActive]}>
                    D{s.day}
                  </Text>
                </View>
              ))}
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[styles.claimBtn, alreadyClaimed && styles.claimBtnDone]}
              onPress={handleClaim}
              activeOpacity={0.85}
            >
              <Text style={styles.claimText}>
                {alreadyClaimed ? 'Close' : `Claim ${amount} Coins`}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: GameColors.card,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: GameColors.cardBorder,
    shadowColor: GameColors.accentGold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconWrap: { alignItems: 'center', marginBottom: 16, marginTop: 8 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderWidth: 2,
    borderColor: GameColors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GameColors.accentGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    ...Typography.header,
    color: GameColors.textWhite,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 6,
  },
  sub: {
    ...Typography.small,
    color: GameColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  rewardRow: { alignItems: 'center', marginBottom: 20, gap: 10 },
  energyPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderWidth: 1,
    borderColor: GameColors.accentOrange,
  },
  energyText: {
    ...Typography.caption,
    color: GameColors.accentOrange,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  streakDot: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GameColors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  streakDotActive: {
    backgroundColor: GameColors.accentGold,
    borderColor: GameColors.accentGold,
  },
  streakDay: {
    ...Typography.small,
    color: GameColors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  streakDayActive: { color: GameColors.backgroundPrimary },
  claimBtn: {
    backgroundColor: GameColors.accentGold,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: GameColors.accentGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  claimBtnDone: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    shadowOpacity: 0,
    elevation: 0,
  },
  claimText: {
    ...Typography.body,
    color: GameColors.backgroundPrimary,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
});
