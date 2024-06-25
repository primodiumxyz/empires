import { worldInput } from "../mud.config";
import { PrototypesConfig } from "../ts/prototypes/types";
import { EEmpire } from "./enums";

export const prototypeConfig: PrototypesConfig<(typeof worldInput)["tables"]> = {
  /* ---------------------------------- World --------------------------------- */
  World: {
    keys: [],
    tables: {
      P_GameConfig: {
        turnLengthBlocks: 60n * 2n,
      },
      Turn: {
        nextTurnBlock: 0n,
        empire: EEmpire.Red,
      },
    },
  },
};
