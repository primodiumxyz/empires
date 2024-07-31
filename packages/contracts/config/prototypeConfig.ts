import { worldInput } from "../mud.config";
import { PrototypesConfig } from "../ts/prototypes/types";
import { POINTS_UNIT } from "./constants";
import { EEmpire, ERoutine } from "./enums";

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
        minPointCost: BigInt(POINTS_UNIT * 0.00002),
        startPointCost: BigInt(POINTS_UNIT * 0.00004),
        pointGenRate: BigInt(POINTS_UNIT * 0.00002),
        pointCostIncrease: BigInt(POINTS_UNIT * 0.00002),
        pointRake: scaleMultiplier(0.01), // out of 1, scales to out of 10000
        pointSellTax: BigInt(POINTS_UNIT * 0),
      },
      P_OverrideConfig: {
        overrideGenRate: BigInt(POINTS_UNIT * 0.00002),
        overrideCostIncrease: BigInt(POINTS_UNIT * 0.00004),
        startOverrideCost: BigInt(POINTS_UNIT * 0.00004),
        minOverrideCost: 0n,
      },
      Turn: {
        nextTurnBlock: 0n,
        empire: EEmpire.Red,
      },
      P_TacticalStrikeConfig: {
        maxCharge: 100n,
        boostChargeIncrease: 10n,
        stunChargeDecrease: 10n,
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
