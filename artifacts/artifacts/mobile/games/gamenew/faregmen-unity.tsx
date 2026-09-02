// games/fragment-unify/profile.ts
export const profile: GameProfile = {
  id:'fragment-unify', name:'یک‌پارچه‌سازی تکه‌ها',
  difficulty:1.4, growth:1.8, economy:1.0,
  staminaCap:15, comboMult:1.7, superComboMult:3.2,
  streakFactor:0.17, baseXP:120, baseCoin:60,
};

// games/fragment-unify/engine.ts
export function buildRound(items: QuizItem[], _diff: string): QuizRound {
  const center = items.find(i => i.tag === 'center') ?? items[0];
  return {
    items, prompt:'تکهٔ مرکزی پازل کدام است؟',
    promptTarget: center.id,
    choices: items.map(i => i.id),
  };
}
export function scoreEvaluate(items: QuizItem[], ans: string, _d: string) {
  const ok = items.find(i => i.id === ans)?.tag === 'center';
  return { ok, score: ok ? 1300 : 0 };
}

// games/fragment-unify/Screen.tsx
import QuizScreen from '../../src/shared/QuizScreen';
import { profile } from './profile';
import { buildRound, scoreEvaluate } from './engine';
export default () => <QuizScreen profile={profile} category="puzzle-fragment" buildRound={buildRound} score={scoreEvaluate} />;