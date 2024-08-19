import { toast, ToastOptions } from "react-toastify";

import { TxReceipt } from "@primodiumxyz/core";

export const notify = (type: "success" | "error" | "info" | "warning", message: string) => {
  switch (type) {
    case "success":
      toast.success(message);
      break;
    case "error":
      toast.error(message);
      break;
    case "info":
      toast.info(message);
      break;
    case "warning":
      toast.warning(message);
      break;
  }
};

type WithTransactionStatusOptions = ToastOptions & {
  loading?: string;
  success?: string;
  error?: string;
  onComplete?: () => void;
};

const baseOptions = { isLoading: false, autoClose: 3000 };
export const withTransactionStatus = (
  fn: () => Promise<TxReceipt>,
  toastOptions: WithTransactionStatusOptions = { position: "bottom-left" },
) => {
  const loadingMsg = toastOptions.loading ?? "Executing transaction...";
  const successMsg = toastOptions.success ?? "Transaction executed successfully";
  const errorMsg = toastOptions.error ?? "Transaction failed";

  return (async () => {
    const toastId = toast.loading(loadingMsg, toastOptions);

    try {
      const receipt = await fn();

      if (receipt.success) {
        toast.update(toastId, {
          render: successMsg,
          type: "success",
          ...baseOptions,
        });
      } else {
        toast.update(toastId, {
          render: receipt.error ?? errorMsg,
          type: "error",
          ...baseOptions,
        });
      }

      return receipt.success;
    } catch (err) {
      console.error(err);
      toast.update(toastId, {
        render: errorMsg,
        type: "error",
        ...baseOptions,
      });

      return false;
    } finally {
      toastOptions.onComplete?.();
    }
  })();
};
