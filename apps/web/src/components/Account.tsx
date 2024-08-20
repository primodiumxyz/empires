import { UserIcon } from "@heroicons/react/24/solid";

import { formatAddress } from "@primodiumxyz/core";
import { useAccountClient } from "@primodiumxyz/core/react";
import { Price } from "@/components/shared/Price";
import { useBalance } from "@/hooks/useBalance";
import { cn } from "@/util/client";

export const Account: React.FC<{ className?: string }> = ({ className }) => {
  const {
    playerAccount: { address },
  } = useAccountClient();

  const balance = useBalance(address).value ?? 0n;

  return (
    <div className={cn("min-w-42 flex flex-col gap-2 text-right text-xs", className)}>
      <div className="flex w-full flex-row justify-end gap-2">
        <UserIcon className="w-4" />
        <p>{formatAddress(address)}</p>
      </div>
      <Price wei={balance} className="text-sm text-accent" />
    </div>
  );
};
