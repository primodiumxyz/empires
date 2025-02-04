import { useEffect, useState } from "react";
import { Address, formatEther } from "viem";

import { useCore, usePlayerAccount } from "@primodiumxyz/core/react";
import { abi } from "@/hooks/abis/PayoutManager.json";

const PayoutManager = () => {
  const refreshMs: number = 2000;

  const {
    // network: { publicClient },
    tables,
  } = useCore();

  const [winnings, setWinnings] = useState<bigint | undefined>();
  const [mutex, setMutex] = useState<boolean>(false);

  const playerAddress = usePlayerAccount().playerAccount?.address;
  const publicClient = usePlayerAccount().playerAccount?.publicClient ?? null;
  const walletClient = usePlayerAccount().playerAccount?.walletClient ?? null;

  console.log(walletClient?.chain.rpcUrls);

  //const paymanAddress = tables.PayoutManager.get()?.contractAddress as Address;
  const paymanAddress = "0xEFCB144B5b1E7BA06e70f902C56B052C71B402CB" as Address;
  console.log(paymanAddress);

  const playerWinnings = winnings ?? 0n;
  const playerWinningsFloat = parseFloat(formatEther(playerWinnings)).toFixed(2);

  const fetchWinnings = async () => {
    if (!publicClient) {
      console.log("no publicClient");
      return;
    }
    const bal = await publicClient.readContract({
      account: playerAddress,
      address: paymanAddress,
      abi: abi,
      functionName: "balances",
      args: [playerAddress],
    });

    setWinnings(BigInt(bal as string));
  };

  const submitWithdrawal = async () => {
    if (!playerAddress) {
      console.log("no playerAddress");
      return;
    }
    if (!paymanAddress) {
      console.log("no paymanAddress");
      return;
    }
    if (!publicClient) {
      console.log("no publicClient");
      return;
    }
    if (!walletClient) {
      console.log("no walletClient");
      return;
    }

    console.log("building withdrawal simulated");
    const { request } = await publicClient.simulateContract({
      account: playerAddress,
      address: paymanAddress,
      abi: abi,
      functionName: "withdraw",
    });
    console.log("withdrawal simulated");

    const hash = await walletClient.writeContract(request);
    console.log("withdrawal submitted");
  };

  useEffect(() => {
    if (!playerAddress) {
      console.log("no playerAddress");
      return;
    }
    if (!paymanAddress) {
      console.log("no paymanAddress");
      return;
    }

    const interval = setInterval(async () => {
      if (!mutex) {
        setMutex(true);
        await fetchWinnings();
        setMutex(false);
      }
    }, refreshMs);

    return () => clearInterval(interval);
  }, [playerAddress, paymanAddress, refreshMs]);

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="text-4xl">Payout Manager</h1>
      <h2 className="text-xl">
        <a href={`https://basescan.org/address/${paymanAddress}`}>{paymanAddress}</a>
      </h2>
      <br />
      <h2 className="text-2xl">Player Address: {playerAddress}</h2>
      <h2 className="text-2xl">Claimable Winnings: {playerWinningsFloat} ETH</h2>
      <br />
      <button onClick={submitWithdrawal}>Withdraw</button>
    </div>
  );
};

export default PayoutManager;
