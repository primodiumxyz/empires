import { createBurnerAccount, transportObserver } from "@latticexyz/common";
import { createClient as createFaucetClient } from "@latticexyz/faucet";
import { createContext, ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { Address, createWalletClient, EIP1193Provider, fallback, formatEther, Hex, http } from "viem";

import { createExternalAccount } from "@core/account/createExternalAccount";
import { createLocalAccount } from "@core/account/createLocalAccount";
import { minEth } from "@core/lib/constants";
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
  const {
    config,
    tables,
    network: { publicClient },
  } = core;

  const { externalWalletClient, faucet } = useMemo(() => {
    const externalPKey = config.chain.name === "Foundry" ? config.devPrivateKey : undefined;
    const faucet = config.chain.faucetUrl ? createFaucetClient({ url: config.chain.faucetUrl }) : undefined;

    const externalWalletClient = externalPKey
      ? createWalletClient({
          chain: config.chain,
          transport: transportObserver(fallback([http()])),
          pollingInterval: 1000,
          account: createBurnerAccount(externalPKey),
        })
      : undefined;
    return { faucet, externalWalletClient };
  }, [config]);

  const requestDrip = useCallback(
    async (address: Address) => {
      if (faucet) {
        let balance = await publicClient.getBalance({ address });
        const lowBalance = balance < minEth;
        if (lowBalance) {
          console.log("[Faucet] balance:", formatEther(balance));
          console.info(`[Faucet] Balance is less than ${formatEther(minEth)}, dripping funds`);
          await faucet.drip.mutate({ address: address });
          balance = await publicClient.getBalance({ address });
          console.info(`[Faucet] New balance: ${formatEther(balance)} ETH`);
        }
      } else if (externalWalletClient) {
        const balance = await publicClient.getBalance({ address });
        const lowBalance = balance < minEth;
        if (!lowBalance) return;
        console.log("[Dev Drip] balance:", formatEther(balance));
        const amountToDrip = 10n * 10n ** 18n;
        await externalWalletClient.sendTransaction({
          to: address,
          value: amountToDrip,
        });
        console.info(`[Dev Drip] Dripped ${formatEther(amountToDrip)} to ${address}`);
      }
    },
    [externalWalletClient, faucet, publicClient],
  );

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

    if (useLocal && options.playerPrivateKey)
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

    requestDrip(account.address);
    playerAccountInterval.current = setInterval(() => requestDrip(account.address), 4000);
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

  const memoizedUpdatePlayerAccount = useCallback(updatePlayerAccount, [requestDrip]);

  const accountClient: AccountClient = {
    playerAccount,
    requestDrip,
    setPlayerAccount: memoizedUpdatePlayerAccount,
  };

  return <AccountClientContext.Provider value={accountClient}>{children}</AccountClientContext.Provider>;
}
