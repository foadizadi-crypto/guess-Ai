import type { SessionOutcome } from '@/types';
import { grantResultSessionRewards } from '@/shared/economy/grantResultSession';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { GOLD_RUSH_TUNING } from './config';
import { completionRewardCoins } from './engine';

const settledSessionIds = new Set<string>();
const grantedPackageIds = new Set<string>();

function sessionKey(): string | null {
  return useGameStore.getState().gameSession?.id ?? null;
}

export function goldRushAlreadySettled(id?: string | null): boolean {
  const key = id ?? sessionKey();
  if (!key) return false;
  return settledSessionIds.has(key) || !!useGameStore.getState().gameSession?.isComplete;
}

export function settleGoldRushSession(input: {
  coins: number;
  xp: number;
  correct: number;
  wrong: number;
  outcome: SessionOutcome;
  creditAccount: boolean;
}): boolean {
  const game = useGameStore.getState();
  const key = game.gameSession?.id;
  if (!key || settledSessionIds.has(key) || game.gameSession?.isComplete) return false;
  settledSessionIds.add(key);

  const coins = Math.max(0, Math.round(input.coins));
  const xp = Math.max(0, Math.round(input.xp));
  const correct = Math.max(0, input.correct);
  const wrong = Math.max(0, input.wrong);

  useGameStore.setState({
    xpEarned: xp,
    coinsEarned: coins,
    correctAnswers: correct,
    totalWrong: wrong,
    score: coins,
    totalQuestions: Math.max(1, correct + wrong),
    sessionOutcome: input.outcome,
  });
  useGameStore.getState().endSession({ applyFinish: false, sessionOutcome: input.outcome });
  if (input.creditAccount) grantResultSessionRewards();
  return true;
}

export function settleGoldRushCashOut(pot: number, pendingXP: number, correct: number, wrong: number): boolean {
  return settleGoldRushSession({
    coins: pot,
    xp: pendingXP,
    correct,
    wrong,
    outcome: 'win',
    creditAccount: true,
  });
}

export function settleGoldRushCompletion(pot: number, pendingXP: number, correct: number, wrong: number): boolean {
  return settleGoldRushSession({
    coins: pot + completionRewardCoins(wrong),
    xp: pendingXP,
    correct,
    wrong,
    outcome: wrong === 0 ? 'perfect' : 'win',
    creditAccount: true,
  });
}

export function settleGoldRushZero(correct: number, wrong: number): boolean {
  return settleGoldRushSession({
    coins: 0,
    xp: 0,
    correct,
    wrong,
    outcome: 'lose',
    creditAccount: false,
  });
}

export function grantGoldRushPackage(sessionId?: string | null): boolean {
  const key = sessionId ?? sessionKey();
  if (!key || grantedPackageIds.has(key)) return false;
  grantedPackageIds.add(key);
  const user = useUserStore.getState();
  user.addGems(GOLD_RUSH_TUNING.packageGems);
  user.grantWing(GOLD_RUSH_TUNING.packageWingId);
  return true;
}
