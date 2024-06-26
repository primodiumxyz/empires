import { Abi, ContractFunctionName, Hex, TransactionReceipt } from "viem";
import { encodeSystemCall, encodeSystemCallFrom, SystemCall } from "@/txExecute/encodeSystemCall";
import { TxQueueOptions } from "@/tables/types";
import { _execute } from "@/txExecute/_execute";
import { AccountClient, Core, WorldAbiType } from "@/lib/types";
import { WorldAbi } from "@/lib/WorldAbi";
import { functionSystemIds } from "@/txExecute/functionSystemIds";

export type ExecuteCallOptions<abi extends Abi, functionName extends ContractFunctionName<abi>> = Omit<
  SystemCall<abi, functionName>,
  "abi" | "systemId"
> & {
  abi?: abi;
  withSession?: boolean;
  options?: { gas?: bigint };
  txQueueOptions?: TxQueueOptions;
  onComplete?: (receipt: TransactionReceipt | undefined) => void | undefined;
};
export function execute<functionName extends ContractFunctionName<WorldAbiType>>({
  core,
  accountClient: { playerAccount, sessionAccount },
  withSession,
  functionName,
  args,
  options: callOptions,
  txQueueOptions,
  onComplete,
}: ExecuteCallOptions<WorldAbiType, functionName> & {
  core: Core;
  accountClient: AccountClient;
}) {
  const account = withSession ? sessionAccount ?? playerAccount : playerAccount;
  const authorizing = account == sessionAccount;

  console.info(
    `[Tx] Executing ${functionName} with address ${account.address.slice(0, 6)} ${
      authorizing ? "(with session acct)" : ""
    }`
  );

  const run = async () => {
    let tx: Promise<Hex>;

    const systemId = functionSystemIds[functionName as ContractFunctionName<WorldAbiType>];
    if (!systemId || !args) throw new Error(`System ID not found for function ${functionName}`);
    if (authorizing && sessionAccount) {
      const params = encodeSystemCallFrom(core.tables, {
        abi: WorldAbi,
        from: playerAccount.address,
        systemId,
        functionName,
        args: args as any,
      });
      tx = sessionAccount.worldContract.write.callFrom(params, callOptions);
    } else {
      const params = encodeSystemCall(core.tables, {
        abi: WorldAbi,
        systemId,
        functionName,
        args: args as any,
      });
      tx = playerAccount.worldContract.write.call(params, callOptions);
    }
    const receipt = await _execute(core, tx);
    onComplete?.(receipt);
  };

  if (txQueueOptions) core.tables.TransactionQueue.enqueue(run, txQueueOptions);
  else {
    run();
  }
}
