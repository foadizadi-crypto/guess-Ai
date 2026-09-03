export const generateNextTile = (): number => Math.floor(Math.random() * 4);
export const verifyPlayerChoice = (playerSeq: number[], targetSeq: number[]): boolean => {
  const currentIdx = playerSeq.length - 1;
  return playerSeq[currentIdx] === targetSeq[currentIdx];
};
