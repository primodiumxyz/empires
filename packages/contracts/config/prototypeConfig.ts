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
        gameStartTimestamp: 0n, // currently handled in PostDeploy
      },
      P_PointConfig: {
        pointUnit: BigInt(POINTS_UNIT),
        minPointCost: BigInt(POINTS_UNIT * 0.00002),
        startPointCost: BigInt(POINTS_UNIT * 0.00004),
        pointGenRate: BigInt(POINTS_UNIT * 0.00004),
        pointCostIncrease: BigInt(POINTS_UNIT * 0.00002),
        pointRake: scaleRake(0.01), // out of 1, scales to out of 10000
        pointSellTax: BigInt(POINTS_UNIT * 0),
      },
      P_ActionConfig: {
        actionGenRate: BigInt(POINTS_UNIT * 0.00004),
        actionCostIncrease: BigInt(POINTS_UNIT * 0.00004),
        startActionCost: BigInt(POINTS_UNIT * 0.00004),
        minActionCost: 0n,
      },
      P_NPCMoveThresholds: percentsToThresholds({
        none: 0.25,
        expand: 0.75 * 0.7,
        lateral: 0.75 * 0.2,
        retreat: 0.75 * 0.1,
      }),
      P_NPCActionThresholds: percentsToThresholds({
        none: 0.2,
        buyShips: 0.8,
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
};
