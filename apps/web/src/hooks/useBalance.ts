import { useEffect, useState } from "react";
import { Address } from "viem";

import { useCore } from "@primodiumxyz/core/react";

export const useBalance = (address?: Address, refreshMs: number = 2000) => {
  const {
    network: { publicClient },
  } = useCore();
  const [balance, setBalance] = useState<bigint | undefined>();

  useEffect(() => {
    if (!address) return;

    const fetchBalance = async () => {
      const bal = await publicClient.getBalance({ address });
      setBalance(bal);
    };

    fetchBalance();
    const interval = setInterval(async () => {
      fetchBalance();
    }, refreshMs);

    return () => clearInterval(interval);
  }, [address, publicClient, refreshMs]);

  return { value: balance, loading: balance === undefined };
};
