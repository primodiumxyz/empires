import { toast } from "react-toastify";

import { ExecuteFunctions, TxReceipt } from "@primodiumxyz/core";

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

type WithTransactionStatusOptions = {
  loading?: string;
  success?: string;
  error?: string;
  onComplete?: () => void;
};

const baseOptions = { isLoading: false, autoClose: 3000 };
export const withTransactionStatus = (fn: () => Promise<boolean>, toastOptions: WithTransactionStatusOptions = {}) => {
  const loadingMsg = toastOptions.loading ?? "Executing transaction...";
  const successMsg = toastOptions.success ?? "Transaction executed successfully";
  const errorMsg = toastOptions.error ?? "Transaction failed";

  return (async () => {
    const toastId = toast.loading(loadingMsg);

    try {
      const success = await fn();

      if (success) {
        toast.update(toastId, {
          render: successMsg,
          type: "success",
          ...baseOptions,
        });
      } else {
        toast.update(toastId, {
          render: errorMsg,
          type: "error",
          ...baseOptions,
        });
      }

      return success;
    } catch (err) {
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
