import { formatEther } from "viem";

import { useCore } from "@primodiumxyz/core/react";
import { useEthPrice } from "@/hooks/useEthPrice";

export const Price = ({
  wei,
  className,
  forceBlockchainUnits,
  precision,
}: {
  wei: bigint;
  className?: string;
  forceBlockchainUnits?: boolean;
  precision?: number;
}) => {
  const {
    utils: { weiToUsd },
  } = useCore();
  const { price, loading } = useEthPrice();

  if (forceBlockchainUnits) return <span className={className}>{formatEther(wei)}ETH</span>;
  if (loading) return <span className={className}>...</span>;
  if (!price) return <span className={className}>{formatEther(wei)}ETH</span>;
  return <span className={className}>{weiToUsd(wei, price, { precision })}</span>;
};
