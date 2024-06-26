import { useEffect, useMemo, useRef, useState } from "react";

import { AccountClientProvider, CoreProvider, useCore } from "@primodiumxyz/core/react";

import Loading from "@/components/Loading";
import { usePrivy, useWallets, EIP1193Provider } from "@privy-io/react-auth";
import { Address } from "viem";

function Core() {
  const core = useCore();
  const { ready, user } = usePrivy();
  const { wallets } = useWallets();
  const [privyProvider, setPrivyProvider] = useState<EIP1193Provider | null>(null);

  const playerAddress = user?.wallet?.address as Address | undefined;

  useEffect(() => {
    const getTransport = async () => {
      if (wallets.length == 0) return null;
      const wallet = wallets[0];

      await wallet.switchChain(core.config.chain.id);
      const provider = await wallet.getEthereumProvider();
      setPrivyProvider(provider);
    };

    getTransport();
  }, [wallets]);

  if (!ready || privyProvider == null || !playerAddress) {
    return "loading...";
  }

  return (
    <AccountClientProvider playerAddress={playerAddress} provider={privyProvider}>
      <Loading />
    </AccountClientProvider>
  );
}
export default Core;
