import { useState, useEffect, useRef } from 'react';
import { CardState } from './config';
import { generateFateDeck } from './engine';
import { getFateSettings } from './config';
import { SESSION_ROUNDS, lerpByRound } from '@/games/sessionShell';

export const useFateFlow = (
  difficulty: 'easy' | 'medium' | 'hard',
  enabled: boolean,
  frozen: boolean,
  onCorrect: (points: number) => void,
  onWrong: () => void,
  onComplete: () => void,
) => {
  const [deck, setDeck] = useState<CardState[]>([]);
  const [currentPot, setCurrentPot] = useState(0);
  const [savedScore, setSavedScore] = useState(0);
  const [round, setRound] = useState(1);
  const [retryKey, setRetryKey] = useState(0);
  const onWrongRef = useRef(onWrong);
  const onCorrectRef = useRef(onCorrect);
  const onCompleteRef = useRef(onComplete);
  onWrongRef.current = onWrong;
  onCorrectRef.current = onCorrect;
  onCompleteRef.current = onComplete;

  const base = getFateSettings(difficulty);
  const hard = getFateSettings('hard');
  const deal = {
    totalCards: Math.max(3, Math.round(lerpByRound(base.totalCards, hard.totalCards, round))),
    bombCount: 1,
    multiplierCount: Math.round(lerpByRound(base.multiplierCount, hard.multiplierCount, round)),
  };
  deal.bombCount = Math.min(
    Math.max(1, Math.round(lerpByRound(base.bombCount, hard.bombCount, round))),
    deal.totalCards - 1,
  );

  useEffect(() => {
    if (!enabled || frozen || round > SESSION_ROUNDS) return;
    setDeck(generateFateDeck(difficulty, deal));
    setCurrentPot(0);
  }, [round, enabled, frozen, retryKey, difficulty, deal.totalCards, deal.bombCount, deal.multiplierCount]);

  const selectCard = (index: number) => {
    if (!enabled || frozen) return;
    const card = deck[index];
    if (!card || card.isRevealed) return;

    const updatedDeck = deck.map((item, idx) => (idx === index ? { ...item, isRevealed: true } : item));
    setDeck(updatedDeck);

    if (card.type === 'bomb') {
      setCurrentPot(0);
      onWrongRef.current();
    } else if (card.type === 'multiplier') {
      setCurrentPot((prev) => (prev === 0 ? 20 : prev * card.value));
    } else {
      setCurrentPot((prev) => prev + card.value);
    }
  };

  const bankScore = () => {
    if (!enabled || frozen || currentPot <= 0) return;
    const gained = currentPot;
    setSavedScore((prev) => prev + gained);
    onCorrectRef.current(gained);
    if (round >= SESSION_ROUNDS) {
      onCompleteRef.current();
    } else {
      setRound((r) => r + 1);
    }
  };

  const retryRound = () => setRetryKey((k) => k + 1);

  return {
    deck,
    currentPot,
    savedScore,
    round,
    maxRounds: SESSION_ROUNDS,
    selectCard,
    bankScore,
    retryRound,
  };
};
