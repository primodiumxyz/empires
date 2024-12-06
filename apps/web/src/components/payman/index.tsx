import { getContract } from 'viem'
import { abi } from '../../../../payman/out/PayoutManager.sol/PayoutManager.json'

import { createPublicClient, createWalletClient, http, custom } from 'viem'
import { anvil, baseSepolia } from 'viem/chains'

import { Address } from "viem";
import { formatEther } from 'viem'

import { usePayoutWinnings } from "@/hooks/usePayoutWinnings";
import { useCore, usePlayerAccount } from "@primodiumxyz/core/react";

const PayoutManager = () => {

    const publicClient = createPublicClient({
        chain: anvil,
        transport: http()
    })

    const walletClient = createWalletClient({
        chain: anvil,
        transport: custom(window.ethereum!)
    })

    const {
        tables,
    } = useCore();

    const paymanAddress = tables.PayoutManager.get()?.contractAddress as Address;

    const paymanContract = getContract({
        address: paymanAddress,
        abi: abi,
        client: { public: publicClient, wallet: walletClient }
    })

    const playerAddress = usePlayerAccount().playerAccount?.address;
    console.log(playerAddress);

    const playerWinnings = usePayoutWinnings(playerAddress).value ?? 0n;
    const playerWinningsFloat = parseFloat(formatEther(playerWinnings)).toFixed(2);

    const submitWithdrawal = async () => {
        console.log('withdrawal submitted');
        await paymanContract.write.withdraw();

    }

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl">Payout Manager</h1>
            <br />
            <h2 className="text-2xl">Player Address: {playerAddress}</h2>
            <h2 className="text-2xl">Claimable Winnings: {playerWinningsFloat} ETH</h2>
            <br />
            <button onClick={submitWithdrawal}>Withdraw</button>
        </div >
    );

}

export default PayoutManager;   