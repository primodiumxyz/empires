import { ContractFunctionName } from "viem";

import { Core, ExternalAccount, LocalAccount, TxReceipt, WorldAbiType } from "@core/lib/types";
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
  playerAccount,
}: {
  core: Core;
  playerAccount: LocalAccount | ExternalAccount | null;
  systemCalls: readonly Omit<SystemCall<WorldAbiType, functionName>, "abi" | "systemId">[];
  txQueueOptions?: TxQueueOptions;
  onComplete?: (receipt: TxReceipt) => void;
}): Promise<TxReceipt> {
  if (playerAccount === null) {
    console.error("Player account is required");
    return Promise.resolve({} as TxReceipt);
  }
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
    const tx = async () => await playerAccount.worldContract.write.batchCall([params]);
    const simulateTx = async () => {
      await playerAccount.worldContract.simulate.batchCall([params], { account: playerAccount.address });
    };
    return await _execute(core, tx, simulateTx);
  };

  let receipt: TxReceipt | undefined = undefined;
  if (txQueueOptions) {
    receipt = await core.tables.TransactionQueue.enqueue(run, txQueueOptions);
  } else {
    receipt = await run();
  }

  onComplete?.(receipt);
  return receipt;
}
