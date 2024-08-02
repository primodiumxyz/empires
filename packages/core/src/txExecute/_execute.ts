import { CallExecutionError, ContractFunctionExecutionError, Hex, PublicClient } from "viem";

import { TX_TIMEOUT } from "@core/lib";
import { Core, TxReceipt } from "@core/lib/types";

export async function _execute(
  { network: { publicClient }, tables }: Core,
  txPromise: () => Promise<Hex>,
  simulateTxPromise: () => Promise<void>,
): Promise<TxReceipt> {
  const waitForTransaction = async (hash: Hex): Promise<TxReceipt> => {
    let unsubscribe: (() => void) | undefined = undefined;

    // Wait for the transaction to be mined and tables to be synced at the mined block
    const waitPromise = new Promise<TxReceipt>((resolve) => {
      publicClient
        .waitForTransactionReceipt({ hash })
        .then((txReceipt) => {
          // check if tables are synced at this block
          const lastBlockNumberProcessed = tables.SyncStatus.get()?.lastBlockNumberProcessed;
          if (lastBlockNumberProcessed && lastBlockNumberProcessed >= txReceipt.blockNumber) {
            resolve({ ...txReceipt, success: txReceipt.status === "success" });
          }

          // if not, wait for sync to catch up and return the receipt when it does
          unsubscribe = tables.SyncStatus.once({
            filter: ({ properties: { current } }) =>
              (current?.lastBlockNumberProcessed || BigInt(0)) >= txReceipt.blockNumber,
            do: () => resolve({ ...txReceipt, success: txReceipt.status === "success" }),
          });
        })
        .catch((err) => {
          console.log({ err });
          resolve({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
        });
    });

    // Prepare a timeout in case the receipt can't be found in time
    const timeoutPromise = new Promise<TxReceipt>((resolve) =>
      setTimeout(() => {
        unsubscribe?.();
        resolve({ success: false, error: "Transaction not found" });
      }, TX_TIMEOUT),
    );

    return await Promise.race([waitPromise, timeoutPromise]);
  };

  let receipt: TxReceipt = { success: false, error: "" };

  try {
    await simulateTxPromise();
    const txHash = await txPromise();
    receipt = await waitForTransaction(txHash);
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
