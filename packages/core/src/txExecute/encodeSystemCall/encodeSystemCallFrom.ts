import { Tables, WorldAbiType } from "@core/lib/types";
import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from "abitype";
import { Abi, Address, ContractFunctionName, EncodeFunctionDataParameters } from "viem";

import { encodeFunctionData } from "./encodeFunctionData";
import { SystemCall } from "./encodeSystemCall";

export type SystemCallFrom<abi extends Abi, functionName extends ContractFunctionName<abi>> = SystemCall<
  abi,
  functionName
> & {
  readonly from: Address;
};
/** Encode a system call to be passed as arguments into `World.callFrom` */
export function encodeSystemCallFrom<abi extends Abi, functionName extends ContractFunctionName<abi>>(
  tables: Tables,
  { abi, from, systemId, functionName, args }: SystemCallFrom<abi, functionName>,
): AbiParametersToPrimitiveTypes<ExtractAbiFunction<WorldAbiType, "callFrom">["inputs"]> {
  return [
    from,
    systemId,
    encodeFunctionData<abi, functionName>(tables, {
      abi,
      functionName,
      args,
    } as unknown as EncodeFunctionDataParameters<abi, functionName>),
  ];
}
