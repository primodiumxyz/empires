import { Abi, ContractFunctionName } from "viem";

import { Core, ExternalAccount, LocalAccount, TxReceipt, WorldAbiType } from "@core/lib/types";
import { WorldAbi } from "@core/lib/WorldAbi";
import { TxQueueOptions } from "@core/tables/types";
import { _execute } from "@core/txExecute/_execute";
import { encodeSystemCall, SystemCall } from "@core/txExecute/encodeSystemCall";
import { functionSystemIds } from "@core/txExecute/functionSystemIds";

export type ExecuteCallOptions<abi extends Abi, functionName extends ContractFunctionName<abi>> = Omit<
  SystemCall<abi, functionName>,
  "abi" | "systemId"
> & {
  abi?: abi;
  options?: { gas?: bigint; value?: bigint };
  txQueueOptions?: TxQueueOptions;
  onComplete?: (receipt: TxReceipt) => void;
};

export async function execute<functionName extends ContractFunctionName<WorldAbiType>>({
  core,
  playerAccount,
  functionName,
  args,
  options: callOptions,
  txQueueOptions,
  onComplete,
}: ExecuteCallOptions<WorldAbiType, functionName> & {
  core: Core;
  playerAccount: ExternalAccount | LocalAccount | null;
}): Promise<TxReceipt> {
  if (playerAccount === null) {
    console.error("Player account is required");
    return Promise.resolve({} as TxReceipt);
  }
  console.info(`[Tx] Executing ${functionName} with address ${playerAccount.address.slice(0, 6)}`);

  const run = async (): Promise<TxReceipt> => {
    const systemId = functionSystemIds[functionName as ContractFunctionName<WorldAbiType>];
    if (!systemId || !args) throw new Error(`System ID not found for function ${functionName}`);
    const params = encodeSystemCall(core.tables, {
      abi: WorldAbi,
      systemId,
      functionName,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args: args as any,
    });
    const tx = async () => {
      const ret = await playerAccount.worldContract.write.call(params, callOptions);
      return ret;
    };
    const simulateTx = async (options?: { blockNumber?: bigint }) => {
      await playerAccount.worldContract.simulate.call(params, {
        ...callOptions,
        account: playerAccount.address,
        ...options,
      });
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
