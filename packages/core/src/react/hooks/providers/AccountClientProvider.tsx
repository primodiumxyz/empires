import { createContext, ReactNode, useCallback, useRef, useState } from "react";
import { Address, EIP1193Provider, Hex } from "viem";

import { createExternalAccount } from "@core/account/createExternalAccount";
import { createLocalAccount } from "@core/account/createLocalAccount";
import { AccountClient, ExternalAccount, LocalAccount } from "@core/lib/types";
import { useCore } from "@core/react/hooks/useCore";
import { storage } from "@core/utils/global/storage";

type AccountClientOptions = {
  playerAddress?: Address;
  playerPrivateKey?: Hex;
  provider?: EIP1193Provider;
};

type AccountProviderProps = AccountClientOptions & { children: ReactNode };

export const AccountClientContext = createContext<AccountClient | undefined>(undefined);

/**
 * Provides the account client context to its children components.
 *
 * @param children - The child components to be wrapped by the account client context.
 * @param options - The options for the account provider.
 * @throws Will throw an error if neither playerAddress nor playerPrivateKey is provided.
 * @returns The account client provider.
 */
export function AccountClientProvider({ children, ...options }: AccountProviderProps) {
  if (!options.playerAddress && !options.playerPrivateKey) throw new Error("Must provide address or private key");
  const provider = options.provider;

  const core = useCore();
  const { config, tables } = core;

  /* ----------------------------- Player Account ----------------------------- */

  const playerAccountInterval = useRef<NodeJS.Timeout | null>(null);

  const [playerAccount, setPlayerAccount] = useState<LocalAccount | ExternalAccount>(
    // this is a hack to make typescript happy with overloaded function params
    _updatePlayerAccount(options as { playerAddress: Address }),
  );

  function _updatePlayerAccount(options: { playerAddress: Address }): ExternalAccount;
  function _updatePlayerAccount(options: { playerPrivateKey: Hex }): LocalAccount;
  function _updatePlayerAccount(options: { playerAddress?: Address; playerPrivateKey?: Hex }) {
    const useLocal = !!options.playerPrivateKey;
    if (!useLocal && !options.playerAddress) throw new Error("Must provide address or private key");

    if (options.playerAddress && options.playerPrivateKey)
      console.warn("Private key provided for local account creation, ignoring address");

    const account = useLocal
      ? createLocalAccount(config, options.playerPrivateKey, false)
      : createExternalAccount(config, options.playerAddress!, {
          provider: provider,
        });

    if (useLocal) storage.setItem("primodiumPlayerAccount", account.privateKey ?? "");

    if (playerAccountInterval.current) {
      clearInterval(playerAccountInterval.current);
    }

    tables.Account.set({ value: account.entity });
    return account;
  }

  function updatePlayerAccount(options: { playerAddress?: Address; playerPrivateKey?: Hex }) {
    if (!options.playerAddress && !options.playerAddress) throw new Error("Must provide address or private key");
    // this is a hack to make typescript happy with overloaded function params
    const account = _updatePlayerAccount(options as { playerAddress: Address });
    setPlayerAccount(account);
    return account;
  }

  const memoizedUpdatePlayerAccount = useCallback(updatePlayerAccount, []);

  const accountClient: AccountClient = {
    playerAccount,
    setPlayerAccount: memoizedUpdatePlayerAccount,
  };

  return <AccountClientContext.Provider value={accountClient}>{children}</AccountClientContext.Provider>;
}
