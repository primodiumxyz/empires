import { AccountClient, Core, WorldAbiType } from "@core/lib/types";
import { WorldAbi } from "@core/lib/WorldAbi";
import { TxQueueOptions } from "@core/tables/types";
import { _execute } from "@core/txExecute/_execute";
import { encodeSystemCalls, SystemCall } from "@core/txExecute/encodeSystemCall";
import { functionSystemIds } from "@core/txExecute/functionSystemIds";
import { ContractFunctionName, TransactionReceipt } from "viem";

export async function executeBatch<functionName extends ContractFunctionName<WorldAbiType>>({
  systemCalls,
  txQueueOptions,
  onComplete,
  core,
  accountClient: { playerAccount },
}: {
  core: Core;
  accountClient: AccountClient;
  systemCalls: readonly Omit<SystemCall<WorldAbiType, functionName>, "abi" | "systemId">[];
  txQueueOptions?: TxQueueOptions;
  onComplete?: (receipt: TransactionReceipt | undefined) => void;
}): Promise<boolean> {
  console.log(`[Tx] Executing batch:${systemCalls.map((system) => ` ${system.functionName}`)}`);

  const run = async () => {
    const systemCallsWithIds: Omit<SystemCall<WorldAbiType, functionName>, "abi">[] = systemCalls.map((system) => {
      const systemId = functionSystemIds[system.functionName as ContractFunctionName<WorldAbiType>];
      if (!systemId) throw new Error(`System ID not found for function ${system.functionName}`);
      return { ...system, systemId } as Omit<SystemCall<WorldAbiType, functionName>, "abi">;
    });
    const params = encodeSystemCalls(WorldAbi, core.tables, systemCallsWithIds).map(([systemId, callData]) => ({
      systemId,
      callData,
    }));
    const tx = await playerAccount.worldContract.write.batchCall([params]);
    return tx;
  };

  if (txQueueOptions) {
    return core.tables.TransactionQueue.enqueue(async () => {
      const txPromise = run();
      const receipt = await _execute(core, txPromise);
      onComplete?.(receipt);
      return receipt;
    }, txQueueOptions);
  } else {
    const txPromise = run();
    const receipt = await _execute(core, txPromise);
    onComplete?.(receipt);
    return receipt?.status === "success";
  }
}
