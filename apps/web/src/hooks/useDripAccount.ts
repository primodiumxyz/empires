import { transportObserver } from "@latticexyz/common";
import { createClient as createFaucetClient } from "@latticexyz/faucet";
import { minEth } from "@primodiumxyz/core";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { useCallback, useMemo } from "react";
import { useBalance } from "@/hooks/useBalance";
import { createWalletClient, fallback, formatEther, Hex, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const DEV_CHAIN = import.meta.env.PRI_CHAIN_ID === "dev";

export const useDripAccount = (): ((address: Hex) => void) => {
  const { network, config } = useCore();

  const { externalWalletClient, faucet } = useMemo(() => {
    const externalPKey = config.chain.name === "Foundry" ? import.meta.env.PRI_DEV_PKEY : undefined;
    const faucetUrl = config.chain.faucetUrl;
    const faucet = faucetUrl ? createFaucetClient({ url: faucetUrl }) : undefined;

    const externalWalletClient = externalPKey
      ? createWalletClient({
          chain: config.chain,
          transport: transportObserver(fallback([http()])),
          pollingInterval: 1000,
          account: privateKeyToAccount(externalPKey as Hex),
        })
      : undefined;
    return { faucet, externalWalletClient };
  }, [config.chain]);

  const dripAccount = useCallback(
    async (address: Hex) => {
      const publicClient = network?.publicClient;
      if (!publicClient) return;
      if (faucet) {
        console.info(`[Faucet] ${address.slice(0, 7)} Balance is less than ${formatEther(minEth)}, dripping funds`);
        await faucet.drip.mutate({ address: address });
        const balance = await publicClient.getBalance({ address });
        console.info(`[Faucet] ${address.slice(0, 7)} New balance: ${formatEther(balance)} ETH`);
      } else if (externalWalletClient) {
        const amountToDrip = 10n * 10n ** 18n;
        await externalWalletClient.sendTransaction({ chain: config.chain, to: address, value: amountToDrip });
        console.info(`[Dev Drip] Dripped ${formatEther(amountToDrip)} to ${address.slice(0, 7)}`);
      }
    },
    [externalWalletClient, faucet, network?.publicClient, config.chain]
  );

  return dripAccount;
};
