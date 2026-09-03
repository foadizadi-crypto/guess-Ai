import type { CardState } from './config';
import { GOLD_RUSH_TUNING, getFateSettings } from './config';

export type FateDealSettings = {
  totalCards: number;
  bombCount: number;
};

export type GoldRushSelectionResult =
  | { kind: 'ignored' }
  | { kind: 'bomb'; deck: CardState[] }
  | {
      kind: 'safe';
      deck: CardState[];
      nextPot: number;
      nextPendingXP: number;
      foundPackage: boolean;
    };

export function goldRushSafeValue(
  difficulty: 'easy' | 'medium' | 'hard',
  round: number,
): number {
  const { n, d } = GOLD_RUSH_TUNING.safeReward[difficulty];
  const clamped = Math.min(
    GOLD_RUSH_TUNING.sessionRounds,
    Math.max(1, Math.floor(round)),
  );
  return n + (clamped - 1) * d;
}

export function pickPackageRound(random: () => number = Math.random): number {
  return 1 + Math.floor(random() * GOLD_RUSH_TUNING.sessionRounds);
}

export function shuffleCards(cards: CardState[], random: () => number = Math.random): CardState[] {
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const current = deck[i];
    const swap = deck[j];
    if (!current || !swap) continue;
    deck[i] = swap;
    deck[j] = current;
  }
  return deck.map((card, idx) => ({ ...card, id: idx }));
}

export const generateFateDeck = (
  difficulty: 'easy' | 'medium' | 'hard',
  round = 1,
  options?: { includePackage?: boolean; settings?: FateDealSettings; random?: () => number },
): CardState[] => {
  const { totalCards, bombCount } = options?.settings ?? getFateSettings(difficulty);
  const value = goldRushSafeValue(difficulty, round);
  const bombs = Math.min(bombCount, totalCards);
  const deck: CardState[] = [];

  for (let i = 0; i < bombs; i += 1) {
    deck.push({ id: deck.length, type: 'bomb', value: 0, isRevealed: false });
  }
  while (deck.length < totalCards) {
    deck.push({ id: deck.length, type: 'gold', value, isRevealed: false });
  }

  const shuffled = shuffleCards(deck, options?.random);
  if (!options?.includePackage) return shuffled;

  const safeIndexes = shuffled
    .map((card, index) => (card.type === 'bomb' ? -1 : index))
    .filter((index) => index >= 0);
  if (safeIndexes.length === 0) return shuffled;
  const pick = safeIndexes[Math.floor((options.random ?? Math.random)() * safeIndexes.length)] ?? safeIndexes[0];
  return shuffled.map((card, index) => (index === pick ? { ...card, isPackage: true } : card));
};

export function applyGoldRushSelection(
  deck: CardState[],
  currentPot: number,
  index: number,
  pendingXP = 0,
): GoldRushSelectionResult {
  const card = deck[index];
  if (!card || card.isRevealed) return { kind: 'ignored' };

  const nextDeck = deck.map((item, idx) => (idx === index ? { ...item, isRevealed: true } : item));
  if (card.type === 'bomb') {
    return { kind: 'bomb', deck: nextDeck };
  }

  const gain = card.value;
  return {
    kind: 'safe',
    deck: nextDeck,
    nextPot: currentPot + gain,
    nextPendingXP: pendingXP + gain,
    foundPackage: !!card.isPackage,
  };
}

export function bombEndsHardSession(difficulty: 'easy' | 'medium' | 'hard', wrongAfter: number): boolean {
  return difficulty === 'hard' && wrongAfter >= GOLD_RUSH_TUNING.hardWrongLimit;
}

export function completionRewardCoins(wrong: number): number {
  return wrong > GOLD_RUSH_TUNING.completionWrongCap ? 0 : GOLD_RUSH_TUNING.completionRewardCoins;
}

export type GoldRushContinueDecision =
  | { kind: 'blocked' }
  | { kind: 'next'; nextRound: number }
  | { kind: 'complete' };

export function goldRushContinueDecision(
  safesThisRound: number,
  round: number,
  sessionRounds = GOLD_RUSH_TUNING.sessionRounds,
): GoldRushContinueDecision {
  if (safesThisRound <= 0) return { kind: 'blocked' };
  if (round >= sessionRounds) return { kind: 'complete' };
  return { kind: 'next', nextRound: round + 1 };
}

export function allSafesRevealed(deck: CardState[]): boolean {
  return deck.length > 0 && deck.every((card) => card.type === 'bomb' || card.isRevealed);
}

export function countBombs(deck: CardState[]): number {
  return deck.filter((card) => card.type === 'bomb').length;
}
