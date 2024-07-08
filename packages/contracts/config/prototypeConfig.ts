import { worldInput } from "../mud.config";
import { PrototypesConfig } from "../ts/prototypes/types";
import { EEmpire } from "./enums";
import { POINTS_UNIT } from "./constants";

const percentsToThresholds = (percents: { none: number; expand: number; lateral: number; retreat: number }) => {
  if (percents.none + percents.expand + percents.lateral + percents.retreat > 1)
    throw new Error("percents must sum to 1");
  const none = percents.none;
  const expand = percents.expand + none;
  const lateral = percents.lateral + expand;
  const retreat = percents.retreat + lateral;

  return {
    none: BigInt(Math.round(none * 10000)),
    expand: BigInt(Math.round(expand * 10000)),
    lateral: BigInt(Math.round(lateral * 10000)),
    retreat: BigInt(Math.round(retreat * 10000)),
  };
};
export const prototypeConfig: PrototypesConfig<(typeof worldInput)["tables"]> = {
  /* ---------------------------------- World --------------------------------- */
  World: {
    keys: [],
    tables: {
      P_GameConfig: {
        turnLengthBlocks: 60n * 2n,
      },
      P_PointConfig: {
        minPointCost: 1n*BigInt(POINTS_UNIT),
        startPointCost: 2n*BigInt(POINTS_UNIT),
        pointGenRate: 2n*BigInt(POINTS_UNIT),
        pointCostIncrease: 1n*BigInt(POINTS_UNIT),
      },
      P_ActionConfig: {
        actionGenRate: BigInt(POINTS_UNIT)/2n,
        actionCostIncrease: BigInt(POINTS_UNIT)/2n,
        startActionCost: BigInt(POINTS_UNIT)/2n,
        minActionCost: 0n,
      },
      P_MoveConfig: percentsToThresholds({
        none: 0.25,
        expand: 0.75 * 0.7,
        lateral: 0.75 * 0.2,
        retreat: 0.75 * 0.1,
      }),
      Turn: {
        nextTurnBlock: 0n,
        empire: EEmpire.Red,
      },
    },
  },
};
