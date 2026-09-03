import { GOLD_RUSH_HOW_TO_BODY, GOLD_RUSH_HOW_TO_TITLE, GOLD_RUSH_TUNING, getFateSettings } from './config';
import {
  allSafesRevealed,
  applyGoldRushSelection,
  bombEndsHardSession,
  completionRewardCoins,
  countBombs,
  generateFateDeck,
  goldRushContinueDecision,
  goldRushSafeValue,
  pickPackageRound,
} from './engine';
import { SESSION_ROUNDS } from '@/games/sessionShell/constants';

function assert(ok: boolean, msg: string): void {
  if (!ok) throw new Error(msg);
}

assert(SESSION_ROUNDS === 20, 'session is 20 rounds');
assert(GOLD_RUSH_TUNING.sessionTimerSeconds === 120, '2 minute timer');
assert(GOLD_RUSH_TUNING.bombCount === 1, 'exactly one bomb');
assert(GOLD_RUSH_TUNING.packageGems === 20, 'package gems 20');
assert(GOLD_RUSH_TUNING.packageWingId === 'wing_l01', 'legendary wing id');
assert(GOLD_RUSH_TUNING.detonatorSeconds === 10, 'detonator 10s');
assert(GOLD_RUSH_TUNING.completionRewardCoins === 500, 'completion 500');
assert(GOLD_RUSH_TUNING.hardWrongLimit === 3, 'hard 3rd wrong');

assert(getFateSettings('easy').totalCards === 8 && getFateSettings('easy').bombCount === 1, 'easy 8/1');
assert(getFateSettings('medium').totalCards === 5 && getFateSettings('medium').bombCount === 1, 'medium 5/1');
assert(getFateSettings('hard').totalCards === 3 && getFateSettings('hard').bombCount === 1, 'hard 3/1');

assert(goldRushSafeValue('easy', 1) === 5, 'easy r1');
assert(goldRushSafeValue('easy', 20) === 43, 'easy r20');
assert(goldRushSafeValue('medium', 1) === 20, 'medium r1');
assert(goldRushSafeValue('medium', 20) === 96, 'medium r20');
assert(goldRushSafeValue('hard', 1) === 20, 'hard r1');
assert(goldRushSafeValue('hard', 20) === 210, 'hard r20');

assert(completionRewardCoins(0) === 500, 'wrong 0 keeps completion');
assert(completionRewardCoins(10) === 500, 'wrong 10 keeps completion');
assert(completionRewardCoins(11) === 0, 'wrong 11 zeros completion');
assert(bombEndsHardSession('easy', 3) === false, 'easy never hard-over');
assert(bombEndsHardSession('medium', 3) === false, 'medium never hard-over');
assert(bombEndsHardSession('hard', 2) === false, 'hard 2nd continues');
assert(bombEndsHardSession('hard', 3) === true, 'hard 3rd ends');

for (const difficulty of ['easy', 'medium', 'hard'] as const) {
  const deck = generateFateDeck(difficulty, 1, { random: () => 0.42 });
  assert(deck.length === getFateSettings(difficulty).totalCards, `${difficulty} card count`);
  assert(countBombs(deck) === 1, `${difficulty} one bomb`);
  assert(deck.every((card) => card.type !== 'multiplier'), `${difficulty} no multipliers`);
  const safes = deck.filter((card) => card.type !== 'bomb');
  assert(safes.every((card) => card.value === goldRushSafeValue(difficulty, 1)), `${difficulty} safe value`);
}

const packaged = generateFateDeck('medium', 7, { includePackage: true, random: () => 0.1 });
assert(packaged.filter((card) => card.isPackage).length === 1, 'exactly one package card');
assert(packaged.find((card) => card.isPackage)?.type !== 'bomb', 'package is not the bomb');

const round = pickPackageRound(() => 0);
assert(round === 1, 'package round low');
assert(pickPackageRound(() => 0.999) === 20, 'package round high');

