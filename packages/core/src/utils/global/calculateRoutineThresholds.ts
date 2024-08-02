// from least to most active
type RoutineThresholds = {
  accumulateGold: number;
  buyShields: number;
  buyShips: number;
  supportAlly: number;
  attackEnemy: number;
};

type RoutineThresholdsBigInt = {
  accumulateGold: bigint;
  buyShields: bigint;
  buyShips: bigint;
  supportAlly: bigint;
  attackEnemy: bigint;
};

type RoutineOptions = {
  buyShipMultiplier?: number;
  buyShieldMultiplier?: number;
  attackMultiplier?: number;
  supportMultiplier?: number;
};

export function calculateRoutineThresholds(probabilities: RoutineThresholds): RoutineThresholdsBigInt {
  const goldThreshold = BigInt(Math.round(probabilities.accumulateGold * 10000));
  const shieldThreshold = BigInt(Math.round(probabilities.buyShields * 10000)) + goldThreshold;
  const shipThreshold = BigInt(Math.round(probabilities.buyShips * 10000)) + shieldThreshold;
  const supportThreshold = BigInt(Math.round(probabilities.supportAlly * 10000)) + shipThreshold;
  const attackThreshold = BigInt(Math.round(probabilities.attackEnemy * 10000)) + supportThreshold;
  return {
    accumulateGold: goldThreshold,
    buyShields: shieldThreshold,
    buyShips: shipThreshold,
    attackEnemy: attackThreshold,
    supportAlly: supportThreshold,
  };
}

export function calculateRoutinePcts(
  vulnerability: number,
  planetStrength: number,
  empireStrength: number,
  options: RoutineOptions,
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
    buyShields: 0.2,
    attackEnemy: 0.4,
    accumulateGold: 0.15,
    buyShips: 0.18,
    supportAlly: 0.07,
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
  if (options?.attackMultiplier !== undefined) finalLikelihoods.attackEnemy *= options.attackMultiplier;
  if (options?.supportMultiplier !== undefined) finalLikelihoods.supportAlly *= options.supportMultiplier;
  if (options?.buyShipMultiplier !== undefined) finalLikelihoods.buyShips *= options.buyShipMultiplier;
  if (options?.buyShieldMultiplier !== undefined) finalLikelihoods.buyShields *= options.buyShieldMultiplier;

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

  return normalizedLikelihoods;
}
