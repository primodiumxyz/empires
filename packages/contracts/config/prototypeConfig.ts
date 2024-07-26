import { worldInput } from "../mud.config";
import { PrototypesConfig } from "../ts/prototypes/types";
import { POINTS_UNIT } from "./constants";
import { EEmpire, ENPCAction } from "./enums";

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
        turnLengthBlocks: 1n,
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
      P_ActionConfig: {
        actionGenRate: BigInt(POINTS_UNIT * 0.00002),
        actionCostIncrease: BigInt(POINTS_UNIT * 0.00004),
        startActionCost: BigInt(POINTS_UNIT * 0.00004),
        minActionCost: 0n,
        reductionPct: scaleMultiplier(0.5), // out of 1, scales to out of 10000
        regressMultiplier: scaleMultiplier(0.01), // out of 1, scales to out of 10000
      },
      Turn: {
        nextTurnBlock: 0n,
        empire: EEmpire.Red,
      },
    },
  },

  BuyShips: {
    keys: [{ [ENPCAction.BuyShips]: "uint8" }],
    tables: {
      P_NPCActionCosts: {
        goldCost: 2n,
      },
    },
  },
  BuyShields: {
    keys: [{ [ENPCAction.BuyShields]: "uint8" }],
    tables: {
      P_NPCActionCosts: {
        goldCost: 2n,
      },
    },
  },
  // this is the gold added to the planet when this action is triggered
  AccumulateGold: {
    keys: [{ [ENPCAction.AccumulateGold]: "uint8" }],
    tables: {
      P_NPCActionCosts: {
        goldCost: 5n,
      },
    },
  },
};
