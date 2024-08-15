import { useCallback, useMemo, useState } from "react";
import { transportObserver } from "@latticexyz/common";
import { createClient as createFaucetClient } from "@latticexyz/faucet";
import { createWalletClient, fallback, formatEther, Hex, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { minEth, TxReceipt } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { useSettings } from "@/hooks/useSettings";

export const DEV_CHAIN = import.meta.env.PRI_CHAIN_ID === "dev";

export const useDripAccount = (): ((address: Hex, force?: boolean) => Promise<TxReceipt | undefined>) => {
  const { network, config } = useCore();
  const [dripping, setDripping] = useState(false);

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

  const { Dripped } = useSettings();
  const dripAccount = useCallback(
    async (address: Hex, force?: boolean) => {
      const publicClient = network?.publicClient;
      const allowDrip = force || !Dripped.get(address as Entity)?.value;
      if (!publicClient || dripping || !allowDrip) return;
      setDripping(true);

      let txHash: Hex;
      if (faucet) {
        console.info(`[Faucet] ${address.slice(0, 7)} Balance is less than ${formatEther(minEth)}, dripping funds`);
        txHash = await faucet.drip.mutate({ address: address });
        const balance = await publicClient.getBalance({ address });
        console.info(`[Faucet] ${address.slice(0, 7)} New balance: ${formatEther(balance)} ETH`);
      } else if (externalWalletClient) {
        const amountToDrip = 10n * 10n ** 18n;
        txHash = await externalWalletClient.sendTransaction({ chain: config.chain, to: address, value: amountToDrip });
        console.info(`[Dev Drip] Dripped ${formatEther(amountToDrip)} to ${address.slice(0, 7)}`);
      } else {
        throw new Error("No faucet or external wallet client found");
      }

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      Dripped.set({ value: true }, address as Entity);
      setDripping(false);

      return { success: receipt.status === "success", ...receipt };
    },
    [externalWalletClient, faucet, network?.publicClient, config.chain],
  );

  return dripAccount;
};
