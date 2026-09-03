import { useState, useEffect, useRef } from 'react';
import { getMatchSettings } from './config';
import { createShuffledDeck, CardType } from './engine';
import { SESSION_ROUNDS, lerpByRound } from '@/games/sessionShell';

function pairCountForRound(difficulty: 'easy' | 'medium' | 'hard', round: number): number {
  const base = getMatchSettings(difficulty).pairCount;
  const hard = getMatchSettings('hard').pairCount;
  return Math.max(2, Math.round(lerpByRound(base, hard, round)));
}

export const useMatchFlow = (
  difficulty: 'easy' | 'medium' | 'hard',
  enabled: boolean,
  frozen: boolean,
  onCorrect: (points: number) => void,
  onWrong: () => void,
  onComplete: () => void,
) => {
  const [cards, setCards] = useState<CardType[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [pairsFound, setPairsFound] = useState(0);
  const [dealKey, setDealKey] = useState(0);
  const pairsFoundRef = useRef(0);
  const selectedRef = useRef<number[]>([]);
  const onWrongRef = useRef(onWrong);
  const onCorrectRef = useRef(onCorrect);
  const onCompleteRef = useRef(onComplete);
  pairsFoundRef.current = pairsFound;
  selectedRef.current = selectedCards;
  onWrongRef.current = onWrong;
  onCorrectRef.current = onCorrect;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!enabled) return;
    const count = pairCountForRound(difficulty, Math.min(pairsFoundRef.current + 1, SESSION_ROUNDS));
    setCards(createShuffledDeck(count));
    setSelectedCards([]);
  }, [enabled, dealKey, difficulty]);

  const flipCard = (index: number) => {
    if (!enabled || frozen) return;
    const target = cards[index];
    if (!target || target.isFlipped || target.isMatched || selectedCards.length >= 2) return;

    const updatedCards = cards.map((card, idx) => (idx === index ? { ...card, isFlipped: true } : card));
    const newSelection = [...selectedCards, index];
    setCards(updatedCards);
    setSelectedCards(newSelection);

    if (newSelection.length !== 2) return;
    setMoves((m) => m + 1);
    const [firstIdx, secondIdx] = newSelection;
    if (updatedCards[firstIdx].icon === updatedCards[secondIdx].icon) {
      const matched = updatedCards.map((card, idx) =>
        idx === firstIdx || idx === secondIdx ? { ...card, isMatched: true } : card,
      );
      setCards(matched);
      setSelectedCards([]);
      const nextFound = pairsFound + 1;
      setPairsFound(nextFound);
      onCorrectRef.current(1);
      if (nextFound >= SESSION_ROUNDS) {
        onCompleteRef.current();
        return;
      }
      if (matched.every((card) => card.isMatched)) {
        setTimeout(() => setDealKey((k) => k + 1), 400);
      }
    } else {
      onWrongRef.current();
    }
  };

  const retryRound = () => {
    const open = selectedRef.current;
    setSelectedCards([]);
    setCards((current) =>
      current.map((card, idx) => (open.includes(idx) && !card.isMatched ? { ...card, isFlipped: false } : card)),
    );
  };

  return {
    cards,
    moves,
    pairsFound,
    maxRounds: SESSION_ROUNDS,
    flipCard,
    retryRound,
  };
};
