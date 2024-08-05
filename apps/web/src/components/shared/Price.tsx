import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { formatEther } from "viem";

import { useCore } from "@primodiumxyz/core/react";
import { Tooltip } from "@/components/core/Tooltip";
import { useEthPrice } from "@/hooks/useEthPrice";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/util/client";

export const Price = ({ wei, className }: { wei: bigint; className?: string }) => {
  const {
    utils: { weiToUsd },
  } = useCore();
  const { price, loading } = useEthPrice();
  const { showBlockchainUnits } = useSettings();

  if (showBlockchainUnits.enabled) return <span className={className}>{formatEther(wei)}ETH</span>;
  if (loading) return <span className={className}>...</span>;
  if (!price)
    return (
      <div className={cn("flex items-center justify-center gap-1", className)}>
        <span>{formatEther(wei)}ETH</span>
        <Tooltip tooltipContent="Could not retrieve ETH price">
          <InformationCircleIcon className="text-error" />
        </Tooltip>
      </div>
    );
  return <span className={className}>{weiToUsd(wei, price)}</span>;
};
