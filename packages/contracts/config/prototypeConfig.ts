import { worldInput } from "../mud.config";
import { PrototypesConfig } from "../ts/prototypes/types";
import { EEmpire } from "./enums";

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

export const prototypeConfig: PrototypesConfig<(typeof worldInput)["tables"]> = {
  /* ---------------------------------- World --------------------------------- */
  World: {
    keys: [],
    tables: {
      P_GameConfig: {
        turnLengthBlocks: 60n * 2n,
        goldGenRate: 1n,
      },
      P_NPCMoveThresholds: percentsToThresholds({
        none: 0.25,
        expand: 0.75 * 0.7,
        lateral: 0.75 * 0.2,
        retreat: 0.75 * 0.1,
      }),
      P_NPCActionThresholds: percentsToThresholds({
        none: 0.9,
        buyDestroyers: 0.1,
      }),

      Turn: {
        nextTurnBlock: 0n,
        empire: EEmpire.Red,
      },
    },
  },
};
