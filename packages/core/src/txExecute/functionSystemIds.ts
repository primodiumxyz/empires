import { ContractFunctionName, Hex } from "viem";

import { WorldAbiType } from "@core/lib";
import { getSystemId } from "@core/utils";

export const functionSystemIds: {
  [functionName in ContractFunctionName<WorldAbiType>]?: Hex;
} = {
  /* ------------------------------- Delegation ------------------------------- */
  // callWithSignature: getSystemId("Registration", "CORE"),
  registerDelegation: getSystemId("Registration", "CORE"),
  unregisterDelegation: getSystemId("Registration", "CORE"),

  Empires__createDestroyer: getSystemId("ActionSystem"),
  Empires__killDestroyer: getSystemId("ActionSystem"),
  Empires__updateWorld: getSystemId("UpdateSystem"),
};
