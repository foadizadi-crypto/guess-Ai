import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { hapticsService } from '@/services/HapticsService';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { CoinDisplay } from '@/components/CoinDisplay';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { DAILY_REWARDS } from '@/constants';
import { dailyWeekStreak, getDailyWeekPowerUpLabel } from '@/constants/economy';
import { useUserStore } from '@/store/userStore';
import { getTodayUTCString, getYesterdayUTCString, isUtcDayToday } from '@/utils';

export default function DailyRewardScreen() {
  const insets = useSafeAreaInsets();
  const dailyReward = useUserStore((s) => s.dailyReward);
  const coins = useUserStore((s) => s.coins);
  const claimDailyReward = useUserStore((s) => s.claimDailyReward);
  const claimedToday = isUtcDayToday(dailyReward.lastClaimDate);
  const nextDay = ((dailyReward.currentDay ?? 0) % 7) + 1;
  const weekBonus = getDailyWeekPowerUpLabel(
    dailyWeekStreak(
      dailyReward.streak ?? 0,
      dailyReward.lastClaimDate,
      getTodayUTCString(),
      getYesterdayUTCString(),
    ),
  );
  const topPad = Platform.OS === 'web' ? 62 : insets.top + 12;
  const bottomPad = Platform.OS === 'web' ? 28 : insets.bottom + 24;
  const handleClaim = () => {
    if (claimedToday) return;
    claimDailyReward();
    hapticsService.notification(1);
  };

  return (
    <AnimatedBackground>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><BackButton /><Text style={styles.title}>Daily Reward</Text><CoinDisplay amount={coins} size="small" animate /></View>
        <View style={styles.hero}>
          <View style={styles.gift}><Ionicons name="gift" size={42} color={GameColors.accentGold} /></View>
          <Text style={styles.heroTitle}>Daily Rewards</Text>
          <Text style={styles.heroCopy}>Coins every day. Week 1 adds a Hint; week 2 adds a Reveal. Then it repeats.</Text>
          <Text style={styles.streak}>Current streak: {dailyReward.streak} day{dailyReward.streak === 1 ? '' : 's'}</Text>
        </View>
        <View style={styles.calendar}>
          {DAILY_REWARDS.map((reward) => {
            const isClaimed = reward.day <= (dailyReward.currentDay ?? 0);
            const isNext = reward.day === nextDay && !claimedToday;
            return (
              <View key={reward.day} style={[styles.dayCard, isNext && styles.nextCard, isClaimed && styles.claimedCard]}>
                <Text style={[styles.dayLabel, isNext && styles.nextText]}>DAY {reward.day}</Text>
                <View style={[styles.rewardIcon, isClaimed && styles.rewardIconClaimed]}>
                  {isClaimed ? <Ionicons name="checkmark" size={22} color={GameColors.backgroundPrimary} /> : <Ionicons name={reward.icon} size={22} color={isNext ? GameColors.accentGold : GameColors.textSecondary} />}
                </View>
                <Text style={[styles.rewardLabel, isNext && styles.nextText]}>{reward.coins} coins + {weekBonus}</Text>
              </View>
            );
          })}
        </View>
        <TouchableOpacity style={[styles.claimButton, claimedToday && styles.claimedButton]} onPress={handleClaim} disabled={claimedToday}>
          <Ionicons name={claimedToday ? 'checkmark-circle' : 'gift-outline'} size={20} color={claimedToday ? GameColors.textSecondary : GameColors.backgroundPrimary} />
          <Text style={[styles.claimText, claimedToday && styles.claimedText]}>{claimedToday ? 'Claimed Today' : `Claim Day ${nextDay}`}</Text>
        </TouchableOpacity>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, minHeight: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { ...Typography.header, color: GameColors.textWhite, fontSize: 27 },
  hero: { alignItems: 'center', padding: 25, borderRadius: 22, backgroundColor: 'rgba(255,215,0,0.09)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  gift: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,215,0,0.16)', marginBottom: 12 },
  heroTitle: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 24 },
  heroCopy: { color: GameColors.textSecondary, textAlign: 'center', fontSize: 13, marginTop: 6 },
  streak: { color: GameColors.accentGold, fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 14 },
  calendar: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  dayCard: { width: '31.8%', minHeight: 112, flexGrow: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: GameColors.border, padding: 8, gap: 6 },
  nextCard: { borderColor: GameColors.accentGold, backgroundColor: 'rgba(255,215,0,0.1)' },
  claimedCard: { backgroundColor: 'rgba(0,230,118,0.1)', borderColor: 'rgba(0,230,118,0.35)' },
  dayLabel: { color: GameColors.textSecondary, fontFamily: 'Inter_700Bold', fontSize: 10 },
  nextText: { color: GameColors.accentGold },
  rewardIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)' },
  rewardIconClaimed: { backgroundColor: GameColors.accentGreen },
  rewardLabel: { color: GameColors.textWhite, fontSize: 10, textAlign: 'center', fontFamily: 'Inter_600SemiBold' },
  claimButton: { height: 54, borderRadius: 15, backgroundColor: GameColors.accentGold, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 20 },
  claimedButton: { backgroundColor: 'rgba(255,255,255,0.1)' },
  claimText: { color: GameColors.backgroundPrimary, fontFamily: 'Inter_700Bold', fontSize: 16 },
  claimedText: { color: GameColors.textSecondary },
  note: { color: GameColors.accentGold, textAlign: 'center', fontSize: 12, marginTop: 12 },
});