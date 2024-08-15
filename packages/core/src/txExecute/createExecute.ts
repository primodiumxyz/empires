import { ContractFunctionName } from "viem";

import { Core, ExternalAccount, LocalAccount, TxReceipt, WorldAbiType } from "@core/lib/types";
import { TxQueueOptions } from "@core/tables/types";
import { SystemCall } from "@core/txExecute/encodeSystemCall";
import { ExecuteCallOptions, execute as rawExecute } from "@core/txExecute/execute";
import { executeBatch as rawExecuteBatch } from "@core/txExecute/executeBatch";

// Function that takes in a transaction promise that resolves to a completed transaction
// Alerts the user if the transaction failed
// Providers renamed to client: https://viem.sh/docs/ethers-migration.html

export type ExecuteFunctions = {
  execute: <functionName extends ContractFunctionName<WorldAbiType>>(
    options: ExecuteCallOptions<WorldAbiType, functionName>,
  ) => Promise<TxReceipt>;
  executeBatch: <functionName extends ContractFunctionName<WorldAbiType>>(options: {
    systemCalls: readonly Omit<SystemCall<WorldAbiType, functionName>, "abi" | "systemId">[];

    txQueueOptions?: TxQueueOptions;
    onComplete?: (receipt: TxReceipt) => void;
  }) => Promise<TxReceipt>;
};

export function createExecute(core: Core, account: ExternalAccount | LocalAccount): ExecuteFunctions {
  async function execute<functionName extends ContractFunctionName<WorldAbiType>>(
    callOptions: ExecuteCallOptions<WorldAbiType, functionName>,
  ) {
    return rawExecute({ core, playerAccount: account, ...callOptions });
  }

  async function executeBatch<functionName extends ContractFunctionName<WorldAbiType>>({
    systemCalls,
    txQueueOptions,
    onComplete,
  }: {
    systemCalls: readonly Omit<SystemCall<WorldAbiType, functionName>, "abi" | "systemId">[];
    withSession?: boolean;
    txQueueOptions?: TxQueueOptions;
    onComplete?: (receipt: TxReceipt) => void;
  }) {
    return rawExecuteBatch({
      core,
      playerAccount: account,
      systemCalls,
      txQueueOptions,
      onComplete,
    });
  }
  return { executeBatch, execute };
}
