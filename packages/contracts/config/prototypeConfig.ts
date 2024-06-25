import { worldInput } from "../mud.config";
import { PrototypesConfig } from "../ts/prototypes/types";
import { EEmpire } from "./enums";

const percentsToThresholds = (percents: { none: number; away: number; lateral: number; toward: number }) => {
  if (percents.none + percents.away + percents.lateral + percents.toward > 1) throw new Error("percents must sum to 1");
  const none = percents.none;
  const away = percents.away + none;
  const lateral = percents.lateral + away;
  const toward = percents.toward + lateral;

  return {
    none: BigInt(Math.round(none * 10000)),
    away: BigInt(Math.round(away * 10000)),
    lateral: BigInt(Math.round(lateral * 10000)),
    toward: BigInt(Math.round(toward * 10000)),
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
      P_MoveConfig: percentsToThresholds({
        none: 0.25,
        away: 0.75 * 0.7,
        lateral: 0.75 * 0.2,
        toward: 0.75 * 0.1,
      }),
      Turn: {
        nextTurnBlock: 0n,
        empire: EEmpire.Red,
      },
    },
  },
};
