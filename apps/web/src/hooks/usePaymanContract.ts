import { Address, getContract } from "viem";
import { useCore, usePlayerAccount } from "@primodiumxyz/core/react";

import { abi } from './abis/PayoutManager.json'

export const usePaymanContract = () => {

    const {
        network: { publicClient },
        tables,
    } = useCore();

    const walletClient = usePlayerAccount().playerAccount?.walletClient;

    const paymanAddress = tables.PayoutManager.get()?.contractAddress as Address;
    const paymanContract = getContract({
        address: paymanAddress,
        abi: abi,
        client: { public: publicClient, wallet: walletClient }
    })

    return paymanContract;
}

