import { GAME_CONFIG } from '@/constants/gameConfig';
import type { AchievementDef } from '@/constants/achievements';
import { getPlayerId } from '@/services/authService';
import { recordGameSession, saveAchievements } from '@/services/firestoreService';
import { toGameplayDifficulty } from '@/shared/difficulty';
import { useAdStore } from '@/store/adStore';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';

const grantedResultSessions = new Set<string>();

export function resultSessionAlreadyGranted(id?: string | null): boolean {
  return !!id && grantedResultSessions.has(id);
}

/**
 * Commits Result-screen account rewards exactly once per session id.
 * GoldRush cash-out/completion calls this before skipping Result so coins/XP
 * still go through addCoins/addXP. Result also calls it; the set prevents double-pay.
 */
export function grantResultSessionRewards(): AchievementDef[] {
  const game = useGameStore.getState();
  const user = useUserStore.getState();
  const sessionId = game.gameSession?.id;
  if (!sessionId || grantedResultSessions.has(sessionId)) return [];

  const totalCoins = Math.max(0, game.coinsEarned);
  const totalXP = game.doubleXPActive ? game.xpEarned * 2 : game.xpEarned;
  const isPerfect =
    game.sessionOutcome === 'perfect' ||
    (game.sessionOutcome == null && game.correctAnswers === game.totalQuestions);
  const isVictory =
    game.sessionOutcome === 'perfect' ||
    game.sessionOutcome === 'win' ||
    (game.sessionOutcome == null &&
      !game.lastGameWasTimedOut &&
      game.correctAnswers === game.totalQuestions);

  user.refreshDailyMissions();
  user.updateBestScore(game.score);
  user.addCoins(totalCoins);
  user.addXP(totalXP);

  const statistics = user.statistics;
  user.updateStatistics({
    totalGamesPlayed: statistics.totalGamesPlayed + 1,
    totalWins: statistics.totalWins + (isVictory ? 1 : 0),
    totalCorrectAnswers: statistics.totalCorrectAnswers + game.correctAnswers,
    totalCoinsEarned: statistics.totalCoinsEarned + totalCoins,
    favoriteCategory: game.selectedCategory,
    longestStreak: Math.max(statistics.longestStreak, game.maxStreakThisGame),
    hardGamesPlayed: statistics.hardGamesPlayed + (game.selectedDifficulty === 'hard' ? 1 : 0),
  });

  user.updateMissionProgress('play_games', 1);
  user.updateMissionProgress('correct_answers', game.correctAnswers);
  if (game.selectedDifficulty === 'hard') user.updateMissionProgress('complete_hard', 1);
  if (isPerfect && game.correctAnswers === game.totalQuestions && game.totalQuestions > 0) {
    user.updateMissionProgress('perfect_game', 1);
  }
  if (game.maxStreakThisGame >= 5) user.updateMissionProgress('get_combo', game.maxStreakThisGame);
  user.updateMissionProgress('play_category', 1, game.selectedCategory);

  const ads = useAdStore.getState();
  ads.incrementSessionCounter();
  const rounds = useAdStore.getState().sessionCounter;
  if (rounds > 0 && rounds % GAME_CONFIG.interstitial_every_n_sessions === 0) {
    void useAdStore.getState().showInterstitial();
  }

  const uid = getPlayerId();
  if (uid && game.gameSession) {
    recordGameSession(
      uid,
      {
        difficulty: toGameplayDifficulty(game.selectedDifficulty),
        category: game.selectedCategory,
        correctAnswers: game.correctAnswers,
        wrongAnswers: game.totalWrong,
        maxCombo: game.maxStreakThisGame,
        xpEarned: totalXP,
        coinsEarned: totalCoins,
        score: game.score,
        startTime: game.gameSession.startTime,
        endTime: game.gameSession.endTime ?? Date.now(),
        wasAbandoned: false,
      },
      game.gameSession.id,
    );
  }

  const newlyUnlocked = user.checkAndUnlockAchievements({
    isPerfectGame: isPerfect && game.correctAnswers === game.totalQuestions && game.totalQuestions > 0,
    maxComboThisGame: game.maxStreakThisGame,
  });
  if (newlyUnlocked.length > 0) {
    const uidForAchievements = getPlayerId();
    if (uidForAchievements) {
      const updatedAchievements = useUserStore.getState().achievements;
      saveAchievements(uidForAchievements, updatedAchievements).catch(() => {});
    }
  }

  const userAfter = useUserStore.getState();
  for (const mission of userAfter.missions) {
    if (mission.completed && !mission.rewardClaimed) userAfter.claimMissionReward(mission.id);
  }
  for (const level of [...userAfter.unclaimedLevelRewards]) {
    userAfter.claimLevelReward(level);
  }

  grantedResultSessions.add(sessionId);
  return newlyUnlocked;
}
