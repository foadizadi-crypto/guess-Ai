export const COUNT_QUICK_HOW_TO_TITLE = 'How to Play';
export const COUNT_QUICK_HOW_TO_BODY =
  'Look carefully! Remember how many cards of each color.';
export const COUNT_QUICK_READY_LABEL = "I'M READY";
export const COUNT_QUICK_COUNTDOWN = [3, 2, 1] as const;

export type CountQuickPlayPhase = 'howto' | 'countdown' | 'memorize' | 'ask' | 'feedback';

export function countQuickQuestionText(colorName: string): string {
  return `How many ${colorName} cards?`;
}
