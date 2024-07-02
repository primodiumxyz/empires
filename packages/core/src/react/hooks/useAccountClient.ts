import { useContext } from "react";

import { AccountClient } from "@/lib/types";
import { AccountClientContext } from "@/react/hooks/providers/AccountClientProvider";

/**
 * Teturns the account client from the AccountClientContext.
 *
 * @returns The account client from the AccountClientContext.
 * @throws {Error} If used outside of an AccountProvider.
 */
export const useAccountClient = (): AccountClient => {
  const context = useContext(AccountClientContext);
  if (!context) {
    throw new Error("useAccountClient must be used within an AccountProvider");
  }

  return context;
};
