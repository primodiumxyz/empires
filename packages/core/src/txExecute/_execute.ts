import { CallExecutionError, ContractFunctionExecutionError, Hex, PublicClient } from "viem";

import { Core, TxReceipt } from "@core/lib/types";

export async function _execute(
  { network: { publicClient } }: Core,
  txPromise: () => Promise<Hex>,
  simulateTxPromise: () => Promise<void>,
): Promise<TxReceipt> {
  let receipt: TxReceipt = { success: false, error: "" };

  try {
    await simulateTxPromise();
    const txHash = await txPromise();
    const txReceipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    receipt = { success: txReceipt.status === "success", ...txReceipt };
    console.log("[Tx] hash: ", txHash);

    if (!receipt.success) {
      // Force a CallExecutionError such that we can get the revert reason
      await callTransaction(publicClient, txHash);
      console.error("[Insufficient Gas Limit] You're moving fast! Please wait a moment and then try again.");
      receipt.error = "Insufficient Gas Limit";
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
      receipt.error = "Unknown error";
      console.error(`${error}`);
    }
  }

  return receipt;
}

// Call from a hash to force a CallExecutionError such that we can get the revert reason
async function callTransaction(publicClient: PublicClient, txHash: Hex): Promise<void> {
  const tx = await publicClient.getTransaction({ hash: txHash });
  if (!tx) throw new Error("Transaction does not exist");
  await publicClient.call({
    account: tx.from!,
    to: tx.to!,
    data: tx.input,
  });
}
