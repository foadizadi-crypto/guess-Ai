import { CardState, getFateSettings } from './config';

export type FateDealSettings = {
  totalCards: number;
  bombCount: number;
  multiplierCount: number;
};

export const generateFateDeck = (
  difficulty: 'easy' | 'medium' | 'hard',
  settings?: FateDealSettings,
): CardState[] => {
  const { totalCards, bombCount, multiplierCount } = settings ?? getFateSettings(difficulty);
  const deck: CardState[] = [];

  // اضافه کردن بمب‌ها
  for (let i = 0; i < bombCount; i++) {
    deck.push({ id: deck.length, type: 'bomb', value: 0, isRevealed: false });
  }

  // اضافه کردن ضریب‌ها (اگر وجود داشته باشد)
  for (let i = 0; i < multiplierCount; i++) {
    deck.push({ id: deck.length, type: 'multiplier', value: 2, isRevealed: false });
  }

  // پر کردن بقیه دک با کارت‌های طلا (امتیاز مثبت)
  const remaining = totalCards - deck.length;
  for (let i = 0; i < remaining; i++) {
    const goldValue = Math.floor(Math.random() * 20) + 10; // بین ۱۰ تا ۳۰ امتیاز
    deck.push({ id: deck.length, type: 'gold', value: goldValue, isRevealed: false });
  }

  // مخلوط کردن تصادفی کارت‌ها
  return deck.sort(() => 0.5 - Math.random()).map((card, idx) => ({ ...card, id: idx }));
};