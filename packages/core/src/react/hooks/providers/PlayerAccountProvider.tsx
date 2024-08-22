import { createContext, ReactNode, useRef, useState } from "react";
import { Address, EIP1193Provider, Hex } from "viem";

import { createExternalAccount } from "@core/account/createExternalAccount";
import { createLocalAccount } from "@core/account/createLocalAccount";
import { ExternalAccount, LocalAccount, LoginOptions, PlayerAccount } from "@core/lib/types";
import { useCore } from "@core/react/hooks/useCore";
import { storage } from "@core/utils/global/storage";

type PlayerAccountOptions = {
  playerAddress?: Address;
  playerPrivateKey?: Hex;
  provider?: EIP1193Provider;
};

type PlayerAccountProviderProps = PlayerAccountOptions & { children: ReactNode };

export const PlayerAccountContext = createContext<PlayerAccount | undefined>(undefined);

/**
 * Provides the account client context to its children components.
 *
 * @param children - The child components to be wrapped by the account client context.
 * @param options - The options for the account provider.
 * @throws Will throw an error if neither playerAddress nor playerPrivateKey is provided.
 * @returns The account client provider.
 */
export function PlayerAccountProvider({ children, ...options }: PlayerAccountProviderProps) {
  const provider = options.provider;

  const core = useCore();
  const { config, tables } = core;

  /* ----------------------------- Player Account ----------------------------- */

  const playerAccountInterval = useRef<NodeJS.Timeout | null>(null);

  const [playerAccount, setPlayerAccount] = useState<ExternalAccount | LocalAccount | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  const login = (loginOptions: LoginOptions) => {
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
  };

  const logout = () => {
    setPlayerAccount(null);
    setLoggedIn(false);
  };

  return (
    <PlayerAccountContext.Provider value={{ playerAccount, loggedIn, login, logout }}>
      {children}
    </PlayerAccountContext.Provider>
  );
}
