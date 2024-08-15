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
        minPointCost: BigInt(POINTS_UNIT * 0.00002),
        startPointCost: BigInt(POINTS_UNIT * 0.0002),
        pointGenRate: BigInt(POINTS_UNIT * 0.000015),
        pointCostIncrease: BigInt(POINTS_UNIT * 0.00001),
      },
      P_MagnetConfig: {
        lockedPointsPercent: scaleMultiplier(0.1),
      },
      Turn: {
        nextTurnBlock: 0n,
        empire: EEmpire.Red,
        value: 1n,
      },
      P_TacticalStrikeConfig: {
        maxCharge: 100n,
        chargeRate: 1n,
        boostChargeIncrease: 10n,
        stunChargeDecrease: 10n,
        createShipBoostIncrease: 0n,
        killShipBoostCostDecrease: 0n,
      },
      P_ShieldEaterConfig: {
        visitShieldDamage: 1n,
        detonateCenterDamage: scaleMultiplier(1.00),
        detonateAdjacentDamage: scaleMultiplier(0.50),
        detonationThreshold: 8n,
      }
    },
  },

  CreateShipOverride: {
    keys: [{ [EOverride.CreateShip]: "uint8" }],
    tables: {
      P_OverrideConfig: {
        isProgressOverride: true,
        minOverrideCost: 0n,
        startOverrideCost: BigInt(POINTS_UNIT * 0.00004),
        overrideGenRate: BigInt(POINTS_UNIT * 0.0001),
        overrideCostIncrease: BigInt(POINTS_UNIT * 0.00002),
      },
    },
  },

  KillShipOverride: {
    keys: [{ [EOverride.KillShip]: "uint8" }],
    tables: {
      P_OverrideConfig: {
        isProgressOverride: false,
        minOverrideCost: 0n,
        startOverrideCost: BigInt(POINTS_UNIT * 0.00004),
        overrideGenRate: BigInt(POINTS_UNIT * 0.00004),
        overrideCostIncrease: BigInt(POINTS_UNIT * 0.00004),
      },
    },
  },

  ChargeShieldOverride: {
    keys: [{ [EOverride.ChargeShield]: "uint8" }],
    tables: {
      P_OverrideConfig: {
        isProgressOverride: true,
        minOverrideCost: 0n,
        startOverrideCost: BigInt(POINTS_UNIT * 0.00004),
        overrideGenRate: BigInt(POINTS_UNIT * 0.00004),
        overrideCostIncrease: BigInt(POINTS_UNIT * 0.00002),
      },
    },
  },

  DrainShieldOverride: {
    keys: [{ [EOverride.DrainShield]: "uint8" }],
    tables: {
      P_OverrideConfig: {
        isProgressOverride: false,
        minOverrideCost: 0n,
        startOverrideCost: BigInt(POINTS_UNIT * 0.00004),
        overrideGenRate: BigInt(POINTS_UNIT * 0.00004),
        overrideCostIncrease: BigInt(POINTS_UNIT * 0.00002),
      },
    },
  },

  PlaceMagnetOverride: {
    keys: [{ [EOverride.PlaceMagnet]: "uint8" }],
    tables: {
      P_OverrideConfig: {
        isProgressOverride: true,
        minOverrideCost: 0n,
        startOverrideCost: BigInt(POINTS_UNIT * 0.0001),
        overrideGenRate: BigInt(POINTS_UNIT * 0.00002),
        overrideCostIncrease: BigInt(POINTS_UNIT * 0.0001),
      },
    },
  },
  BoostChargeOverride: {
    keys: [{ [EOverride.BoostCharge]: "uint8" }],
    tables: {
      P_OverrideConfig: {
        isProgressOverride: false,
        minOverrideCost: 0n,
        startOverrideCost: BigInt(POINTS_UNIT * 0.0002),
        overrideGenRate: BigInt(POINTS_UNIT * 0.00004),
        overrideCostIncrease: BigInt(POINTS_UNIT * 0.0002),
      },
    },
  },

  StunChargeOverride: {
    keys: [{ [EOverride.StunCharge]: "uint8" }],
    tables: {
      P_OverrideConfig: {
        isProgressOverride: true,
        minOverrideCost: 0n,
        startOverrideCost: BigInt(POINTS_UNIT * 0.0002),
        overrideGenRate: BigInt(POINTS_UNIT * 0.00008),
        overrideCostIncrease: BigInt(POINTS_UNIT * 0.0002),
      },
    },
  },

  DetonateShieldEaterOverride: {
    keys: [{ [EOverride.DetonateShieldEater]: "uint8" }],
    tables: {
      P_OverrideConfig: {
        isProgressOverride: false,
        minOverrideCost: 0n,
        startOverrideCost: BigInt(POINTS_UNIT * 0.00020),
        overrideGenRate: BigInt(POINTS_UNIT * 0.00001),
        overrideCostIncrease: BigInt(POINTS_UNIT * 0.00020),
      },
    },
  },

  AirdropGoldOverride: {
    keys: [{ [EOverride.AirdropGold]: "uint8" }],
    tables: {
      P_OverrideConfig: {
        isProgressOverride: true,
        minOverrideCost: 0n,
        startOverrideCost: BigInt(POINTS_UNIT * 0.00004),
        overrideGenRate: BigInt(POINTS_UNIT * 0.00004),
        overrideCostIncrease: BigInt(POINTS_UNIT * 0.00004),
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
