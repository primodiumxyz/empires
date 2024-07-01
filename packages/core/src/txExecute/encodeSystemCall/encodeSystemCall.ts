import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from "abitype";
import { Abi, EncodeFunctionDataParameters, Hex, type ContractFunctionName } from "viem";
import { encodeFunctionData } from "./encodeFunctionData";
import { Tables } from "@/lib/types";
import { WorldAbi } from "@/lib/WorldAbi";

export type SystemCall<abi extends Abi, functionName extends ContractFunctionName<abi>> = EncodeFunctionDataParameters<
  abi,
  functionName
> & {
  readonly systemId: Hex;
};

/** Encode a system call to be passed as arguments into `World.call` */
export function encodeSystemCall<abi extends Abi, functionName extends ContractFunctionName<abi>>(
  tables: Tables,
  { abi, systemId, functionName, args }: SystemCall<abi, functionName>
): AbiParametersToPrimitiveTypes<ExtractAbiFunction<typeof WorldAbi, "call">["inputs"]> {
  return [
    systemId,
    encodeFunctionData<abi, functionName>(tables, {
      abi,
      functionName,
      args,
    } as EncodeFunctionDataParameters<abi, functionName>),
  ];
}
