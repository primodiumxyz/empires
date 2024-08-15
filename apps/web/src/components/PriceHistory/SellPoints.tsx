import { useEffect, useState } from "react";
import { formatEther } from "viem";

import { EEmpire, POINTS_UNIT } from "@primodiumxyz/contracts";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Badge } from "@/components/core/Badge";
import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { Dropdown } from "@/components/core/Dropdown";
import { IconLabel } from "@/components/core/IconLabel";
import { NumberInput } from "@/components/core/NumberInput";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { usePointPrice } from "@/hooks/usePointPrice";
import { cn } from "@/util/client";
import { DEFAULT_EMPIRE } from "@/util/lookups";

export const SellPoints = ({ selectedEmpire, fragment }: { selectedEmpire?: EEmpire; fragment?: boolean }) => {
  const {
    playerAccount: { entity },
  } = useAccountClient();
  const calls = useContractCalls();
  const { tables } = useCore();
  const {
    MAIN: { sprite },
  } = useGame();
  const [amountToSell, setAmountToSell] = useState("0");
  const [empire, setEmpire] = useState<EEmpire>(selectedEmpire ?? DEFAULT_EMPIRE);
  const playerPoints =
    tables.Value_PointsMap.useWithKeys({ empireId: selectedEmpire ?? empire, playerId: entity })?.value ?? 0n;

  useEffect(() => {
    setAmountToSell("0");
  }, [empire, selectedEmpire]);

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

  const { price: pointsToWei, message } = usePointPrice(selectedEmpire ?? empire, Number(amountToSell));
  const empires = useEmpires();

  return (
    <div className="flex w-full gap-2">
      {!selectedEmpire && (
        <SecondaryCard className="justify-center bg-black/10">
          <Dropdown value={empire} onChange={(value) => setEmpire(value)} className="w-32 lg:w-44">
            {Array.from(empires.entries()).map(([key, empire]) => (
              <Dropdown.Item key={key} value={key}>
                <IconLabel imageUri={sprite.getSprite(empire.sprites.planet)} text={empire.name} />
              </Dropdown.Item>
            ))}
          </Dropdown>
        </SecondaryCard>
      )}
      <SecondaryCard className={cn("w-full flex-row items-center justify-around gap-2", fragment && "bg-none")}>
        <NumberInput
          count={amountToSell}
          onChange={handleInputChange}
          min={0}
          max={Number(formatEther(playerPoints))}
          className="mt-4 w-32 place-self-center"
        />

        <Badge size="sm" variant="primary" className="p-4 lg:badge-lg">
          {message ? (
            <span className="text-center text-[0.6rem] text-white">{message}</span>
          ) : (
            <Price wei={pointsToWei} className="text-sm text-white lg:!text-lg" />
          )}
        </Badge>

        <TransactionQueueMask id="sell-points">
          <Button
            size="sm"
            className="w-full lg:btn-md lg:text-lg"
            disabled={amountToSell == "0" || !pointsToWei}
            onClick={handleSubmit}
          >
            Sell
          </Button>
        </TransactionQueueMask>
      </SecondaryCard>
    </div>
  );
};
