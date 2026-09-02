// games/emotion-match/profile.ts
export const profile: GameProfile = {
  id:'emotion-match', name:'تطبیق احساس',
  difficulty:1.1, growth:1.6, economy:1.1,
  staminaCap:21, comboMult:1.4, superComboMult:2.9,
  streakFactor:0.12, baseXP:100, baseCoin:60,
};

// games/emotion-match/engine.ts
export function buildRound(items: QuizItem[], _diff: string): QuizRound {
  // ۵ چهره با tag: 'happy' | 'sad' | 'angry' | 'surprised' | 'neutral'
  const want = _diff === 'easy' ? 'happy' : _diff === 'hard' ? 'surprised' : 'angry';
  const face = items.find(i => i.tag === want) ?? items[0];
  return {
    items, prompt:`کدام چهره "${want}" است؟`,
    promptTarget: face.id,
    choices: items.map(i => i.id),
  };
}
export function scoreEvaluate(items: QuizItem[], ans: string, _d: string) {
  const emotional = items.find(i => i.id === ans);
  return { ok: !!emotional, score: !!emotional ? 1100 : 0 };
}

// games/emotion-match/Screen.tsx
import QuizScreen from '../../src/shared/QuizScreen';
import { profile } from './profile';
import { buildRound, scoreEvaluate } from './engine';
export default () => <QuizScreen profile={profile} category="face" buildRound={buildRound} score={scoreEvaluate} />;