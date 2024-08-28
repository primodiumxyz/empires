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

type RoutineMultipliers = {
  buyShipMultiplier?: number;
  buyShieldMultiplier?: number;
  moveShipsMultiplier?: number;
  accumulateGoldMultiplier: number;
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
  multipliers: RoutineMultipliers,
): RoutineThresholds {
  // Input variables and their multipliers
  const modifiers: {
    vulnerability: RoutineThresholds;
    planetStrength: RoutineThresholds;
    empireStrength: RoutineThresholds;
  } = {
    vulnerability: {
      buyShields: 0.5,
      moveShips: -0.15,
      accumulateGold: -0.1,
      buyShips: 0,
    },
    planetStrength: {
      buyShields: -0.2,
      moveShips: 0.08,
      accumulateGold: 0.04,
      buyShips: 0.04,
    },
    empireStrength: {
      buyShields: -0.04,
      moveShips: -0.08,
      accumulateGold: 0.11,
      buyShips: -0.05,
    },
  } as const;

  // Initial likelihoods
  const initialLikelihoods: RoutineThresholds = {
    buyShields: 0.16,
    moveShips: 0.47,
    accumulateGold: 0.21,
    buyShips: 0.16,
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
      vulnerability * modifiers.vulnerability[category] +
      planetStrength * modifiers.planetStrength[category] +
      empireStrength * modifiers.empireStrength[category];
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

  if (multipliers.buyShipMultiplier !== undefined) finalLikelihoods.buyShips *= multipliers.buyShipMultiplier;
  if (multipliers.buyShieldMultiplier !== undefined) finalLikelihoods.buyShields *= multipliers.buyShieldMultiplier;
  if (multipliers.moveShipsMultiplier !== undefined) finalLikelihoods.moveShips *= multipliers.moveShipsMultiplier;

  if (multipliers.accumulateGoldMultiplier !== undefined)
    finalLikelihoods.accumulateGold *= multipliers.accumulateGoldMultiplier;

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
