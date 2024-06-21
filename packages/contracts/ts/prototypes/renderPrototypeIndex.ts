import { renderedSolidityHeader } from "@latticexyz/common/codegen";
import { StoreInput } from "@latticexyz/store/config/v2";
import { PrototypesConfig } from "./types";

export function renderPrototypeIndex(prototypes: PrototypesConfig<StoreInput>) {
  return `
  ${renderedSolidityHeader}

  import { createPrototypes } from "./prototypes/AllPrototype.sol";


  ${Object.keys(prototypes)
    .map((key) => `import {${key}Prototype, ${key}PrototypeId} from "./prototypes/AllPrototype.sol"`)
    .join(";")};
  `;
}
