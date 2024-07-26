// from least to most active
type RoutineThresholds = {
  accumulateGold: number;
  buyShields: number;
  buyShips: number;
  supportAlly: number;
  attackEnemy: number;
};

export function calculateRoutineThresholds(
  vulnerability: number,
  planetStrength: number,
  empireStrength: number,
  options?: {
    noAttackTarget?: boolean;
    noSupportTarget?: boolean;
  },
): RoutineThresholds {
  // Input variables and their multipliers
  const multipliers: {
    vulnerability: RoutineThresholds;
    planetStrength: RoutineThresholds;
    empireStrength: RoutineThresholds;
  } = {
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
  const initialLikelihoods: RoutineThresholds = {
    buyShields: 0.25,
    attackEnemy: 0.3,
    accumulateGold: 0.15,
    buyShips: 0.2,
    supportAlly: 0.1,
  } as const;

  // Calculate likelihood adjustments
  const adjustments: RoutineThresholds = {
    buyShields: 0,
    attackEnemy: 0,
    accumulateGold: 0,
    buyShips: 0,
    supportAlly: 0,
  };
  for (const _category in initialLikelihoods) {
    const category = _category as keyof RoutineThresholds;
    adjustments[category] =
      vulnerability * multipliers.vulnerability[category] +
      planetStrength * multipliers.planetStrength[category] +
      empireStrength * multipliers.empireStrength[category];
  }

  // Calculate final likelihoods
  const finalLikelihoods: RoutineThresholds = {
    buyShields: 0,
    attackEnemy: 0,
    accumulateGold: 0,
    buyShips: 0,
    supportAlly: 0,
  };
  for (const _category in initialLikelihoods) {
    const category = _category as keyof RoutineThresholds;
    finalLikelihoods[category] = Math.max(0, initialLikelihoods[category] + adjustments[category]);
  }

  // Normalize likelihoods
  const normalizedLikelihoods: RoutineThresholds = {
    buyShields: 0,
    attackEnemy: 0,
    accumulateGold: 0,
    buyShips: 0,
    supportAlly: 0,
  };
  const totalPositive = Object.values(finalLikelihoods).reduce((sum, value) => sum + Math.max(0, value), 0);

  for (const _category in finalLikelihoods) {
    const category = _category as keyof RoutineThresholds;
    const positiveValue = Math.max(0, finalLikelihoods[category]);
    normalizedLikelihoods[category] = Number((positiveValue / totalPositive).toFixed(4));
  }

  if (options?.noAttackTarget) {
    normalizedLikelihoods.attackEnemy = 0;
  }
  if (options?.noSupportTarget) {
    normalizedLikelihoods.supportAlly = 0;
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