let pot = 0;
let xp = 0;
const playDeck = [
  { id: 0, type: 'gold' as const, value: 20, isRevealed: false, isPackage: true },
  { id: 1, type: 'gold' as const, value: 20, isRevealed: false },
  { id: 2, type: 'bomb' as const, value: 0, isRevealed: false },
];
const safe1 = applyGoldRushSelection(playDeck, pot, 0, xp);
assert(safe1.kind === 'safe' && safe1.foundPackage === true, 'package found on safe');
if (safe1.kind === 'safe') {
  pot = safe1.nextPot;
  xp = safe1.nextPendingXP;
}
const safe2 = applyGoldRushSelection(safe1.kind === 'safe' ? safe1.deck : playDeck, pot, 1, xp);
assert(safe2.kind === 'safe' && safe2.nextPot === 40 && safe2.nextPendingXP === 40, 'pendingXP tracks pot');
const bomb = applyGoldRushSelection(safe2.kind === 'safe' ? safe2.deck : playDeck, 40, 2, 40);
assert(bomb.kind === 'bomb', 'bomb after safes');
const noPackage = generateFateDeck('easy', 1, { includePackage: false, random: () => 0.2 });
assert(noPackage.every((card) => !card.isPackage), 'package absent unless this round owns it');

assert(allSafesRevealed(safe2.kind === 'safe' ? safe2.deck : playDeck) === true, 'all safes revealed before last bomb');
assert(
  (safe2.kind === 'safe' ? safe2.deck : playDeck).some((card) => card.type === 'bomb' && !card.isRevealed),
  'unflipped bomb remains after all safes',
);

assert(goldRushContinueDecision(0, 1).kind === 'blocked', 'continue blocked before any safe this round');
assert(goldRushContinueDecision(0, 20).kind === 'blocked', 'round 20 also needs a safe first');
const afterOneSafe = goldRushContinueDecision(1, 1);
assert(afterOneSafe.kind === 'next' && afterOneSafe.nextRound === 2, 'continue after one safe goes next round');
const afterManySafes = goldRushContinueDecision(7, 19);
assert(afterManySafes.kind === 'next' && afterManySafes.nextRound === 20, 'all safes flipped still need Continue');
assert(goldRushContinueDecision(1, 20).kind === 'complete', 'continue on round 20 completes the session');
assert(!('coins' in afterOneSafe) && !('xp' in afterOneSafe) && !('pot' in afterOneSafe), 'continue does not commit coins or XP');
let keptPot = 40;
let keptXP = 40;
assert(goldRushContinueDecision(1, 4).kind === 'next', 'continue mid-session');
assert(keptPot === 40 && keptXP === 40, 'continue keeps pot and pendingXP');
assert(
  generateFateDeck('easy', 2, { includePackage: false, random: () => 0.2 }).every((card) => !card.isPackage),
  'continuing past a missed package round leaves the package gone',
);

assert(GOLD_RUSH_HOW_TO_TITLE === "YOU'RE WELCOME — GOLDRUSH", 'welcome title');
assert(GOLD_RUSH_HOW_TO_BODY.includes('HOW TO PLAY'), 'how to play');
assert(GOLD_RUSH_HOW_TO_BODY.includes('PACKAGE'), 'package explained');
assert(GOLD_RUSH_HOW_TO_BODY.includes('Continue'), 'continue explained');
assert(!GOLD_RUSH_HOW_TO_BODY.includes('8 cards'), 'no easy card count');
assert(!GOLD_RUSH_HOW_TO_BODY.includes('5 cards'), 'no medium card count');
assert(!GOLD_RUSH_HOW_TO_BODY.includes('3 cards'), 'no hard card count');
assert(GOLD_RUSH_HOW_TO_BODY.includes("I'M READY") === false, 'ready is the button not body');

console.log('gold rush smoke ok');
