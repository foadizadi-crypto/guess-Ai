import {
  COUNT_QUICK_ANSWER_OPTIONS,
  COUNT_QUICK_GAME_OVER_WRONGS,
  COUNT_QUICK_ITEM_COUNT,
  COUNT_QUICK_PALETTES,
  COUNT_QUICK_QUESTIONS,
  COUNT_QUICK_SCORE_CORRECT,
  COUNT_QUICK_SCORE_WRONG,
  COUNT_QUICK_SECONDS,
  COUNT_QUICK_SHAPES,
  COUNT_QUICK_TARGET_RULE,
} from './config';
import { buildCountQuickQuestion, buildCountQuickRound, itemCountForDifficulty, secondsForDifficulty } from './engine';
import {
  COUNT_QUICK_COUNTDOWN,
  COUNT_QUICK_HOW_TO_BODY,
  COUNT_QUICK_READY_LABEL,
  countQuickQuestionText,
} from './flow';

function assert(ok: boolean, msg: string): void {
  if (!ok) throw new Error(msg);
}

assert(COUNT_QUICK_QUESTIONS === 5, '5 questions');
assert(COUNT_QUICK_ANSWER_OPTIONS === 4, '4 options');
assert(COUNT_QUICK_SCORE_CORRECT === 100, 'correct hud +100');
assert(COUNT_QUICK_SCORE_WRONG === -50, 'wrong hud -50');
assert(COUNT_QUICK_GAME_OVER_WRONGS === 3, '3 wrongs game over');
assert(COUNT_QUICK_TARGET_RULE === 'count-color', 'count a color');
assert(COUNT_QUICK_SHAPES.length === 6, '6 shapes');
assert(COUNT_QUICK_PALETTES.length === 5, '5 palettes');
assert(COUNT_QUICK_ITEM_COUNT.easy === 6 && COUNT_QUICK_SECONDS.easy === 5, 'easy 6/5s');
assert(COUNT_QUICK_ITEM_COUNT.medium === 9 && COUNT_QUICK_SECONDS.medium === 3, 'medium 9/3s');
assert(COUNT_QUICK_ITEM_COUNT.hard === 12 && COUNT_QUICK_SECONDS.hard === 2, 'hard 12/2s');
assert(itemCountForDifficulty('extra-hard') === 12, 'locked extra-hard uses hard item count');
assert(secondsForDifficulty('max') === 2, 'locked max uses hard time');

const round = buildCountQuickRound('easy');
assert(round.length === 5, 'round has 5 questions');
for (const question of round) {
  assert(question.items.length === 6, 'easy question has 6 items');
  assert(question.options.length === 4, '4 options');
  assert(new Set(question.options).size === 4, 'options unique');
  const counted = question.items.filter((item) => item.color === question.targetColor).length;
  assert(counted === question.correctCount, 'target count matches items');
  assert(question.options.includes(question.correctCount), 'correct option present');
  assert(COUNT_QUICK_PALETTES.some((p) => p.id === question.paletteId), 'palette is one of 5');
}

const hard = buildCountQuickQuestion('hard');
assert(hard.items.length === 12, 'hard has 12 items');
assert(!('xp' in hard) && !('coins' in hard), 'question has no economy fields');
assert(typeof hard.targetColorName === 'string' && hard.targetColorName.length > 0, 'question has a color name');
assert(
  countQuickQuestionText('orange') === 'How many orange cards?',
  'question copy',
);
assert(COUNT_QUICK_READY_LABEL === "I'M READY", 'ready button copy');
assert(COUNT_QUICK_HOW_TO_BODY.includes('Look carefully'), 'how-to copy');
assert(COUNT_QUICK_COUNTDOWN.join(',') === '3,2,1', 'countdown 3-2-1');

for (const palette of COUNT_QUICK_PALETTES) {
  assert(palette.colors.length === 6, `${palette.id} has 6 named swatches`);
  const names = palette.colors.map((c) => c.name);
  const hexes = palette.colors.map((c) => c.hex);
  assert(new Set(names).size === names.length, `${palette.id} color names unique`);
  assert(hexes.every((hex) => /^#[0-9A-F]{6}$/i.test(hex)), `${palette.id} hex preserved`);
}

const sunsetOrange = COUNT_QUICK_PALETTES.find((p) => p.id === 'sunset')?.colors.find((c) => c.name === 'orange');
assert(sunsetOrange?.hex === '#FF6B35', 'sunset orange hex unchanged');

console.log('count-quick engine smoke ok', {
  questions: COUNT_QUICK_QUESTIONS,
  palettes: COUNT_QUICK_PALETTES.map((p) => p.id),
  easy: COUNT_QUICK_ITEM_COUNT.easy,
});
