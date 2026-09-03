import { SHAPE_POOL } from './config';

export interface GridData {
  items: string[];
  differentIndex: number;
}

export const generateDifferenceGrid = (gridCount: number): GridData => {
  // Pick two different shapes from the shape pool
  const shuffledShapes = [...SHAPE_POOL].sort(() => 0.5 - Math.random());
  const baseShape = shuffledShapes[0];
  const targetShape = shuffledShapes[1];

  // Fill every cell with the base shape
  const items = Array(gridCount).fill(baseShape);

  // Pick a random cell for the different shape (the odd one out)
  const differentIndex = Math.floor(Math.random() * gridCount);
  items[differentIndex] = targetShape;

  return {
    items,
    differentIndex,
  };
};
