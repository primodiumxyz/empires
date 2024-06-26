import { ContractFunctionName, TransactionReceipt } from "viem";

import { encodeSystemCalls, encodeSystemCallsFrom, SystemCall, SystemCallFrom } from "@/txExecute/encodeSystemCall";
import { TxQueueOptions } from "@/tables/types";
import { _execute } from "@/txExecute/_execute";
import { AccountClient, Core, WorldAbiType } from "@/lib/types";
import { WorldAbi } from "@/lib/WorldAbi";
import { functionSystemIds } from "@/txExecute/functionSystemIds";

export async function executeBatch<functionName extends ContractFunctionName<WorldAbiType>>({
  systemCalls,
  withSession,
  txQueueOptions,
  onComplete,
  core,
  accountClient: { playerAccount, sessionAccount },
}: {
  core: Core;
  accountClient: AccountClient;
  systemCalls: readonly Omit<SystemCallFrom<WorldAbiType, functionName>, "abi" | "from" | "systemId">[];
  withSession?: boolean;
  txQueueOptions?: TxQueueOptions;
  onComplete?: (receipt: TransactionReceipt | undefined) => void;
}) {
  const account = withSession ? sessionAccount ?? playerAccount : playerAccount;
  const authorizing = account !== playerAccount;

  console.log(
    `[Tx] Executing batch:${systemCalls.map(
      (system) => ` ${system.functionName}`
    )} with address ${account.address.slice(0, 6)} ${authorizing ? "(using session account)" : ""}`
  );

  const run = async () => {
    if (authorizing && sessionAccount) {
      const systemCallsWithIds: Omit<SystemCallFrom<WorldAbiType, functionName>, "abi" | "from">[] = systemCalls.map(
        (system) => {
          const systemId = functionSystemIds[system.functionName as ContractFunctionName<WorldAbiType>];
          if (!systemId) throw new Error(`System ID not found for function ${system.functionName}`);
          return { ...system, systemId } as Omit<SystemCallFrom<WorldAbiType, functionName>, "abi" | "from">;
        }
      );
      const params = encodeSystemCallsFrom(WorldAbi, core.tables, sessionAccount.entity, systemCallsWithIds).map(
        ([systemId, callData]) => ({ from: playerAccount.address, systemId, callData })
      );
      const tx = await sessionAccount.worldContract.write.batchCallFrom([params]);
      return tx;
    }
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
