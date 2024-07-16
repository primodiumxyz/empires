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

const scaleRake = (rakePct: number) => {
  if (rakePct < 0 || rakePct > 1) throw new Error("rakePct must be between 0 and 100");
  return BigInt(Math.round(rakePct * 10000));
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
        gameStartBlock: 0n, // currently handled in PostDeploy
      },
      P_PointConfig: {
        pointUnit: BigInt(POINTS_UNIT),
        minPointCost: BigInt(POINTS_UNIT * 0.01),
        startPointCost: BigInt(POINTS_UNIT * 0.02),
        pointGenRate: BigInt(POINTS_UNIT * 0.02),
        pointCostIncrease: BigInt(POINTS_UNIT * 0.01),
        pointRake: scaleRake(0.01), // out of 1, scales to out of 10000
        pointSellTax: BigInt(POINTS_UNIT * 0),
      },
      P_ActionConfig: {
        actionGenRate: BigInt(POINTS_UNIT * 0.02),
        actionCostIncrease: BigInt(POINTS_UNIT * 0.02),
        startActionCost: BigInt(POINTS_UNIT * 0.02),
        minActionCost: 0n,
      },
      P_NPCMoveThresholds: percentsToThresholds({
        none: 0.2,
        expand: 0.8 * 0.5,
        lateral: 0.8 * 0.3,
        retreat: 0.8 * 0.2,
      }),
      P_NPCActionThresholds: percentsToThresholds({
        none: 0.2,
        buyDestroyers: 0.8,
      }),

      Turn: {
        nextTurnBlock: 0n,
        empire: EEmpire.Red,
      },
    },
  },

  BuyDestroyers: {
    keys: [{ [ENPCAction.BuyDestroyers]: "uint8" }],
    tables: {
      P_NPCActionCosts: {
        goldCost: 2n,
      },
    },
  },
};
