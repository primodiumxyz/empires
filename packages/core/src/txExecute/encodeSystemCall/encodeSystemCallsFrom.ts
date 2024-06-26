import type { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from "abitype";
import { Abi, Address, type ContractFunctionName } from "viem";
import { SystemCallFrom, encodeSystemCallFrom } from "./encodeSystemCallFrom";
import { Tables } from "@/lib/types";
import { WorldAbi } from "@/lib/WorldAbi";

/** Encode system calls to be passed as arguments into `World.batchCallFrom` */
export function encodeSystemCallsFrom<abi extends Abi, functionName extends ContractFunctionName<abi>>(
  abi: abi,
  tables: Tables,
  from: Address,
  systemCalls: readonly Omit<SystemCallFrom<abi, functionName>, "abi" | "from">[]
): AbiParametersToPrimitiveTypes<ExtractAbiFunction<typeof WorldAbi, "callFrom">["inputs"]>[] {
  return systemCalls.map((systemCall) => {
    const call = { ...systemCall, abi, from } as SystemCallFrom<abi, functionName>;
    return encodeSystemCallFrom(tables, call);
  });
}
