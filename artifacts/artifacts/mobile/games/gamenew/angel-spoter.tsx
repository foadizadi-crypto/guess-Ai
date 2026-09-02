// games/angle-spotter/profile.ts
export const profile: GameProfile = {
  id:'angle-spotter', name:'تشخیص زاویه',
  difficulty:1.3, growth:1.7, economy:0.9,
  staminaCap:18, comboMult:1.6, superComboMult:3.0,
  streakFactor:0.16, baseXP:115, baseCoin:50,
};

// games/angle-spotter/engine.ts
export function buildRound(items: QuizItem[], _diff: string): QuizRound {
  const target = items.find(i => i.tag === '90deg') ?? items[0];
  return {
    items, prompt:'کدام کارت زاویهٔ ۹۰ درجه را نشان می‌دهد؟',
    promptTarget: target.id,
    choices: items.map(i => i.id),
  };
}
export function scoreEvaluate(items: QuizItem[], ans: string, _d: string) {
  const ok = items.find(i => i.id === ans)?.tag === '90deg';
  return { ok, score: ok ? 1100 : 0 };
}

// games/angle-spotter/Screen.tsx
import QuizScreen from '../../src/shared/QuizScreen';
import { profile } from './profile';
import { buildRound, scoreEvaluate } from './engine';
export default () => <QuizScreen profile={profile} category="angle" buildRound={buildRound} score={scoreEvaluate} />;