import { ContractFunctionName, TransactionReceipt } from "viem";

import { SystemCallFrom } from "@/txExecute/encodeSystemCall";
import { TxQueueOptions } from "@/tables/types";
import { AccountClient, Core, WorldAbiType } from "@/lib/types";

import { ExecuteCallOptions, execute as rawExecute } from "@/txExecute/execute";
import { executeBatch as rawExecuteBatch } from "@/txExecute/executeBatch";
// Function that takes in a transaction promise that resolves to a completed transaction
// Alerts the user if the transaction failed
// Providers renamed to client: https://viem.sh/docs/ethers-migration.html

export type ExecuteFunctions = {
  execute: <functionName extends ContractFunctionName<WorldAbiType>>(
    options: ExecuteCallOptions<WorldAbiType, functionName>
  ) => Promise<void>;
  executeBatch: <functionName extends ContractFunctionName<WorldAbiType>>(options: {
    systemCalls: readonly Omit<SystemCallFrom<WorldAbiType, functionName>, "abi" | "from" | "systemId">[];
    withSession?: boolean;
    txQueueOptions?: TxQueueOptions;
    onComplete?: (receipt: TransactionReceipt | undefined) => void;
  }) => Promise<void>;
};

export function createExecute(core: Core, account: AccountClient): ExecuteFunctions {
  async function execute<functionName extends ContractFunctionName<WorldAbiType>>(
    callOptions: ExecuteCallOptions<WorldAbiType, functionName>
  ) {
    return rawExecute({ core, accountClient: account, ...callOptions });
  }

  async function executeBatch<functionName extends ContractFunctionName<WorldAbiType>>({
    systemCalls,
    withSession,
    txQueueOptions,
    onComplete,
  }: {
    systemCalls: readonly Omit<SystemCallFrom<WorldAbiType, functionName>, "abi" | "from" | "systemId">[];
    withSession?: boolean;
    txQueueOptions?: TxQueueOptions;
    onComplete?: (receipt: TransactionReceipt | undefined) => void;
  }) {
    return rawExecuteBatch({ core, accountClient: account, systemCalls, withSession, txQueueOptions, onComplete });
  }
  return { executeBatch, execute };
}
