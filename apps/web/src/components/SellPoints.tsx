import { useState } from "react";
import { formatEther } from "viem";

import { EEmpire, POINTS_UNIT } from "@primodiumxyz/contracts";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEthPrice } from "@/hooks/useEthPrice";

export const SellPoints = () => {
  const [empire, selectEmpire] = useState<EEmpire>(EEmpire.Green);
  return (
    <div className="absolute bottom-4 left-4 flex w-64 flex-col justify-center gap-1 rounded bg-secondary p-2 text-center text-white">
      <p className="text-left text-xs font-bold uppercase">Sell Points</p>
      <div className="flex flex-col justify-center gap-1 rounded border border-white/50 p-2 text-center text-white">
        <p className="text-left text-xs opacity-50">EMPIRE</p>
        <select
          value={empire}
          onChange={(e) => selectEmpire(Number(e.target.value) as EEmpire)}
          className="bg-dark text-black"
        >
          <option value={EEmpire.Green}>Green</option>
          <option value={EEmpire.Red}>Red</option>
          <option value={EEmpire.Blue}>Blue</option>
        </select>
        <SellEmpirePoints empire={empire} />
      </div>
    </div>
  );
};

const SellEmpirePoints = ({ empire }: { empire: EEmpire }) => {
  const {
    playerAccount: { entity },
  } = useAccountClient();
  const calls = useContractCalls();
  const { tables, utils } = useCore();
  const { price } = useEthPrice();
  const playerPoints = tables.Value_PointsMap.useWithKeys({ factionId: empire, playerId: entity })?.value ?? 0n;

  const [amountToSell, setAmountToSell] = useState("0");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    const max = Number(formatEther(playerPoints));
    console.log({ value, max, playerPoints });
    if (value >= 0n && value <= max) {
      setAmountToSell(value.toString());
    }
  };

  const pointsToWei = 1n;
  const ethOut = formatEther(BigInt(Number(amountToSell) * POINTS_UNIT) / pointsToWei);
  const usdOut = utils.weiToUsd(BigInt(Number(amountToSell) * POINTS_UNIT) / pointsToWei, price ?? 0);

  return (
    <div className="flex flex-col justify-center gap-1 rounded border border-white/50 p-2 text-center text-white">
      <p className="text-left text-xs opacity-50">MAX {formatEther(playerPoints)}</p>
      <input
        type="number"
        value={amountToSell.toString()}
        onChange={handleInputChange}
        min="0"
        max={formatEther(playerPoints)}
        className="input input-bordered w-full max-w-xs"
      />
      <div className="flex justify-center gap-2 rounded-md border border-accent text-xs font-bold uppercase">
        To get: {usdOut} <span>{ethOut}ETH</span>
      </div>
      <TransactionQueueMask id="sell-points">
        <button
          className="btn btn-primary w-full"
          disabled={amountToSell == "0"}
          onClick={() => calls.sellPoints(empire, BigInt(Number(amountToSell) * POINTS_UNIT))}
        >
          Sell
        </button>
      </TransactionQueueMask>
    </div>
  );
};
