// games/size-compare/profile.ts
export const profile: GameProfile = {
  id:'size-compare', name:'مقایسه اندازه',
  difficulty:1.0, growth:1.5, economy:1.1,
  staminaCap:20, comboMult:1.3, superComboMult:2.6,
  streakFactor:0.11, baseXP:95, baseCoin:55,
};

// games/size-compare/engine.ts
export function buildRound(items: QuizItem[], _diff: string): QuizRound {
  // tag: 'biggest' | 'smallest' | random
  const target = items.find(i => i.tag === 'biggest') ?? items[0];
  const target2 = items.find(i => i.tag === 'smallest') ?? items[1];
  const flip = Math.random() < 0.5;
  return {
    items,
    prompt: flip ? 'کوچک‌ترین کدام است؟' : 'بزرگ‌ترین کدام است؟',
    promptTarget: flip ? target2.id : target.id,
    choices: items.map(i => i.id),
  };
}
export function scoreEval(its: QuizItem[], ans: string, promptTarget: string) {
  return { ok: ans === promptTarget, score: ans === promptTarget ? 1000 : 0 };
}
// (در فایل فعلی: scoreEvaluate همین)