import { useEffect, useState } from "react";
import { Address } from "viem";

import { usePaymanContract } from "@/hooks/usePaymanContract";

export const usePayoutWinnings = (address?: Address, refreshMs: number = 2000) => {

    const [winnings, setWinnings] = useState<bigint | undefined>();
    const paymanContract = usePaymanContract()

    useEffect(() => {
        if (!address) return;

        const fetchWinnings = async () => {
            const bal = await paymanContract.read.balances([address])
            setWinnings(BigInt(bal as string));
        };

        fetchWinnings();
        const interval = setInterval(async () => {
            fetchWinnings();
        }, refreshMs);

        return () => clearInterval(interval);
    }, [address, refreshMs]);

    return { value: winnings, loading: winnings === undefined };
};
