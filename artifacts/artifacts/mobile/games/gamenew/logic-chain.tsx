// games/logic-chain/profile.ts
export const profile: GameProfile = {
  id:'logic-chain', name:'زنجیرهٔ منطق',
  difficulty:1.5, growth:1.9, economy:1.0,
  staminaCap:12, comboMult:1.8, superComboMult:3.3,
  streakFactor:0.20, baseXP:125, baseCoin:65,
};

// games/logic-chain/engine.ts
export function buildRound(items: QuizItem[], _diff: string): QuizRound {
  // prompt AI: اگر A -> B و B -> C، پس A -> ?
  const conclusion = items.find(i => i.tag === 'conclusion') ?? items[0];
  return {
    items,
    prompt: 'اگر A → B و B → C، نتیجهٔ منطقی کدام است؟',
    promptTarget: conclusion.id,
    choices: items.map(i => i.id),
  };
}
export function scoreEvaluate(items: QuizItem[], ans: string, _d: string) {
  const ok = items.find(i => i.id === ans)?.tag === 'conclusion';
  return { ok, score: ok ? 1500 : 0 };
}

// games/logic-chain/Screen.tsx
import QuizScreen from '../../src/shared/QuizScreen';
import { profile } from './profile';
import { buildRound, scoreEvaluate } from './engine';
export default () => <QuizScreen profile={profile} category="logic" buildRound={buildRound} score={scoreEvaluate} />;