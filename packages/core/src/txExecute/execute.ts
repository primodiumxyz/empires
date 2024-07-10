import { AccountClient, Core, WorldAbiType } from "@core/lib/types";
import { WorldAbi } from "@core/lib/WorldAbi";
import { TxQueueOptions } from "@core/tables/types";
import { _execute } from "@core/txExecute/_execute";
import { encodeSystemCall, SystemCall } from "@core/txExecute/encodeSystemCall";
import { functionSystemIds } from "@core/txExecute/functionSystemIds";
import { Abi, ContractFunctionName, TransactionReceipt } from "viem";

export type ExecuteCallOptions<abi extends Abi, functionName extends ContractFunctionName<abi>> = Omit<
  SystemCall<abi, functionName>,
  "abi" | "systemId"
> & {
  abi?: abi;
  options?: { gas?: bigint };
  txQueueOptions?: TxQueueOptions;
  onComplete?: (receipt: TransactionReceipt | undefined) => void | undefined;
};
export function execute<functionName extends ContractFunctionName<WorldAbiType>>({
  core,
  accountClient: { playerAccount },
  functionName,
  args,
  options: callOptions,
  txQueueOptions,
  onComplete,
}: ExecuteCallOptions<WorldAbiType, functionName> & {
  core: Core;
  accountClient: AccountClient;
}) {
  console.info(`[Tx] Executing ${functionName} with address ${playerAccount.address.slice(0, 6)}`);

  const run = async () => {
    const systemId = functionSystemIds[functionName as ContractFunctionName<WorldAbiType>];
    if (!systemId || !args) throw new Error(`System ID not found for function ${functionName}`);
    const params = encodeSystemCall(core.tables, {
      abi: WorldAbi,
      systemId,
      functionName,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args: args as any,
    });
    const tx = playerAccount.worldContract.write.call(params, callOptions);
    const receipt = await _execute(core, tx);
    onComplete?.(receipt);
  };

  if (txQueueOptions) core.tables.TransactionQueue.enqueue(run, txQueueOptions);
  else {
    run();
  }
}
