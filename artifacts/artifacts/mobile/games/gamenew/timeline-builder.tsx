// games/timeline-builder/profile.ts
export const profile: GameProfile = {
  id:'timeline-builder', name:'سازندهٔ خط زمان',
  difficulty:1.2, growth:1.7, economy:1.0,
  staminaCap:18, comboMult:1.5, superComboMult:3.0,
  streakFactor:0.14, baseXP:110, baseCoin:55,
};

// games/timeline-builder/engine.ts
export function buildRound(items: QuizItem[], _diff: string): QuizRound {
  // prompt AI: کدام رویداد اول اتفاق افتاد؟ tag: 'first' | 'last' | 'middle'
  const want = 'first';
  const target = items.find(i => i.tag === want) ?? items[0];
  return {
    items, prompt:'کدام رویداد اول در زمان رخ داد؟',
    promptTarget: target.id,
    choices: items.map(i => i.id),
  };
}
export function scoreEvaluate(items: QuizItem[], ans: string, _d: string) {
  const ok = items.find(i => i.id === ans)?.tag === 'first';
  return { ok, score: ok ? 1200 : 0 };
}

// games/timeline-builder/Screen.tsx
import QuizScreen from '../../src/shared/QuizScreen';
import { profile } from './profile';
import { buildRound, scoreEvaluate } from './engine';
export default () => <QuizScreen profile={profile} category="event" buildRound={buildRound} score={scoreEvaluate} />;