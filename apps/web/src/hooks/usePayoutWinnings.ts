import { useEffect, useState } from "react";
import { Address, getContract } from "viem";

import { abi } from './abis/PayoutManager.json'

import { useCore } from "@primodiumxyz/core/react";

export const usePayoutWinnings = (address?: Address, refreshMs: number = 2000) => {
    const {
        network: { publicClient },
        tables,
    } = useCore();

    const [winnings, setWinnings] = useState<bigint | undefined>();

    const paymanAddress = tables.PayoutManager.get()?.contractAddress;
    const paymanContract = getContract({
        address: paymanAddress as Address,
        abi: abi,
        client: { public: publicClient }
    })

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
    }, [address, publicClient, refreshMs]);

    return { value: winnings, loading: winnings === undefined };
};
