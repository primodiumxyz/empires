const rankToScoreMap = new Map(
  // define the top ten ranks
  [1000, 800, 666, 540, 430, 330, 250, 190, 140, 100].map((score, index) => [index + 1, score])
);

const log20 = (x: number) => Math.log(x) / Math.log(20);

/**
 * Converts a rank to a score.
 * @param rank - The rank.
 * @returns The score.
 */
export const rankToScore = (rank: number): number => {
  if (rank < 1) return 0;
  if (rankToScoreMap.has(rank)) return rankToScoreMap.get(rank)!;
  return 54 / log20(rank - 5);
};
