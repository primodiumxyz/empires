import { worldInput } from "../mud.config";
import { PrototypesConfig } from "../ts/prototypes/types";

export const prototypeConfig: PrototypesConfig<(typeof worldInput)["tables"]> = {
  /* ---------------------------------- World --------------------------------- */
  World : {
    keys : [],
    tables : {
      Counter : {
        value : 1n
      }
    }
  }
};
