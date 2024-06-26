import { useEffect, useState } from "react";

import { AccountClientProvider, useCore } from "@primodiumxyz/core/react";

import Loading from "@/components/Loading";
import { usePrivy, useWallets, EIP1193Provider } from "@privy-io/react-auth";
import { Address } from "viem";
import { useBurnerAccount } from "@/hooks/useBurnerAccount";

function Core() {
  const core = useCore();
  const { user } = usePrivy();
  const { usingBurner, value: pKey } = useBurnerAccount();
  const { wallets } = useWallets();
  const [privyProvider, setPrivyProvider] = useState<EIP1193Provider>();

  const privateKey = usingBurner ? pKey : undefined;
  const playerAddress = !usingBurner ? (user?.wallet?.address as Address | undefined) : undefined;

  useEffect(() => {
    if (usingBurner) return;
    const getTransport = async () => {
      if (wallets.length == 0) return null;
      const wallet = wallets[0];

      await wallet.switchChain(core.config.chain.id);
      const provider = await wallet.getEthereumProvider();
      setPrivyProvider(provider);
    };

    getTransport();
  }, [wallets]);

  if (usingBurner && !privateKey) {
    return "Error. Using Burner but no private key. Please refresh.";
  }
  if (!usingBurner && (privyProvider == null || !playerAddress)) {
    return "loading...";
  }

  return (
    <AccountClientProvider playerAddress={playerAddress} playerPrivateKey={privateKey} provider={privyProvider}>
      <Loading />
    </AccountClientProvider>
  );
}
export default Core;
