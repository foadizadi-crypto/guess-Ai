import { COLOR_POOL } from './config';

export interface QuestionData {
  word: { name: string; hex: string };
  textColor: { name: string; hex: string };
  options: string[];
}

export const generateStroopQuestion = (difficulty: 'easy' | 'medium' | 'hard'): QuestionData => {
  const randomWord = COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)];
  let randomColor = COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)];

  if (difficulty !== 'easy' && Math.random() > 0.3) {
    while (randomColor.hex === randomWord.hex) {
      randomColor = COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)];
    }
  }
  const options = [...COLOR_POOL].map(c => c.name).sort(() => 0.5 - Math.random());
  return { word: randomWord, textColor: randomColor, options };
};
