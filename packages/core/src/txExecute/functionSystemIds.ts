import { WorldAbiType } from "@/lib";
import { getSystemId } from "@/utils";
import { ContractFunctionName, Hex } from "viem";

export const functionSystemIds: {
  [functionName in ContractFunctionName<WorldAbiType>]?: Hex;
} = {
  /* ------------------------------- Delegation ------------------------------- */
  // callWithSignature: getSystemId("Registration", "CORE"),
  registerDelegation: getSystemId("Registration", "CORE"),
  unregisterDelegation: getSystemId("Registration", "CORE"),
};
