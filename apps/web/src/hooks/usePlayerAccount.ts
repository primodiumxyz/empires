import { useContext } from "react";

import { PlayerAccount, PlayerAccountContext } from "@/hooks/providers/PlayerAccountProvider";

/**
 * Teturns the account client from the AccountClientContext.
 *
 * @returns The account client from the AccountClientContext.
 * @throws {Error} If used outside of an AccountProvider.
 */
export const usePlayerAccount = (): PlayerAccount => {
  const context = useContext(PlayerAccountContext);
  if (!context) {
    throw new Error("usePlayerAccount must be used within an PlayerAccountProvider");
  }

  return context;
};
