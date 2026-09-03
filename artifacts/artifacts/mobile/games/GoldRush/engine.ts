import { CardState, getFateSettings } from './config';

export type FateDealSettings = {
  totalCards: number;
  bombCount: number;
  multiplierCount: number;
};

export const generateFateDeck = (
  difficulty: 'easy' | 'medium' | 'hard',
  settings?: FateDealSettings,
): CardState[] => {
  const { totalCards, bombCount, multiplierCount } = settings ?? getFateSettings(difficulty);
  const deck: CardState[] = [];

  // Add the bombs
  for (let i = 0; i < bombCount; i++) {
    deck.push({ id: deck.length, type: 'bomb', value: 0, isRevealed: false });
  }

  // Add multipliers (if any)
  for (let i = 0; i < multiplierCount; i++) {
    deck.push({ id: deck.length, type: 'multiplier', value: 2, isRevealed: false });
  }

  // Fill the rest of the deck with gold cards (positive score)
  const remaining = totalCards - deck.length;
  for (let i = 0; i < remaining; i++) {
    const goldValue = Math.floor(Math.random() * 20) + 10; // between 10 and 30 points
    deck.push({ id: deck.length, type: 'gold', value: goldValue, isRevealed: false });
  }

  // Shuffle the cards at random
  return deck.sort(() => 0.5 - Math.random()).map((card, idx) => ({ ...card, id: idx }));
};
