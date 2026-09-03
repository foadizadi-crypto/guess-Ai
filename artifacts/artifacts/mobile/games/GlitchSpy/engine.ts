import { SHAPE_POOL } from './config';

export interface GridData {
  items: string[];
  differentIndex: number;
}

export const generateDifferenceGrid = (gridCount: number): GridData => {
  // انتخاب دو شکل متفاوت از پูล شکل‌ها
  const shuffledShapes = [...SHAPE_POOL].sort(() => 0.5 - Math.random());
  const baseShape = shuffledShapes[0];
  const targetShape = shuffledShapes[1];

  // پر کردن تمام خانه‌ها با شکل پایه
  const items = Array(gridCount).fill(baseShape);

  // انتخاب یک خانه تصادفی برای قرار دادن شکل متفاوت (اختلاف)
  const differentIndex = Math.floor(Math.random() * gridCount);
  items[differentIndex] = targetShape;

  return {
    items,
    differentIndex,
  };
};