import { ContractFunctionName } from "viem";

import { RevertMessageToUserError } from "@core/lib/lookups";
import { AccountClient, Core, TxReceipt, WorldAbiType } from "@core/lib/types";
import { WorldAbi } from "@core/lib/WorldAbi";
import { TxQueueOptions } from "@core/tables/types";
import { _execute } from "@core/txExecute/_execute";
import { encodeSystemCalls, SystemCall } from "@core/txExecute/encodeSystemCall";
import { functionSystemIds } from "@core/txExecute/functionSystemIds";

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
  onComplete?: (receipt: TxReceipt) => void;
}): Promise<boolean> {
  console.log(`[Tx] Executing batch:${systemCalls.map((system) => ` ${system.functionName}`)}`);

  const run = async (): Promise<TxReceipt> => {
    const systemCallsWithIds: Omit<SystemCall<WorldAbiType, functionName>, "abi">[] = systemCalls.map((system) => {
      const systemId = functionSystemIds[system.functionName as ContractFunctionName<WorldAbiType>];
      if (!systemId) throw new Error(`System ID not found for function ${system.functionName}`);
      return { ...system, systemId } as Omit<SystemCall<WorldAbiType, functionName>, "abi">;
    });
    const params = encodeSystemCalls(WorldAbi, core.tables, systemCallsWithIds).map(([systemId, callData]) => ({
      systemId,
      callData,
    }));
    const tx = playerAccount.worldContract.write.batchCall([params]);
    return await _execute(core, tx);
  };

  let receipt: TxReceipt | undefined = undefined;
  if (txQueueOptions) {
    receipt = await core.tables.TransactionQueue.enqueue(run, txQueueOptions);
  } else {
    receipt = await run();
  }

  if (receipt.error && receipt.error in RevertMessageToUserError) {
    receipt.error = RevertMessageToUserError[receipt.error as keyof typeof RevertMessageToUserError];
  }

  onComplete?.(receipt);
  return receipt.success;
}
