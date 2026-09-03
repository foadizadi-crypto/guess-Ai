import { ICONS_POOL } from './config';

export interface CardType {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const createShuffledDeck = (pairCount: number): CardType[] => {
  const selectedIcons = ICONS_POOL.slice(0, pairCount);
  return [...selectedIcons, ...selectedIcons]
    .sort(() => 0.5 - Math.random())
    .map((icon, index) => ({
      id: index,
      icon,
      isFlipped: false,
      isMatched: false,
    }));
};