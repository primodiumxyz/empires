import { useEffect, useState } from "react";
import { useCore } from "@core/react";
import { Address } from "viem";

export const useBalance = (address: Address, refreshMs: number = 2000) => {
  const {
    network: { publicClient },
  } = useCore();
  const [balance, setBalance] = useState<bigint | undefined>();

  useEffect(() => {
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
