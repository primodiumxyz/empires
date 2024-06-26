import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from "abitype";
import { Abi, ContractFunctionName } from "viem";
import { SystemCall, encodeSystemCall } from "./encodeSystemCall";
import { Tables } from "@/lib/types";
import { WorldAbi } from "@/lib/WorldAbi";

/** Encode system calls to be passed as arguments into `World.batchCall` */
export function encodeSystemCalls<abi extends Abi, functionName extends ContractFunctionName<abi>>(
  abi: abi,
  tables: Tables,
  systemCalls: readonly Omit<SystemCall<abi, functionName>, "abi">[]
): AbiParametersToPrimitiveTypes<ExtractAbiFunction<typeof WorldAbi, "call">["inputs"]>[] {
  return systemCalls.map((systemCall) => {
    const call = { ...systemCall, abi } as SystemCall<abi, functionName>;
    return encodeSystemCall(tables, call);
  });
}
