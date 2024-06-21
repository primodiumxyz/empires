import { StoreInput } from "@latticexyz/store/config/v2";
import { PrototypesConfig } from "./types";

export function renderPrototypeScript(prototypeConfig: PrototypesConfig<StoreInput>) {
  return `
  function createPrototypes(IStore store) {
    ${Object.keys(prototypeConfig)
      .map((key) => `${key}Prototype(store)`)
      .join(";")};
  }`;
}
