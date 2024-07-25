import { worldInput } from "../mud.config";
import { PrototypesConfig } from "../ts/prototypes/types";
import { POINTS_UNIT } from "./constants";
import { EEmpire, ENPCAction } from "./enums";

const percentsToThresholds = <T extends Record<string, number>>(percents: T): Record<keyof T, bigint> => {
  const total = Object.values(percents).reduce((acc, val) => acc + val, 0);
  if (total !== 1) throw new Error("percents must sum to 1");

  let cumulative = 0;
  const thresholds = {} as Record<keyof T, bigint>;

  for (const [key, value] of Object.entries(percents)) {
    cumulative += value;
    thresholds[key as keyof T] = BigInt(Math.round(cumulative * 10000));
  }

  return thresholds;
};

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
      P_ActionConfig: {
        actionGenRate: BigInt(POINTS_UNIT * 0.00002),
        actionCostIncrease: BigInt(POINTS_UNIT * 0.00004),
        startActionCost: BigInt(POINTS_UNIT * 0.00004),
        minActionCost: 0n,
        reductionPct: scaleMultiplier(0.5), // out of 1, scales to out of 10000
        regressMultiplier: scaleMultiplier(0.01), // out of 1, scales to out of 10000
      },
      P_NPCMoveThresholds: percentsToThresholds({
        none: 0.25,
        expand: 0.75 * 0.5,
        lateral: 0.75 * 0.3,
        retreat: 0.75 * 0.2,
      }),
      P_NPCActionThresholds: percentsToThresholds({
        none: 0.2,
        buyShips: 0.5,
        buyShields: 0.3,
      }),

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
};
