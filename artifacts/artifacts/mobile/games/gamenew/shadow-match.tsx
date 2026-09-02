// games/shadow-match/profile.ts
import type { GameProfile } from '../../src/shared/types';
export const profile: GameProfile = {
  id:'shadow-match', name:'تطبیق سایه',
  difficulty:1.2, growth:1.6, economy:1.0,
  staminaCap:18, comboMult:1.5, superComboMult:3.0,
  streakFactor:0.13, baseXP:110, baseCoin:55,
};

// games/shadow-match/engine.ts
import type { QuizItem, QuizRound } from '../../src/shared/types';
export function buildRound(items: QuizItem[], _diff: string): QuizRound {
  // items: ۵ سایه + یک شیء مرجع در prompt
  const refText = items[0].tag;          // مثلاً 'cat'
  return {
    items,
    prompt: `سایهٔ "${refText}" کدام است؟`,
    promptTarget: items[0].id,           // اولین آیتم = سایهٔ درست
    choices: items.map(i => i.id),
  };
}
export function scoreEvaluate(items: QuizItem[], ans: string, _d: string) {
  return { ok: ans === items[0].id, score: ans === items[0].id ? 1200 : 0 };
}

// games/shadow-match/Screen.tsx
import QuizScreen from '../../src/shared/QuizScreen';
import { profile } from './profile';
import { buildRound, scoreEvaluate } from './engine';
export default () => <QuizScreen profile={profile} category="shadow" buildRound={buildRound} score={scoreEvaluate} />;