import { useEffect, useRef, useState } from 'react';
import type { CardState } from './config';
import { GOLD_RUSH_TUNING } from './config';
import {
  allSafesRevealed,
  applyGoldRushSelection,
  bombEndsHardSession,
  generateFateDeck,
  goldRushContinueDecision,
  pickPackageRound,
} from './engine';

export type CashOutSnapshot = {
  pot: number;
  pendingXP: number;
  correct: number;
  wrong: number;
  round: number;
};

export function useGoldRushFlow(
  difficulty: 'easy' | 'medium' | 'hard',
  enabled: boolean,
  locked: boolean,
) {
  const [deck, setDeck] = useState<CardState[]>([]);
  const [currentPot, setCurrentPot] = useState(0);
  const [pendingXP, setPendingXP] = useState(0);
  const [round, setRound] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [safesThisRound, setSafesThisRound] = useState(0);
  const deckRef = useRef<CardState[]>([]);
  const potRef = useRef(0);
  const pendingRef = useRef(0);
  const roundRef = useRef(1);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const safesRef = useRef(0);
  const endedRef = useRef(false);
  const packageRoundRef = useRef(1);
  const packageConsumedRef = useRef(false);
  const sessionSeededRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      sessionSeededRef.current = false;
      endedRef.current = false;
      potRef.current = 0;
      pendingRef.current = 0;
      roundRef.current = 1;
      correctRef.current = 0;
      wrongRef.current = 0;
      packageConsumedRef.current = false;
      safesRef.current = 0;
      setCurrentPot(0);
      setPendingXP(0);
      setRound(1);
      setCorrect(0);
      setWrong(0);
      setSafesThisRound(0);
      setDeck([]);
      return;
    }
    if (sessionSeededRef.current) return;
    sessionSeededRef.current = true;
    packageRoundRef.current = pickPackageRound();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || endedRef.current || round > GOLD_RUSH_TUNING.sessionRounds) return;
    const includePackage =
      round === packageRoundRef.current && !packageConsumedRef.current;
    const nextDeck = generateFateDeck(difficulty, round, { includePackage });
    deckRef.current = nextDeck;
    safesRef.current = 0;
    setDeck(nextDeck);
    setSafesThisRound(0);
  }, [round, enabled, difficulty]);

  const snapshot = (): CashOutSnapshot => ({
    pot: potRef.current,
    pendingXP: pendingRef.current,
    correct: correctRef.current,
    wrong: wrongRef.current,
    round: roundRef.current,
  });

  const wipePot = () => {
    potRef.current = 0;
    setCurrentPot(0);
  };

  const discardLedgers = () => {
    potRef.current = 0;
    pendingRef.current = 0;
    setCurrentPot(0);
    setPendingXP(0);
  };

  const selectCard = (index: number) => {
    if (!enabled || locked || endedRef.current) return { kind: 'ignored' as const };
    const result = applyGoldRushSelection(deckRef.current, potRef.current, index, pendingRef.current);
    if (result.kind === 'ignored') return result;

    deckRef.current = result.deck;
    setDeck(result.deck);

    if (result.kind === 'bomb') {
      wrongRef.current += 1;
      setWrong(wrongRef.current);
      wipePot();
      const hardOver = bombEndsHardSession(difficulty, wrongRef.current);
      if (hardOver) endedRef.current = true;
      return { kind: 'bomb' as const, hardGameOver: hardOver, snapshot: snapshot() };
    }

    potRef.current = result.nextPot;
    pendingRef.current = result.nextPendingXP;
    setCurrentPot(result.nextPot);
    setPendingXP(result.nextPendingXP);
    correctRef.current += 1;
    setCorrect(correctRef.current);
    safesRef.current += 1;
    setSafesThisRound(safesRef.current);
    if (result.foundPackage) packageConsumedRef.current = true;
    return {
      kind: 'safe' as const,
      foundPackage: result.foundPackage,
      allSafesRevealed: allSafesRevealed(result.deck),
      snapshot: snapshot(),
    };
  };

  const continueRound = () => {
    if (!enabled || locked || endedRef.current) return null;
    const decision = goldRushContinueDecision(safesRef.current, roundRef.current);
    if (decision.kind === 'blocked') return null;
    if (decision.kind === 'complete') {
      endedRef.current = true;
      return { kind: 'complete' as const, snapshot: snapshot() };
    }
    safesRef.current = 0;
    setSafesThisRound(0);
    roundRef.current += 1;
    setRound(roundRef.current);
    return { kind: 'next' as const, snapshot: snapshot() };
  };

  const advanceAfterBomb = () => {
    if (!enabled || endedRef.current) return null;
    if (bombEndsHardSession(difficulty, wrongRef.current)) {
      endedRef.current = true;
      discardLedgers();
      return { kind: 'hard-game-over' as const, snapshot: snapshot() };
    }
    if (roundRef.current >= GOLD_RUSH_TUNING.sessionRounds) {
      endedRef.current = true;
      return { kind: 'complete' as const, snapshot: snapshot() };
    }
    roundRef.current += 1;
    setRound(roundRef.current);
    return { kind: 'next' as const, snapshot: snapshot() };
  };

  const cashOut = () => {
    if (!enabled || endedRef.current) return null;
    endedRef.current = true;
    return snapshot();
  };

  const markPackageConsumed = () => {
    packageConsumedRef.current = true;
  };

  const forceEnd = (zeroReward: boolean) => {
    endedRef.current = true;
    if (zeroReward) discardLedgers();
    return snapshot();
  };

  return {
    deck,
    currentPot,
    pendingXP,
    round,
    maxRounds: GOLD_RUSH_TUNING.sessionRounds,
    correct,
    wrong,
    safesThisRound,
    allSafesRevealed: allSafesRevealed(deck),
    selectCard,
    continueRound,
    advanceAfterBomb,
    cashOut,
    markPackageConsumed,
    forceEnd,
    snapshot,
  };
}
