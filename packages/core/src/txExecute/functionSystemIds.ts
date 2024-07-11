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

  Primodium_Base__increment: getSystemId("IncrementSystem", "Primodium_Base"),
  Primodium_Base__devSetField: getSystemId("DevSystem", "Primodium_Base"),
};
