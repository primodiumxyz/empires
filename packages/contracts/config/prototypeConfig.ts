import { worldInput } from "../mud.config";
import { PrototypesConfig } from "../ts/prototypes/types";

export const prototypeConfig: PrototypesConfig<(typeof worldInput)["tables"]> = {
  /* ---------------------------------- World --------------------------------- */
  World: {
    keys: [],
    tables: {
      P_GameConfig: {
        turnLengthSecs: 60n * 2n,
      },
    },
  },
};
