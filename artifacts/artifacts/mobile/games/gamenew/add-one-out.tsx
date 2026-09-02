// games/odd-one-out/profile.ts
export const profile: GameProfile = {
  id:'odd-one-out', name:'یکی متفاوت',
  difficulty:1.0, growth:1.5, economy:1.0,
  staminaCap:20, comboMult:1.4, superComboMult:2.8,
  streakFactor:0.12, baseXP:100, baseCoin:50,
};

// games/odd-one-out/engine.ts
export function buildRound(items: QuizItem[], _diff: string): QuizRound {
  // AI در tag ثبت کرده: ۴ تا 'same' و ۱ تا 'odd'
  const odd = items.find(i => i.tag === 'odd') ?? items[0];
  return {
    items, prompt:'یکی که متفاوت است، کدام است؟',
    promptTarget: odd.id,
    choices: items.map(i => i.id),
  };
}
export function scoreEvaluate(items: QuizItem[], ans: string, _d: string) {
  const odd = items.find(i => i.tag === 'odd');
  return { ok: ans === odd?.id, score: ans === odd?.id ? 1000 : 0 };
}

// games/odd-one-out/Screen.tsx
import QuizScreen from '../../src/shared/QuizScreen';
import { profile } from './profile';
import { buildRound, scoreEvaluate } from './engine';
export default () => <QuizScreen profile={profile} category="category" buildRound={buildRound} score={scoreEvaluate} />;