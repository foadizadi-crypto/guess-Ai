import React, { useCallback, useEffect, useState } from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientButton } from '@/components/GradientButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { useAdStore } from '@/store/adStore';
import { useAudio } from '@/hooks/useAudio';
import { ROUTES } from '@/navigation/routes';
import { useRTL } from '@/hooks/useRTL';
import {
  XP_COMPLETION_BONUS,
  XP_PERFECT_BONUS,
  COINS_PERFECT_GAME_BONUS,
} from '@/constants/economy';
import type { MissionType } from '@/types';

const CONFETTI = ['#FFD700', '#00E676', '#FF6B35', '#CE93D8', '#64B5F6', '#FF1744'];

export default function ResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { textAlign } = useRTL();
  const {
    score,
    selectedDifficulty,
    selectedCategory,
    correctAnswers,
    totalQuestions,
    xpEarned,
    coinsEarned,
    doubleXPActive,
    lastGameWasTimedOut,
    maxStreakThisGame,
    resetGame,
  } = useGameStore();
  const {
    updateBestScore,
    addCoins,
    addXP,
    statistics,
    updateStatistics,
    updateMissionProgress,
    refreshDailyMissions,
  } = useUserStore();
  const { adsRemoved, showInterstitial, showRewarded } = useAdStore();
  const { playEffect } = useAudio();

  const [doubledByAd, setDoubledByAd] = useState(false);
  const [doubleLoading, setDoubleLoading] = useState(false);

  const trophyScale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentY = useSharedValue(28);

  const isPerfect   = correctAnswers === totalQuestions;
  const isVictory   = !lastGameWasTimedOut && isPerfect;
  const accuracy    = totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  // ── Economy calculation — spec-driven ─────────────────────────────────────
  // Coins: 1 per correct answer (tracked in gameStore.coinsEarned)
  //        +25 bonus for a perfect game
  //        ×2 if Double Coins power-up was active
  const baseCoins  = coinsEarned + (isPerfect ? COINS_PERFECT_GAME_BONUS : 0);
  const totalCoins = Math.max(0, baseCoins);

  // XP: per-question base + combo (tracked in gameStore.xpEarned)
  //     +50 completion bonus (every game)
  //     +100 perfect bonus (20/20 correct)
  //     ×2 if Double XP power-up was active
  const baseXP  = xpEarned + XP_COMPLETION_BONUS + (isPerfect ? XP_PERFECT_BONUS : 0);
  const totalXP = doubleXPActive ? baseXP * 2 : baseXP;

  // ── Record result + entrance animation ────────────────────────────────────
  useEffect(() => {
    // Refresh missions before updating progress (ensures today's missions are loaded)
    refreshDailyMissions();

    updateBestScore(score);
    addCoins(totalCoins);
    addXP(totalXP);

    updateStatistics({
      totalGamesPlayed: statistics.totalGamesPlayed + 1,
      totalWins:        statistics.totalWins + (isVictory ? 1 : 0),
      totalCorrectAnswers: statistics.totalCorrectAnswers + correctAnswers,
      favoriteCategory:  selectedCategory,
      longestStreak: Math.max(statistics.longestStreak, maxStreakThisGame),
    });

    // ── Mission progress ─────────────────────────────────────────────────
    updateMissionProgress('play_games', 1);
    updateMissionProgress('correct_answers', correctAnswers);
    if (selectedDifficulty === 'hard') updateMissionProgress('complete_hard', 1);
    if (isPerfect)                      updateMissionProgress('perfect_game', 1);
    if (maxStreakThisGame >= 5)         updateMissionProgress('get_combo', maxStreakThisGame);
    updateMissionProgress('play_category', 1, selectedCategory);

    Haptics.notificationAsync(
      isVictory ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
    );
    trophyScale.value = withSpring(1, { damping: 12, stiffness: 80 });
    contentOpacity.value = withDelay(250, withTiming(1, { duration: 450 }));
    contentY.value = withDelay(250, withTiming(0, { duration: 450 }));
    if (isVictory) playEffect('level_up');
    else playEffect('coin');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Interstitial after 3.5 s delay ────────────────────────────────────────
  useEffect(() => {
    if (adsRemoved) return;
    const t = setTimeout(() => { showInterstitial(); }, 3500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Double coins via rewarded ad ──────────────────────────────────────────
  const handleDoubleCoins = useCallback(async () => {
    if (doubleLoading || doubledByAd) return;
    setDoubleLoading(true);
    try {
      const rewarded = await showRewarded();
      if (rewarded) {
        addCoins(totalCoins); // adds the same amount again → doubled
        setDoubledByAd(true);
        playEffect('coin');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setDoubleLoading(false);
    }
  }, [addCoins, totalCoins, doubleLoading, doubledByAd, playEffect, showRewarded]);

  const trophyStyle  = useAnimatedStyle(() => ({ transform: [{ scale: trophyScale.value }] }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  const goToLobby = () => { resetGame(); router.replace(ROUTES.LOBBY); };
  const playAgain = () => { resetGame(); router.replace(ROUTES.LEVEL_SELECT); };
  const shareResult = async () => {
    await Share.share({
      message: `I scored ${score} points in BlurQuiz with ${accuracy}% accuracy! 🎮`,
    });
  };

  const topPad = Platform.OS === 'web' ? 58 : insets.top + 18;
  const botPad = Platform.OS === 'web' ? 28 : insets.bottom + 18;

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
        {isVictory &&
          CONFETTI.map((color, index) => (
            <View
              key={`${color}-${index}`}
              style={[
                styles.confetti,
                { backgroundColor: color, left: `${8 + index * 17}%`, top: 40 + (index % 3) * 25 },
              ]}
            />
          ))}
        <Animated.View style={[styles.hero, trophyStyle]}>
          <View style={[styles.trophyCircle, { borderColor: isVictory ? GameColors.accentGold : GameColors.accentRed }]}>
            <Ionicons
              name={isVictory ? 'trophy-outline' : 'time-outline'}
              size={64}
              color={isVictory ? GameColors.accentGold : GameColors.accentRed}
            />
          </View>
          <Text style={[styles.title, { color: isVictory ? GameColors.accentGold : GameColors.accentRed }]}>
            {isVictory ? 'VICTORY' : "TIME'S UP"}
          </Text>
          <Text style={styles.subtitle}>
            {selectedDifficulty.toUpperCase()} MODE • {correctAnswers}/{totalQuestions} CORRECT
          </Text>
          {maxStreakThisGame >= 3 && (
            <Text style={styles.comboLabel}>
              {maxStreakThisGame >= 12 ? '⚡ ULTRA COMBO!' :
               maxStreakThisGame >= 8  ? '🔥 SUPER COMBO!' :
               maxStreakThisGame >= 5  ? '✨ COMBO!' : `🔗 ${maxStreakThisGame}-streak!`}
            </Text>
          )}
        </Animated.View>

        <Animated.View style={[styles.content, contentStyle]}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>FINAL SCORE</Text>
            <Text style={styles.scoreValue}>{score}</Text>
            <View style={styles.statsGrid}>
              <Stat icon="checkmark-circle-outline" label="Correct"  value={`${correctAnswers}/${totalQuestions}`} color={GameColors.accentGreen} />
              <Stat icon="analytics-outline"        label="Accuracy" value={`${accuracy}%`}                       color={GameColors.accentGold}  />
              <Stat icon="flash-outline"            label="XP Earned" value={`+${totalXP}`}                       color="#CE93D8" />
              <Stat
                icon="cash-outline"
                label="Coins"
                value={doubledByAd ? `+${totalCoins * 2}` : `+${totalCoins}`}
                color={GameColors.accentOrange}
              />
            </View>
          </View>
          <View style={styles.buttons}>
            <GradientButton title="Play Again" onPress={playAgain} testID="play-again-button" />
            {!adsRemoved && !doubledByAd && (
              <SecondaryButton
                title={doubleLoading ? 'Loading ad…' : '▶  Watch Ad • Double Coins'}
                onPress={handleDoubleCoins}
                borderColor={GameColors.accentOrange}
                disabled={doubleLoading}
              />
            )}
            <View style={styles.secondaryRow}>
              <SecondaryButton title="Share"  onPress={shareResult}  style={styles.secondaryButton} />
              <SecondaryButton title="Home"   onPress={goToLobby}    style={styles.secondaryButton} testID="lobby-button" />
            </View>
          </View>
        </Animated.View>
      </View>
    </AnimatedBackground>
  );
}

const Stat: React.FC<{ icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color: string }> = ({
  icon, label, value, color,
}) => (
  <View style={styles.stat}>
    <Ionicons name={icon} size={21} color={color} />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container:    { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  confetti:     { position: 'absolute', width: 8, height: 22, borderRadius: 4, transform: [{ rotate: '24deg' }], opacity: 0.85 },
  hero:         { alignItems: 'center', gap: 12 },
  trophyCircle: { width: 132, height: 132, borderRadius: 66, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', shadowColor: GameColors.accentGold, shadowOpacity: 0.35, shadowRadius: 25, elevation: 8 },
  title:        { ...Typography.header, fontSize: 34, fontFamily: 'Inter_700Bold' },
  subtitle:     { ...Typography.small, color: GameColors.textSecondary, letterSpacing: 1 },
  comboLabel:   { fontSize: 15, fontFamily: 'Inter_700Bold', color: GameColors.accentGold, letterSpacing: 0.5 },
  content:      { gap: 18 },
  scoreCard:    { borderRadius: 22, padding: 18, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: GameColors.border, alignItems: 'center', gap: 6 },
  scoreLabel:   { ...Typography.small, color: GameColors.textSecondary, letterSpacing: 2 },
  scoreValue:   { fontSize: 56, lineHeight: 64, color: GameColors.textWhite, fontFamily: 'Inter_700Bold' },
  statsGrid:    { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  stat:         { width: '48%', flexGrow: 1, alignItems: 'center', gap: 3, paddingVertical: 9, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.14)' },
  statLabel:    { ...Typography.small, color: GameColors.textSecondary, fontSize: 12 },
  statValue:    { ...Typography.bodyMedium, fontFamily: 'Inter_700Bold' },
  buttons:      { gap: 12 },
  secondaryRow: { flexDirection: 'row', gap: 12 },
  secondaryButton: { flex: 1 },
});
