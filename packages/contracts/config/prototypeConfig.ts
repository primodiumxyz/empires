import { worldInput } from "../mud.config";
import { PrototypesConfig } from "../ts/prototypes/types";
import { POINTS_UNIT } from "./constants";
import { EEmpire, ERoutine, EOverride } from "./enums";

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
        turnLengthBlocks: 15n,
        goldGenRate: 1n,
        gameOverBlock: 0n, // currently handled in PostDeploy
        gameStartTimestamp: 0n, // currently handled in PostDeploy
      },
      P_PointConfig: {
        pointUnit: BigInt(POINTS_UNIT),
        pointRake: scaleMultiplier(0.01), // out of 1, scales to out of 10000
        pointSellTax: BigInt(POINTS_UNIT * 0),
        minPointCost: BigInt(POINTS_UNIT * 0.00002),
        startPointCost: BigInt(POINTS_UNIT * 0.00004),
        pointGenRate: BigInt(POINTS_UNIT * 0.00002),
        pointCostIncrease: BigInt(POINTS_UNIT * 0.00002),
      },
      Turn: {
        nextTurnBlock: 0n,
        empire: EEmpire.Red,
      },
    },
  },

  CreateShipOverride: {
    keys: [{ [EOverride.CreateShip]: "uint8" }],
    tables: {
      P_OverrideConfig: {
        progressBool: true,
        minOverrideCost: 0n,
        startOverrideCost: BigInt(POINTS_UNIT * 0.00004),
        overrideGenRate: BigInt(POINTS_UNIT * 0.00002),
        overrideCostIncrease: BigInt(POINTS_UNIT * 0.00004),
      },
    },
  },

  KillShipOverride: {
    keys: [{ [EOverride.KillShip]: "uint8" }],
    tables: {
      P_OverrideConfig: {
        progressBool: false,
        minOverrideCost: 0n,
        startOverrideCost: BigInt(POINTS_UNIT * 0.00004),
        overrideGenRate: BigInt(POINTS_UNIT * 0.00002),
        overrideCostIncrease: BigInt(POINTS_UNIT * 0.00004),
      },
    },
  },

  ChargeShieldOverride: {
    keys: [{ [EOverride.ChargeShield]: "uint8" }],
    tables: {
      P_OverrideConfig: {
        progressBool: true,
        minOverrideCost: 0n,
        startOverrideCost: BigInt(POINTS_UNIT * 0.00004),
        overrideGenRate: BigInt(POINTS_UNIT * 0.00002),
        overrideCostIncrease: BigInt(POINTS_UNIT * 0.00004),
      },
    },
  },

  DrainShieldOverride: {
    keys: [{ [EOverride.DrainShield]: "uint8" }],
    tables: {
      P_OverrideConfig: {
        progressBool: false,
        minOverrideCost: 0n,
        startOverrideCost: BigInt(POINTS_UNIT * 0.00004),
        overrideGenRate: BigInt(POINTS_UNIT * 0.00002),
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
        goldCost: 2n,
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
