import { buildRawGameConfig } from '@/shared/games/rawConfig';
import { SESSION_ROUNDS } from '@/games/sessionShell/constants';

export const GOLD_RUSH_GAME_ID = 'gold_rush';
export const GOLD_RUSH_TITLE = 'Gold Rush';

export interface CardState {
  id: number;
  type: 'gold' | 'bomb' | 'multiplier';
  value: number;
  isRevealed: boolean;
  isPackage?: boolean;
}

export const GOLD_RUSH_TUNING = {
  cardsPerRound: { easy: 8, medium: 5, hard: 3 } as const,
  bombCount: 1,
  safeReward: {
    easy: { n: 5, d: 2 },
    medium: { n: 20, d: 4 },
    hard: { n: 20, d: 10 },
  } as const,
  sessionRounds: SESSION_ROUNDS,
  sessionTimerSeconds: 120,
  hardWrongLimit: 3,
  completionRewardCoins: 500,
  completionWrongCap: 10,
  packageGems: 20,
  packageWingId: 'wing_l01',
  detonatorSeconds: 10,
} as const;

export const GOLD_RUSH_HOW_TO_TITLE = "YOU'RE WELCOME — GOLDRUSH";

export const GOLD_RUSH_HOW_TO_BODY =
  'HOW TO PLAY\n' +
  'Flip cards. Safe cards grow a temporary Pot and pending XP. After a safe is fully revealed, Continue keeps the Pot and starts the next round. A bomb wipes the current Pot. Easy and Medium keep going after a bomb. Hard ends on the third bomb. Cash Out anytime to bank a healthy Pot and XP. Finish all 20 rounds for a separate completion coin reward if you did not bomb too many times. You have 2 minutes after GO.\n\n' +
  'PACKAGE\n' +
  'There is ONE hidden Package in the session. Finding it arms the Detonator. You have 10 seconds to COLLECT. Any other action — or letting the countdown hit 0 — BOOMS: Pot, pending XP, and the Package are lost. Collect grants 20 Gems and 1 Legendary Wing through your profile. The Package is not part of the Pot.';

export const getFateSettings = (difficulty: 'easy' | 'medium' | 'hard') => ({
  totalCards: GOLD_RUSH_TUNING.cardsPerRound[difficulty],
  bombCount: GOLD_RUSH_TUNING.bombCount,
});

export const rawConfig = buildRawGameConfig(GOLD_RUSH_GAME_ID);
