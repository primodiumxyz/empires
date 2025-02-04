import { createContext, ReactNode, useCallback, useEffect, useState } from "react";
import { ConnectedWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { toast } from "react-toastify";
import { Address, EIP1193Provider, Hex, ProviderConnectInfo } from "viem";
import { generatePrivateKey } from "viem/accounts";

import { createExternalAccount, createLocalAccount, ExternalAccount, LocalAccount, storage } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";

type PlayerAccountOptions = {
  defaultLogin: ProviderType;
  allowBurner?: boolean;
};

type ProviderType = "privy" | "burner";

export type PlayerAccount = {
  playerAccount: ExternalAccount | LocalAccount | null;
  login: (type?: ProviderType) => void;
  logout: () => void;
  currentChainId: number | undefined;
};

type PlayerAccountProviderProps = PlayerAccountOptions & { children: ReactNode };

export const PlayerAccountContext = createContext<PlayerAccount | undefined>(undefined);

const localKey = "primodium_local_pkey";

/**
 * Provides the account client context to its children components.
 *
 * @param children - The child components to be wrapped by the account client context.
 * @param options - The options for the account provider.
 * @returns The account client provider.
 * @throws Will throw an error if neither playerAddress nor playerPrivateKey is provided.
 */
export function PlayerAccountProvider({ children, ...options }: PlayerAccountProviderProps) {
  if (options.defaultLogin === "burner" && !options.allowBurner) {
    throw new Error("Burner account not permitted. Please change default login.");
  }

  const {
    ready: privyReady,
    login: privyLogin,
    authenticated: privyAuthenticated,
    logout: privyLogout,
    user,
    connectWallet,
  } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  const core = useCore();
  const { config, tables } = core;

  /* ----------------------------- Player Account ----------------------------- */

  const [playerAccount, setPlayerAccount] = useState<ExternalAccount | LocalAccount | null>(null);
  const [providerType, setProviderType] = useState<ProviderType | null>(null);
  const [currentChainId, setCurrentChainId] = useState<number | undefined>(undefined);

  const getTransport = useCallback(
    async (wallet: ConnectedWallet) => {
      if (!privyReady) return null;

      await wallet.switchChain(core.config.chain.id);
      if (!wallet.linked) await wallet.loginOrLink();
      return await wallet.getEthereumProvider();
    },
    [privyReady, wallets, core.config.chain.id],
  );

  const createPrivy = useCallback(
    async (wallet: ConnectedWallet) => {
      const provider = await getTransport(wallet);
      if (!provider) return;
      const account = createExternalAccount(config, wallet.address as Address, {
        provider: provider as EIP1193Provider,
      });
      setPlayerAccount(account);
      setProviderType("privy");
      tables.Account.set({ value: account.entity });

      const chainId = await provider.request({ method: "eth_chainId" });
      setCurrentChainId(Number(chainId));
      provider.on("chainChanged", ({ chainId }: ProviderConnectInfo) => {
        setCurrentChainId(Number(chainId));
      });
    },
    [config, getTransport, tables],
  );

  const createBurner = useCallback(
    (onlyIfExists = false) => {
      let localPKey = storage.getItem(localKey) as Hex;
      if (!localPKey && !onlyIfExists) {
        localPKey = generatePrivateKey();
      }

      const playerAccount = createLocalAccount(config, localPKey);

      storage.setItem("burnerAccount", "true");
      storage.setItem(localKey, localPKey);

      toast.success("Logged in with local account");
      setProviderType("burner");
      setPlayerAccount(playerAccount);
    },
    [storage, config],
  );

  const login = async (type?: ProviderType) => {
    const loginType = type ?? options.defaultLogin;
    if (providerType !== null) {
      console.warn("Provider type already set, ignoring login request");
      return;
    }

    if (loginType === "burner") {
      if (!options.allowBurner) throw new Error("Burner account not permitted");
      createBurner();
      return;
    } else if (loginType === "privy") {
      // login with privy
      if (!privyReady) {
        console.error("Privy not ready, skipping login");
        return;
      }

      if (!privyAuthenticated) privyLogin();
      else connectWallet();
      return;
    } else {
      throw new Error("Invalid login type");
    }
  };

  // automatically login with burner account if it exists
  useEffect(() => {
    if (providerType !== null || !options.allowBurner) return;
    const burnerAccount = storage.getItem("burnerAccount");
    if (options.allowBurner && burnerAccount) {
      createBurner(true);
    }
  }, []);

  // automatically login with privy if the user is logged in
  useEffect(() => {
    if (!user || providerType !== null || wallets.length === 0) return;

    createPrivy(wallets[0]);
  }, [user, wallets, providerType]);

  useEffect(() => {
    if (!walletsReady || !privyAuthenticated) return;
    if (wallets.length === 0) {
      // logging out
      setPlayerAccount(null);
      setProviderType(null);
      connectWallet();
      return;
    } else {
      createPrivy(wallets[0]);
    }
  }, [wallets, walletsReady, privyAuthenticated]);

  const cancelBurner = useCallback(() => {
    storage.removeItem("burnerAccount");
    storage.removeItem(localKey);
    setPlayerAccount(null);
    setProviderType(null);
  }, [storage]);

  const cancelPrivy = useCallback(async () => {
    await privyLogout();
    setPlayerAccount(null);
    setProviderType(null);
  }, [privyLogout]);

  const logout = () => {
    if (providerType === "burner") cancelBurner();
    else cancelPrivy();
    setCurrentChainId(undefined);
    toast.success("Logged out");
  };

  return (
    <PlayerAccountContext.Provider value={{ playerAccount, login, logout, currentChainId }}>
      {children}
    </PlayerAccountContext.Provider>
  );
}
