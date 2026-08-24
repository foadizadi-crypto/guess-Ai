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
  sessionCompleteCoins,
  sessionCompleteXP,
  perfectGameCoins,
  perfectGameXP,
} from '@/constants/gameConfig';
import type { MissionType } from '@/types';
import { recordGameSession, saveAchievements } from '@/services/firestoreService';
import { getPlayerId } from '@/services/authService';
import { AchievementToast } from '@/components/AchievementToast';
import type { AchievementDef } from '@/constants/achievements';

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
    totalWrong,
    gameSession,
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
    checkAndUnlockAchievements,
  } = useUserStore();
  const {
    canShowDoubleReward,
    incrementSessionCounter,
    resetSessionCounter,
    showRewarded,
    isAdFreePassActive,
  } = useAdStore();
  const { playEffect } = useAudio();

  const [doubledByAd, setDoubledByAd] = useState(false);
  const [doubleLoading, setDoubleLoading] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<AchievementDef[]>([]);

  const trophyScale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentY = useSharedValue(28);

  const isPerfect   = correctAnswers === totalQuestions;
  const isVictory   = !lastGameWasTimedOut && isPerfect;
  const accuracy    = totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  // ── Economy calculation — spec v1.0.0 ────────────────────────────────────
  // Coins: 1 per correct answer (tracked in gameStore.coinsEarned)
  //        + session completion bonus (per difficulty: Easy 50 | Med 63 | Hard 75)
  //        + perfect game bonus if 20/20 (per difficulty: Easy 100 | Med 125 | Hard 150)
  const completionCoins = sessionCompleteCoins(selectedDifficulty);
  const perfectCoins    = isPerfect ? perfectGameCoins(selectedDifficulty) : 0;
  const baseCoins       = coinsEarned + completionCoins + perfectCoins;
  const totalCoins      = Math.max(0, baseCoins);

  // XP: per-question base + combo (tracked in gameStore.xpEarned)
  //     + session completion XP (per difficulty: Easy 30 | Med 38 | Hard 45)
  //     + perfect game XP if 20/20 (per difficulty: Easy 50 | Med 63 | Hard 75)
  const completionXP = sessionCompleteXP(selectedDifficulty);
  const perfectXP    = isPerfect ? perfectGameXP(selectedDifficulty) : 0;
  const baseXP       = xpEarned + completionXP + perfectXP;
  const totalXP      = doubleXPActive ? baseXP * 2 : baseXP;

  // ── Double Reward button visibility (spec §7.2 + §7.3) ──────────────────
  // The counter always gates availability — even ad-free pass holders must reach
  // the threshold before the offer appears (spec §7.3: "counter still functions").
  // Pass status only controls whether an ad is shown (instant vs watched).
  const adFreeActive    = isAdFreePassActive();
  const doubleAvailable = !doubledByAd && canShowDoubleReward();

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

    // ── Advance session counter (spec §7.2) ──────────────────────────────
    // Every completed session increments the counter, enabling the double-
    // reward button once it reaches the threshold.
    incrementSessionCounter();

    // ── Record session to Firestore (Task 6) ─────────────────────────────
    // Fire-and-forget: errors are logged but never block the UI.
    const uid = getPlayerId();
    if (uid && gameSession) {
      recordGameSession(
        uid,
        {
          difficulty:     selectedDifficulty,
          category:       selectedCategory,
          correctAnswers,
          wrongAnswers:   totalWrong,
          maxCombo:       maxStreakThisGame,
          xpEarned:       totalXP,   // final amount including bonuses
          coinsEarned:    totalCoins,
          score,
          startTime:      gameSession.startTime,
          endTime:        gameSession.endTime ?? Date.now(),
          wasAbandoned:   false,
        },
        gameSession.id,
      );
    }

    // ── Achievement checking ──────────────────────────────────────────────
    // Must run AFTER updateStatistics so the store reflects the latest stats.
    const newlyUnlocked = checkAndUnlockAchievements({
      isPerfectGame: isPerfect,
      maxComboThisGame: maxStreakThisGame,
    });
    if (newlyUnlocked.length > 0) {
      setAchievementQueue(newlyUnlocked);
      // Persist unlock state to Firestore (fire-and-forget)
      const uidForAchievements = getPlayerId();
      if (uidForAchievements) {
        const updatedAchievements = useUserStore.getState().achievements;
        saveAchievements(uidForAchievements, updatedAchievements).catch(() => {});
      }
    }

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

  // ── Double Rewards handler (spec §7.2) ────────────────────────────────────
  // Doubles both coins AND XP earned this session.
  // Ad-free pass: applies instantly without showing an ad.
  // Normal: watches a rewarded ad first.
  const handleDoubleRewards = useCallback(async () => {
    if (doubleLoading || doubledByAd) return;

    if (adFreeActive) {
      // Ad-Free Pass — grant instantly, counter still resets (spec §7.3)
      addCoins(totalCoins);
      addXP(totalXP);
      resetSessionCounter();
      setDoubledByAd(true);
      playEffect('coin');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    setDoubleLoading(true);
    try {
      const rewarded = await showRewarded();
      if (rewarded) {
        addCoins(totalCoins); // adds the same amount again → doubled
        addXP(totalXP);       // doubles XP too (spec §7.2)
        resetSessionCounter(); // reset counter after successful watch
        setDoubledByAd(true);
        playEffect('coin');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      // On decline the counter is NOT reset — it carries over (spec §7.2)
    } finally {
      setDoubleLoading(false);
    }
  }, [
    adFreeActive,
    addCoins,
    addXP,
    totalCoins,
    totalXP,
    doubleLoading,
    doubledByAd,
    playEffect,
    showRewarded,
    resetSessionCounter,
  ]);

  const trophyStyle  = useAnimatedStyle(() => ({ transform: [{ scale: trophyScale.value }] }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  const goToLobby = () => { resetGame(); router.replace(ROUTES.LOBBY); };
  const playAgain = () => { resetGame(); router.replace(ROUTES.LEVEL_SELECT); };
  const shareResult = async () => {
    await Share.share({
      message: `I scored ${score} points in GUESSAi with ${accuracy}% accuracy! 🎮`,
    });
  };

  const topPad = Platform.OS === 'web' ? 58 : insets.top + 18;
  const botPad = Platform.OS === 'web' ? 28 : insets.bottom + 18;

  // Display values — update once doubled
  const displayCoins = doubledByAd ? totalCoins * 2 : totalCoins;
  const displayXP    = doubledByAd ? totalXP * 2    : totalXP;

  // Double-reward button label
  const doubleLabel = adFreeActive
    ? '⚡ Double Rewards (Ad-Free)'
    : doubleLoading
    ? 'Loading ad…'
    : '▶  Watch Ad • Double Rewards';

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
              <Stat icon="checkmark-circle-outline" label="Correct"   value={`${correctAnswers}/${totalQuestions}`}                  color={GameColors.accentGreen}  />
              <Stat icon="analytics-outline"        label="Accuracy"  value={`${accuracy}%`}                                         color={GameColors.accentGold}   />
              <Stat icon="flash-outline"            label="XP Earned" value={doubledByAd ? `+${displayXP} ×2` : `+${displayXP}`}    color="#CE93D8" />
              <Stat
                icon="cash-outline"
                label="Coins"
                value={doubledByAd ? `+${displayCoins} ×2` : `+${displayCoins}`}
                color={GameColors.accentOrange}
              />
            </View>
          </View>
          <View style={styles.buttons}>
            <GradientButton title="Play Again" onPress={playAgain} testID="play-again-button" />
            {doubleAvailable && (
              <SecondaryButton
                title={doubleLabel}
                onPress={handleDoubleRewards}
                borderColor={adFreeActive ? GameColors.accentGold : GameColors.accentOrange}
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
      {/* Achievement unlock toasts */}
      <AchievementToast
        queue={achievementQueue}
        onItemShown={() => setAchievementQueue((prev) => prev.slice(1))}
      />
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
