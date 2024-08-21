import { worldInput } from "../mud.config";
import { PrototypesConfig } from "../ts/prototypes/types";
import { POINTS_UNIT } from "./constants";
import { EEmpire, EOverride, ERoutine } from "./enums";

const scaleMultiplier = (multiplier: number) => {
  if (multiplier < 0 || multiplier > 1) throw new Error("multiplier must be between 0 and 100");
  return BigInt(Math.round(multiplier * 10000));
};

export const prototypeConfig: PrototypesConfig<(typeof worldInput)["tables"]> = {
  /* ---------------------------------- World --------------------------------- */
  World: {
    keys: [],
    tables: {
      P_GameConfig: {
        turnLengthBlocks: 5n,
        goldGenRate: 1n,
        gameOverBlock: 0n, // currently handled in PostDeploy
        gameStartTimestamp: 0n, // currently handled in PostDeploy
        empireCount: 6,
      },
      P_PointConfig: {
        pointUnit: BigInt(POINTS_UNIT),
        pointRake: scaleMultiplier(0.05), // out of 1, scales to out of 10000
        pointSellTax: BigInt(POINTS_UNIT * 0),
        minPointCost: BigInt(POINTS_UNIT * 0.00001),
        startPointCost: BigInt(POINTS_UNIT * 0.00004),
        pointGenRate: BigInt(POINTS_UNIT * 0.000003),
        pointCostIncrease: BigInt(POINTS_UNIT * 0.000005),
      },
      P_MagnetConfig: {
        lockedPointsPercent: scaleMultiplier(0.1),
      },
      Turn: {
        nextTurnBlock: 0n,
        empire: EEmpire.Red,
        value: 1n,
      },
      P_ShieldEaterConfig: {
        visitShieldDamage: 1n,
        detonateCenterDamage: scaleMultiplier(1.0),
        detonateAdjacentDamage: scaleMultiplier(0.5),
        detonationThreshold: 8n,
      },
    },
  },

  CreateShipOverride: {
    keys: [{ [EOverride.CreateShip]: "uint8" }],
    tables: {
      P_OverrideConfig: {
        isProgressOverride: true,
        pointMultiplier: 1n,
        minOverrideCost: 0n,
        startOverrideCost: BigInt(POINTS_UNIT * 0.00004),
        overrideGenRate: BigInt(POINTS_UNIT * 0.00004),
        overrideCostIncrease: BigInt(POINTS_UNIT * 0.000001),
      },
    },
  },

  ChargeShieldOverride: {
    keys: [{ [EOverride.ChargeShield]: "uint8" }],
    tables: {
      P_OverrideConfig: {
        isProgressOverride: true,
        pointMultiplier: 1n,
        minOverrideCost: 0n,
        startOverrideCost: BigInt(POINTS_UNIT * 0.0001),
        overrideGenRate: BigInt(POINTS_UNIT * 0.000005),
        overrideCostIncrease: BigInt(POINTS_UNIT * 0.0000005),
      },
    },
  },

  PlaceMagnetOverride: {
    keys: [{ [EOverride.PlaceMagnet]: "uint8" }],
    tables: {
      P_OverrideConfig: {
        isProgressOverride: true,
        pointMultiplier: 5n,
        minOverrideCost: 0n,
        startOverrideCost: BigInt(POINTS_UNIT * 0.0001),
        overrideGenRate: BigInt(POINTS_UNIT * 0.00002),
        overrideCostIncrease: BigInt(POINTS_UNIT * 0.0001),
      },
    },
  },

  DetonateShieldEaterOverride: {
    keys: [{ [EOverride.DetonateShieldEater]: "uint8" }],
    tables: {
      P_OverrideConfig: {
        isProgressOverride: false,
        pointMultiplier: 5n,
        minOverrideCost: BigInt(POINTS_UNIT * 0.0005),
        startOverrideCost: BigInt(POINTS_UNIT * 0.001),
        overrideGenRate: BigInt(POINTS_UNIT * 0.00001),
        overrideCostIncrease: BigInt(POINTS_UNIT * 0.0002),
      },
    },
  },

  AirdropGoldOverride: {
    keys: [{ [EOverride.AirdropGold]: "uint8" }],
    tables: {
      P_OverrideConfig: {
        isProgressOverride: true,
        pointMultiplier: 2n,
        minOverrideCost: 0n,
        startOverrideCost: BigInt(POINTS_UNIT * 0.00004),
        overrideGenRate: BigInt(POINTS_UNIT * 0.00004),
        overrideCostIncrease: BigInt(POINTS_UNIT * 0.00008),
      },
    },
  },

  BuyShips: {
    keys: [{ [ERoutine.BuyShips]: "uint8" }],
    tables: {
      P_RoutineCosts: {
        goldCost: 2n,
      },
    },
  },
  BuyShields: {
    keys: [{ [ERoutine.BuyShields]: "uint8" }],
    tables: {
      P_RoutineCosts: {
        goldCost: 1n,
      },
    },
  },
  // this is the gold added to the planet when this routine is triggered
  AccumulateGold: {
    keys: [{ [ERoutine.AccumulateGold]: "uint8" }],
    tables: {
      P_RoutineCosts: {
        goldCost: 5n,
      },
    },
  },
};
