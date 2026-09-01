import {
  LOST_ITEM_ANSWER_OPTIONS,
  LOST_ITEM_DARK_MS,
  LOST_ITEM_GAME_OVER_WRONGS,
  LOST_ITEM_IMAGE_STYLE,
  LOST_ITEM_PHASE_MS,
  LOST_ITEM_QUESTIONS,
  LOST_ITEM_SCORE_CORRECT,
  LOST_ITEM_SCORE_WRONG,
  LOST_ITEM_SETS,
} from './config';
import { phaseMsForDifficulty, planLostItemQuestion, planLostItemRound } from './engine';

function assert(ok: boolean, msg: string): void {
  if (!ok) throw new Error(msg);
}

assert(LOST_ITEM_QUESTIONS === 5, '5 questions');
assert(LOST_ITEM_ANSWER_OPTIONS === 4, '4 options');
assert(LOST_ITEM_SCORE_CORRECT === 100, 'correct hud +100');
assert(LOST_ITEM_SCORE_WRONG === -50, 'wrong hud -50');
assert(LOST_ITEM_GAME_OVER_WRONGS === 3, '3 wrongs game over');
assert(LOST_ITEM_DARK_MS === 3000, 'dark 3s');
assert(LOST_ITEM_IMAGE_STYLE === 'cartoon', 'cartoon style');
assert(LOST_ITEM_PHASE_MS.easy === 6000, 'easy 6s');
assert(LOST_ITEM_PHASE_MS.medium === 4000, 'medium 4s');
assert(LOST_ITEM_PHASE_MS.hard === 2500, 'hard 2.5s');
assert(phaseMsForDifficulty('extra-hard') === 2500, 'locked extra-hard uses hard time');
assert(phaseMsForDifficulty('max') === 2500, 'locked max uses hard time');
assert(!('colors' in LOST_ITEM_SETS[0]!), 'lost item is not a hex palette game');

const easySets = LOST_ITEM_SETS.filter((set) => set.difficulty === 'easy');
const mediumSets = LOST_ITEM_SETS.filter((set) => set.difficulty === 'medium');
const hardSets = LOST_ITEM_SETS.filter((set) => set.difficulty === 'hard');
assert(easySets.length === 3, 'easy uses the 3 spec scene types');
assert(mediumSets.length === 1 && mediumSets[0]?.items.length >= 20 && mediumSets[0]?.items.length <= 30, 'medium tool wall 20-30');
assert(hardSets.length === 3, 'hard uses the 3 spec scene types');
assert(easySets[0]?.items.length === 10, '10 large animals');
assert(easySets[1]?.items.length === 10, '10 large shapes');
assert(easySets[2]?.items.length === 5, '5 trees');

const round = planLostItemRound('easy');
assert(round.length === 5, 'round has 5 questions');
for (const question of round) {
  assert(question.options.length === 4, '4 options');
  assert(new Set(question.options.map((option) => option.id)).size === 4, 'options unique');
  assert(question.options[question.correctIndex]?.id === question.missingItem, 'correct option is the missing item');
  assert(easySets.some((set) => set.id === question.setId), 'easy plan stays on easy sets');
  assert(!('xp' in question) && !('coins' in question), 'plan has no economy fields');
}

const hard = planLostItemQuestion('hard');
assert(hardSets.some((set) => set.id === hard.setId), 'hard plan stays on hard sets');

console.log('lost-item engine smoke ok', {
  questions: LOST_ITEM_QUESTIONS,
  easyMs: LOST_ITEM_PHASE_MS.easy,
  darkMs: LOST_ITEM_DARK_MS,
});
