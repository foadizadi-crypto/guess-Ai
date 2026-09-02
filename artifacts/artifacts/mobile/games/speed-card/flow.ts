export const SPEED_CARD_HOW_TO_TITLE = 'How to Play';
export const SPEED_CARD_HOW_TO_BODY =
  'Watch the cards carefully and remember their order.';
export const SPEED_CARD_READY_LABEL = "I'M READY";
export const SPEED_CARD_COUNTDOWN = [3, 2, 1] as const;
export const SPEED_CARD_START_LABEL = 'Start';
export const SPEED_CARD_CORRECT_LABEL = 'Correct';
export const SPEED_CARD_WRONG_TITLE = 'WRONG';
export const SPEED_CARD_CONTINUE_LABEL = 'CONTINUE — AdMob';
export const SPEED_CARD_EXIT_LABEL = 'EXIT — Category';

export type SpeedCardPlayPhase =
  | 'howto'
  | 'countdown'
  | 'start'
  | 'loading'
  | 'reveal'
  | 'question'
  | 'feedback'
  | 'error';

export function speedCardQuestionText(colorName: string): string {
  return `Which card was ${colorName.toLowerCase()}?`;
}
