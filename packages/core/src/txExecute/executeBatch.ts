import { ContractFunctionName, TransactionReceipt } from "viem";

import { AccountClient, Core, WorldAbiType } from "@/lib/types";
import { WorldAbi } from "@/lib/WorldAbi";
import { TxQueueOptions } from "@/tables/types";
import { _execute } from "@/txExecute/_execute";
import { encodeSystemCalls, SystemCall } from "@/txExecute/encodeSystemCall";
import { functionSystemIds } from "@/txExecute/functionSystemIds";

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
}) {
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

  if (txQueueOptions)
    core.tables.TransactionQueue.enqueue(async () => {
      const txPromise = run();
      const receipt = await _execute(core, txPromise);
      onComplete?.(receipt);
    }, txQueueOptions);
  else {
    const txPromise = run();
    const receipt = await _execute(core, txPromise);
    onComplete?.(receipt);
  }
}
