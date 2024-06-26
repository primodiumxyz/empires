import { useCore } from "@primodiumxyz/core/react";
import { useEffect, useState } from "react";
import { Address } from "viem";

export const useBalance = (address: Address, refreshMs: number = 2000) => {
  const {
    network: { publicClient },
  } = useCore();
  const [balance, setBalance] = useState<bigint | undefined>();

  useEffect(() => {
    const interval = setInterval(async () => {
      const bal = await publicClient.getBalance({ address });
      setBalance(bal);
    }, refreshMs);

    return () => clearInterval(interval);
  }, [address, publicClient, refreshMs]);

  return { value: balance, loading: balance === undefined };
};
