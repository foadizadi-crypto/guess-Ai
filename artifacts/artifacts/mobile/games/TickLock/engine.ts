export const calculateClickScore = (elapsed: number, target: number, tolerance: number): number => {
  const difference = Math.abs(elapsed - target);
  if (difference > tolerance) return 0;
  const accuracy = (tolerance - difference) / tolerance;
  return Math.floor(accuracy * 100);
};
