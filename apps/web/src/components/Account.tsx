import { UserIcon } from "@heroicons/react/24/solid";

import { formatAddress, minEth } from "@primodiumxyz/core";
import { useAccountClient } from "@primodiumxyz/core/react";
import { Button } from "@/components/core/Button";
import { Price } from "@/components/shared/Price";
import { useBalance } from "@/hooks/useBalance";
import { useDripAccount } from "@/hooks/useDripAccount";
import { cn } from "@/util/client";

const DEV = import.meta.env.PRI_DEV === "true";

export const Account = ({ className }: { className?: string }) => {
  const {
    playerAccount: { address },
  } = useAccountClient();

  const balance = useBalance(address).value ?? 0n;

  const requestDrip = useDripAccount();
  return (
    <div className={cn("min-w-42 flex flex-col text-right text-xs lg:gap-1", className)}>
      <div className="flex w-full flex-row justify-end gap-2">
        <UserIcon className="w-4" />
        <p className="lg:text-sm">{formatAddress(address)}</p>
      </div>
      <Price wei={balance} className="text-sm text-accent" />
      {DEV && balance < minEth && <Button onClick={() => requestDrip(address, true)}>Rebuy</Button>}
    </div>
  );
};
