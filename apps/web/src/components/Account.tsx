import { useEffect, useState } from "react";
import { UserIcon } from "@heroicons/react/24/solid";
import { Address } from "viem";

import { minEth } from "@primodiumxyz/core";
import { useCore, usePlayerAccount } from "@primodiumxyz/core/react";
import { Button } from "@/components/core/Button";
import { Price } from "@/components/shared/Price";
import { Username } from "@/components/shared/Username";
import { useBalance } from "@/hooks/useBalance";
import { useDripAccount } from "@/hooks/useDripAccount";
import { cn } from "@/util/client";

const DEV = import.meta.env.PRI_DEV === "true";

export const Account = ({ className }: { className?: string }) => {
  const { config } = useCore();
  const { playerAccount, login, currentChainId } = usePlayerAccount();
  const address = playerAccount?.address;

  if (!address)
    return (
      <Button size="md" variant="accent" onClick={() => login()}>
        Login
      </Button>
    );

  if (currentChainId !== config.chain.id)
    return (
      <Button size="sm" variant="error" onClick={() => playerAccount.walletClient.switchChain(config.chain)}>
        Switch to {config.chain.name}
      </Button>
    );

  return <_Account address={address} className={className} />;
};

export const _Account = ({ address, className }: { address: Address; className?: string }) => {
  const balance = useBalance(address).value ?? 0n;
  const [dripping, setDripping] = useState(false);

  const requestDrip = useDripAccount();
  const playerBalance = useBalance(address);

  useEffect(() => {
    if (playerBalance.loading || (playerBalance.value ?? 0n) >= minEth) return;
    setDripping(true);
    requestDrip(address)
      .catch((e) => console.error(e))
      .finally(() => setDripping(false));
  }, [address, playerBalance.value]);

  return (
    <div className={cn("min-w-42 flex flex-col text-right text-xs lg:gap-1", className)}>
      <div className="flex w-full flex-row justify-end gap-2">
        <UserIcon className="w-4" />
        <Username address={address} />
      </div>
      {dripping ? (
        <p className="text-sm text-accent">Dripping Eth</p>
      ) : (
        <Price wei={balance} className="text-sm text-accent" />
      )}
      {DEV && balance < minEth && <Button onClick={() => requestDrip(address, true)}>Rebuy</Button>}
    </div>
  );
};
