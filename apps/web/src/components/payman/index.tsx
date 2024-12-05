import { getContract } from 'viem'
import { abi } from '../../../../payman/out/PayoutManager.sol/PayoutManager.json'

import { createPublicClient, createWalletClient, http, custom } from 'viem'
import { anvil } from 'viem/chains'

import { Address } from "viem";
import { formatEther } from 'viem'
import { useState, useEffect } from 'react';

// import { Button } from "@/components/core/Button";

// I should be able to inherit the PlayerAccountContext with useContext
// and make calls from there, instead of this hack

const publicClient = createPublicClient({
    chain: anvil,
    transport: http(),
})

const walletClient = createWalletClient({
    chain: anvil,
    transport: custom(window.ethereum!),
})

const paymanContract = getContract({
    address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    abi: abi,
    client: { public: publicClient, wallet: walletClient }
})

const testAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as Address;

const [ownerAddress, playerWinnings] = await Promise.all([paymanContract.read.getOwner(), paymanContract.read.balances([testAddress])]);

const playerBalance = await publicClient.getBalance({
    address: testAddress,
})

const submitWithdrawal = async () => {
    console.log('withdrawal submitted');
    await paymanContract.write.withdraw();

}



// need to register a transaction listener to update the UI when the transaction is confirmed

const PayoutManager = () => {

    console.log(ownerAddress, playerWinnings);
    const playerBalanceFloat = parseFloat(formatEther(playerBalance)).toFixed(2);
    const playerWinningsFloat = parseFloat(formatEther(BigInt(playerWinnings as string))).toFixed(2);

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl">Payout Manager</h1>
            <br />
            {/* <h2 className="text-2xl">Owner: {ownerAddress as Address}</h2> */}
            <h2 className="text-2xl">Player Address: {testAddress as string}</h2>
            <h2 className="text-2xl">Player Balance Winnings: {playerBalanceFloat} ETH</h2>
            <h2 className="text-2xl">Claimable Winnings: {playerWinningsFloat} ETH</h2>
            <br />
            <button onClick={submitWithdrawal}>Withdraw</button>
            {/* <Button onClick={() => paymanContract.write.withdraw()}>Withdraw</Button> */}
        </div >
    );
}

export default PayoutManager;   