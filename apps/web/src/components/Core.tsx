import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Address, EIP1193Provider } from "viem";

import { AccountClientProvider, useCore } from "@primodiumxyz/core/react";
import Loading from "@/components/Loading";
import { useBurnerAccount } from "@/hooks/useBurnerAccount";

function Core() {
  const core = useCore();
  const { user, logout } = usePrivy();
  const { usingBurner, value: pKey } = useBurnerAccount();
  const { wallets } = useWallets();
  const [privyProvider, setPrivyProvider] = useState<EIP1193Provider>();

  const privateKey = usingBurner ? pKey : undefined;
  const playerAddress = !usingBurner ? (user?.wallet?.address as Address | undefined) : undefined;

  useEffect(() => {
    if (usingBurner) return;
    const getTransport = async () => {
      if (wallets.length == 0) {
        // privy doesn't handle auto logout if the user disconnects from the website via their wallet
        // so we need this workaround
        // https://privy-developers.slack.com/archives/C059ABLSB47/p1718368113160019?thread_ts=1718288582.864939&cid=C059ABLSB47
        logout();
        return;
      }
      const wallet = wallets[0];

      await wallet.switchChain(core.config.chain.id);
      const provider = await wallet.getEthereumProvider();
      // this typecast is neessary because privy provider is slightly different from viem provider
      setPrivyProvider(provider as EIP1193Provider);
    };

    getTransport();
  }, [wallets]);

  if (usingBurner && !privateKey) {
    return "Error. Using Burner but no private key. Please refresh.";
  }

  if (!usingBurner && (!privyProvider || !playerAddress)) {
    return "loading...";
  }

  return (
    <AccountClientProvider playerAddress={playerAddress} playerPrivateKey={privateKey} provider={privyProvider}>
      <Loading />
    </AccountClientProvider>
  );
}
export default Core;
