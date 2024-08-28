// from least to most active
type RoutineThresholds = {
  accumulateGold: number;
  buyShields: number;
  buyShips: number;
  moveShips: number;
};

type RoutineThresholdsBigInt = {
  accumulateGold: bigint;
  buyShields: bigint;
  buyShips: bigint;
  moveShips: bigint;
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
  const moveThreshold = BigInt(Math.round(probabilities.moveShips * 10000)) + shipThreshold;
  return {
    accumulateGold: goldThreshold,
    buyShields: shieldThreshold,
    buyShips: shipThreshold,
    moveShips: moveThreshold,
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
      moveShips: -0.2,
      accumulateGold: -0.05,
      buyShips: -0.05,
    },
    planetStrength: {
      buyShields: -0.2,
      moveShips: 0.08,
      accumulateGold: 0.04,
      buyShips: 0.04,
    },
    empireStrength: {
      buyShields: -0.04,
      moveShips: -0.11,
      accumulateGold: 0.11,
      buyShips: -0.05,
    },
  } as const;

  // Initial likelihoods
  const initialLikelihoods: RoutineThresholds = {
    buyShields: 0.1,
    moveShips: 0.4,
    accumulateGold: 0.15,
    buyShips: 0.1,
  } as const;

  // Calculate likelihood adjustments
  const adjustments: RoutineThresholds = {
    buyShields: 0,
    moveShips: 0,
    accumulateGold: 0,
    buyShips: 0,
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
    moveShips: 0,
    accumulateGold: 0,
    buyShips: 0,
  };
  for (const _category in initialLikelihoods) {
    const category = _category as keyof RoutineThresholds;
    finalLikelihoods[category] = Math.max(0, initialLikelihoods[category] + adjustments[category]);
  }
  if (options?.buyShipMultiplier !== undefined) finalLikelihoods.buyShips *= options.buyShipMultiplier;
  if (options?.buyShieldMultiplier !== undefined) finalLikelihoods.buyShields *= options.buyShieldMultiplier;

  // Normalize likelihoods
  const normalizedLikelihoods: RoutineThresholds = {
    buyShields: 0,
    moveShips: 0,
    accumulateGold: 0,
    buyShips: 0,
  };
  const totalPositive = Object.values(finalLikelihoods).reduce((sum, value) => sum + Math.max(0, value), 0);
  if (totalPositive == 0) {
    return {
      accumulateGold: 1,
      buyShields: 0,
      buyShips: 0,
      moveShips: 0,
    };
  }

  for (const _category in finalLikelihoods) {
    const category = _category as keyof RoutineThresholds;
    const positiveValue = Math.max(0, finalLikelihoods[category]);
    normalizedLikelihoods[category] = Number((positiveValue / totalPositive).toFixed(4));
  }

  return normalizedLikelihoods;
}
