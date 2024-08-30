import { CallExecutionError, ContractFunctionExecutionError, Hex } from "viem";

import { Core, TxReceipt } from "@core/lib/types";

export async function _execute(
  { network: { publicClient } }: Core,
  txPromise: () => Promise<Hex>,
  simulateTxPromise: (options?: { blockNumber?: bigint }) => Promise<void>,
): Promise<TxReceipt> {
  let receipt: TxReceipt = { success: false, error: "" };

  try {
    await simulateTxPromise();
    const txHash = await txPromise();
    const txReceipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    receipt = { success: txReceipt.status === "success", ...txReceipt };

    if (!receipt.success) {
      // Fetch the transaction details to get the revert reason

      const data = await simulateTxPromise({
        blockNumber: txReceipt.blockNumber,
      });

      console.log({ data });

      // const errorMessage = data.error?.message || "Unknown error";
      // console.error(`[Transaction Failed] ${errorMessage}`);
      // receipt.error = data.error?.message || "Transaction failed. Please try again.";
    }
  } catch (error) {
    console.error(error);

    try {
      if (error instanceof ContractFunctionExecutionError) {
        // Thrown by network.waitForTransaction, no receipt is returned
        const reason = error.cause.shortMessage;
        console.warn(reason);
        receipt.error = reason;
      } else if (error instanceof CallExecutionError) {
        // Thrown by callTransaction, receipt is returned
        const reason = error.cause.shortMessage;
        console.warn(reason);
        receipt.error = reason;
      } else {
        console.error(`${error}`);
      }
    } catch (error) {
      // As of MUDv1, this would most likely be a gas error. i.e.:
      //     TypeError: Cannot set properties of null (setting 'gasPrice')
      // so we told the user to try again.
      // However, this is not the case for MUDv2, as network.waitForTransaction no longer
      // throws an error if the transaction fails.
      // We should be on the lookout for other errors that could be thrown here.
      receipt.error = `${error}`;
      console.error(`${error}`);
    }
  }
  if (receipt.error)
    receipt.error = receipt.error.replace(
      /^The contract function "\w+" reverted with the following reason:\s*/,
      "Error executing transaction: ",
    );
  return receipt;
}
