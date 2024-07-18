import { useEffect, useState } from "react";
import { formatEther } from "viem";

import { EEmpire, POINTS_UNIT } from "@primodiumxyz/contracts";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Card } from "@/components/core/Card";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEthPrice } from "@/hooks/useEthPrice";
import { usePointPrice } from "@/hooks/usePointPrice";

export const SellPoints = () => {
  const [empire, selectEmpire] = useState<EEmpire>(EEmpire.Green);
  const {
    playerAccount: { entity },
  } = useAccountClient();
  const calls = useContractCalls();
  const { tables, utils } = useCore();
  const { price } = useEthPrice();
  const playerPoints = tables.Value_PointsMap.useWithKeys({ factionId: empire, playerId: entity })?.value ?? 0n;

  const [amountToSell, setAmountToSell] = useState("0");

  useEffect(() => {
    setAmountToSell("0");
  }, [empire]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.floor(Number(event.target.value));
    const max = Math.floor(Number(formatEther(playerPoints)));
    if (value >= 0 && value <= max) {
      setAmountToSell(value.toString());
    }
  };

  const handleSubmit = () => {
    calls.sellPoints(empire, BigInt(Number(amountToSell) * POINTS_UNIT));

    setAmountToSell("0");
  };

  const pointsToWei = usePointPrice(empire, Number(amountToSell));
  const ethOut = formatEther(pointsToWei);
  const usdOut = utils.weiToUsd(pointsToWei, price ?? 0);
  return (
    <div className="absolute bottom-4 left-4">
      <Card noDecor className="flex w-56 flex-col justify-center gap-1 rounded bg-secondary p-2 text-center text-white">
        <p className="text-left text-xs font-bold uppercase">Sell Points</p>
        <div className="flex flex-col justify-center gap-1 rounded border border-white/50 p-2 text-center text-white">
          <p className="text-left text-xs opacity-50">EMPIRE</p>
          <select
            value={empire}
            onChange={(e) => selectEmpire(Number(e.target.value) as EEmpire)}
            className="bg-neutral text-white"
          >
            <option value={EEmpire.Green}>Green</option>
            <option value={EEmpire.Red}>Red</option>
            <option value={EEmpire.Blue}>Blue</option>
          </select>
          <div className="flex flex-col justify-center gap-1 rounded border border-white/50 p-2 text-center text-white">
            <div>
              <p className="text-left text-[0.7rem] opacity-50">INPUT MUST BE WHOLE</p>
              <p className="absolute right-4 top-1/2 -translate-x-1/2 text-xs opacity-50">
                MAX {formatEther(playerPoints)}
              </p>
              <input
                type="number"
                value={amountToSell.toString()}
                onChange={handleInputChange}
                min="0"
                max={formatEther(playerPoints)}
                className="input input-bordered w-full max-w-xs"
              />
            </div>
            <div className="flex justify-center gap-2 rounded-md border border-accent text-xs font-bold uppercase">
              To get: {usdOut} <span>{ethOut}ETH</span>
            </div>
            <TransactionQueueMask id="sell-points">
              <button
                className="btn btn-secondary w-full"
                disabled={amountToSell == "0" || !pointsToWei}
                onClick={handleSubmit}
              >
                Sell
              </button>
            </TransactionQueueMask>
          </div>
        </div>
      </Card>
    </div>
  );
};
