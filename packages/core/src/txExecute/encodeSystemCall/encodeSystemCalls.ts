import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from "abitype";
import { Abi, ContractFunctionName } from "viem";

import { Tables } from "@core/lib/types";
import { WorldAbi } from "@core/lib/WorldAbi";

import { encodeSystemCall, SystemCall } from "./encodeSystemCall";

/** Encode system calls to be passed as arguments into `World.batchCall` */
export function encodeSystemCalls<abi extends Abi, functionName extends ContractFunctionName<abi>>(
  abi: abi,
  tables: Tables,
  systemCalls: readonly Omit<SystemCall<abi, functionName>, "abi">[],
): AbiParametersToPrimitiveTypes<ExtractAbiFunction<typeof WorldAbi, "call">["inputs"]>[] {
  return systemCalls.map((systemCall) => {
    const call = { ...systemCall, abi } as SystemCall<abi, functionName>;
    return encodeSystemCall(tables, call);
  });
}
