// from least to most active
type Likelihoods = {
  accumulateGold: number;
  buyShields: number;
  buyShips: number;
  supportAlly: number;
  attackEnemy: number;
};

export function calculateLikelihoodThresholds(
  vulnerability: number,
  planetStrength: number,
  empireStrength: number,
): Likelihoods {
  // Input variables and their multipliers
  const multipliers: { vulnerability: Likelihoods; planetStrength: Likelihoods; empireStrength: Likelihoods } = {
    vulnerability: {
      buyShields: 0.35,
      attackEnemy: -0.2,
      accumulateGold: -0.05,
      buyShips: -0.05,
      supportAlly: -0.05,
    },
    planetStrength: {
      buyShields: -0.2,
      attackEnemy: 0.08,
      accumulateGold: 0.04,
      buyShips: 0.04,
      supportAlly: 0.04,
    },
    empireStrength: {
      buyShields: -0.04,
      attackEnemy: -0.11,
      accumulateGold: 0.11,
      buyShips: -0.05,
      supportAlly: 0.09,
    },
  } as const;

  // Initial likelihoods
  const initialLikelihoods: Likelihoods = {
    buyShields: 0.25,
    attackEnemy: 0.3,
    accumulateGold: 0.15,
    buyShips: 0.2,
    supportAlly: 0.1,
  } as const;

  // Calculate likelihood adjustments
  const adjustments: Likelihoods = {
    buyShields: 0,
    attackEnemy: 0,
    accumulateGold: 0,
    buyShips: 0,
    supportAlly: 0,
  };
  for (const _category in initialLikelihoods) {
    const category = _category as keyof Likelihoods;
    adjustments[category] =
      vulnerability * multipliers.vulnerability[category] +
      planetStrength * multipliers.planetStrength[category] +
      empireStrength * multipliers.empireStrength[category];
  }

  // Calculate final likelihoods
  const finalLikelihoods: Likelihoods = {
    buyShields: 0,
    attackEnemy: 0,
    accumulateGold: 0,
    buyShips: 0,
    supportAlly: 0,
  };
  for (const _category in initialLikelihoods) {
    const category = _category as keyof Likelihoods;
    finalLikelihoods[category] = Math.max(0, initialLikelihoods[category] + adjustments[category]);
  }

  // Normalize likelihoods
  const normalizedLikelihoods: Likelihoods = {
    buyShields: 0,
    attackEnemy: 0,
    accumulateGold: 0,
    buyShips: 0,
    supportAlly: 0,
  };
  const totalPositive = Object.values(finalLikelihoods).reduce((sum, value) => sum + Math.max(0, value), 0);

  for (const _category in finalLikelihoods) {
    const category = _category as keyof Likelihoods;
    const positiveValue = Math.max(0, finalLikelihoods[category]);
    normalizedLikelihoods[category] = Number((positiveValue / totalPositive).toFixed(4));
  }

  return percentsToThresholds(normalizedLikelihoods);
}

const percentsToThresholds = <T extends Record<string, number>>(percents: T): T => {
  let cumulative = 0;
  const thresholds = {} as T;

  for (const [key, value] of Object.entries(percents)) {
    cumulative += value;
    thresholds[key as keyof T] = Math.round(cumulative * 10000) as T[keyof T];
  }

  return thresholds;
};
