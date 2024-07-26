import { useEffect, useState } from "react";
import { formatEther } from "viem";

import { EEmpire, POINTS_UNIT } from "@primodiumxyz/contracts";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Button } from "@/components/core/Button";
import { Card, SecondaryCard } from "@/components/core/Card";
import { NumberInput } from "@/components/core/NumberInput";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEthPrice } from "@/hooks/useEthPrice";
import { usePointPrice } from "@/hooks/usePointPrice";

export const SellPoints = () => {
  const {
    playerAccount: { entity },
  } = useAccountClient();
  const calls = useContractCalls();
  const { tables, utils } = useCore();
  const { price } = useEthPrice();

  const [amountToSell, setAmountToSell] = useState("0");
  const [empire, setEmpire] = useState<EEmpire>(EEmpire.Green);
  const playerPoints = tables.Value_PointsMap.useWithKeys({ empireId: empire, playerId: entity })?.value ?? 0n;

  useEffect(() => {
    setAmountToSell("0");
  }, [empire]);

  const handleInputChange = (_value: string) => {
    const value = Math.floor(Number(_value));
    const max = Math.floor(Number(formatEther(playerPoints)));
    if (value >= 0 && value <= max) {
      setAmountToSell(value.toString());
    }
  };

  const handleSubmit = () => {
    calls.sellPoints(empire, BigInt(Number(amountToSell) * POINTS_UNIT));

    setAmountToSell("0");
  };

  const { price: pointsToWei, message } = usePointPrice(empire, Number(amountToSell));
  const ethOut = formatEther(pointsToWei);
  const usdOut = utils.weiToUsd(pointsToWei, price ?? 0);
  return (
    <div className="absolute bottom-36 left-2">
      <Card noDecor className="w-56 gap-2">
        <div className="flex flex-col gap-2">
          <p className="text-left text-xs font-bold uppercase">Sell Points</p>
          <SecondaryCard>
            <p className="text-left text-xs opacity-50">EMPIRE</p>
            <select
              value={empire}
              onChange={(e) => setEmpire(e.target.value as unknown as EEmpire)}
              className="w-full bg-base-100 text-white/90"
            >
              <option value={EEmpire.Green}>Green</option>
              <option value={EEmpire.Red}>Red</option>
              <option value={EEmpire.Blue}>Blue</option>
            </select>
          </SecondaryCard>
          <SecondaryCard className="flex flex-col gap-2">
            <NumberInput
              count={amountToSell}
              onChange={handleInputChange}
              min={0}
              max={Number(formatEther(playerPoints))}
            />
            <div className="flex justify-center gap-2 rounded-md bg-primary/50 px-2 py-1 text-xs font-bold uppercase">
              {message ? (
                <span className="text-[0.6rem] text-white">{message}</span>
              ) : (
                <>
                  <span className="text-white">{usdOut}</span>
                  <span>{ethOut}ETH</span>
                </>
              )}
            </div>
            <TransactionQueueMask id="sell-points">
              <Button
                size="md"
                className="w-full"
                disabled={amountToSell == "0" || !pointsToWei}
                onClick={handleSubmit}
              >
                Sell
              </Button>
            </TransactionQueueMask>
          </SecondaryCard>
        </div>
      </Card>
    </div>
  );
};
