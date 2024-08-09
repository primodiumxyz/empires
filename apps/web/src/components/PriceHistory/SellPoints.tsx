import { useEffect, useState } from "react";
import { formatEther } from "viem";

import { Sprites } from "@primodiumxyz/assets";
import { EEmpire, POINTS_UNIT } from "@primodiumxyz/contracts";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Button } from "@/components/core/Button";
import { Card, SecondaryCard } from "@/components/core/Card";
import { Dropdown } from "@/components/core/Dropdown";
import { IconLabel } from "@/components/core/IconLabel";
import { NumberInput } from "@/components/core/NumberInput";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useGame } from "@/hooks/useGame";
import { usePointPrice } from "@/hooks/usePointPrice";

export const SellPoints = () => {
  const {
    playerAccount: { entity },
  } = useAccountClient();
  const calls = useContractCalls();
  const { tables } = useCore();
  const {
    MAIN: { sprite },
  } = useGame();
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

  return (
    <Card noDecor className="w-full gap-2">
      <div className="flex gap-2">
        <SecondaryCard>
          <p className="text-left text-xs opacity-50">EMPIRE</p>
          <Dropdown value={empire} onChange={(value) => setEmpire(value)} className="w-full">
            <Dropdown.Item value={EEmpire.Red}>
              <IconLabel imageUri={sprite.getSprite("PlanetRed")} text="Red" />
            </Dropdown.Item>
            <Dropdown.Item value={EEmpire.Green}>
              <IconLabel imageUri={sprite.getSprite("PlanetGreen")} text="Green" />
            </Dropdown.Item>
            <Dropdown.Item value={EEmpire.Blue}>
              <IconLabel imageUri={sprite.getSprite("PlanetBlue")} text="Blue" />
            </Dropdown.Item>
          </Dropdown>
        </SecondaryCard>
        <SecondaryCard className="grid grow grid-cols-3 items-center gap-5">
          <div className="flex justify-center gap-2 rounded-md bg-primary/50 px-2 py-1 text-lg font-bold uppercase">
            {message ? (
              <span className="text-[0.6rem] text-white">{message}</span>
            ) : (
              <Price wei={pointsToWei} className="text-white" />
            )}
          </div>
          <NumberInput
            count={amountToSell}
            onChange={handleInputChange}
            min={0}
            max={Number(formatEther(playerPoints))}
            className="place-self-center"
          />

          <TransactionQueueMask id="sell-points">
            <Button
              size="md"
              className="w-full px-10"
              disabled={amountToSell == "0" || !pointsToWei}
              onClick={handleSubmit}
            >
              Sell
            </Button>
          </TransactionQueueMask>
        </SecondaryCard>
      </div>
    </Card>
  );
};
