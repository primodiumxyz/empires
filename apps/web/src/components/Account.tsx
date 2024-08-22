import { useEffect, useState } from "react";
import { UserIcon } from "@heroicons/react/24/solid";
import { Address } from "viem";

import { formatAddress, minEth } from "@primodiumxyz/core";
import { usePlayerAccount } from "@primodiumxyz/core/react";
import { Button } from "@/components/core/Button";
import { Price } from "@/components/shared/Price";
import { useBalance } from "@/hooks/useBalance";
import { useDripAccount } from "@/hooks/useDripAccount";
import { cn } from "@/util/client";

const DEV = import.meta.env.PRI_DEV === "true";

export const Account = ({ className }: { className?: string }) => {
  const { playerAccount, loggedIn, login } = usePlayerAccount();

  const address = playerAccount?.address;

  if (!loggedIn || !address) return <Button onClick={() => login({ withPrivy: true })}>Login</Button>;
  return <_Account address={address} className={className} />;
};

export const _Account = ({ address, className }: { address: Address; className?: string }) => {
  const balance = useBalance(address).value ?? 0n;
  const [dripping, setDripping] = useState(false);

  const requestDrip = useDripAccount();
  const playerBalance = useBalance(address, 2000);

  useEffect(() => {
    const drip = async () => {
      if (playerBalance.loading || (playerBalance.value ?? 0n) >= minEth) return;
      setDripping(true);
      await requestDrip(address);
      setDripping(false);
    };
    drip();
  }, [address, playerBalance.value]);

  return (
    <div className={cn("min-w-42 flex flex-col text-right text-xs lg:gap-1", className)}>
      <div className="flex w-full flex-row justify-end gap-2">
        <UserIcon className="w-4" />
        <p className="lg:text-sm">{formatAddress(address)}</p>
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
