import { useState } from "react";
import { formatEther } from "viem";

import { EEmpire, POINTS_UNIT } from "@primodiumxyz/contracts";
import { useCore, usePlayerAccount } from "@primodiumxyz/core/react";
import { defaultEntity } from "@primodiumxyz/reactive-tables";
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
import { DEFAULT_EMPIRE } from "@/util/lookups";

export const SellPoints = () => {
  const { tables } = useCore();
  const [selectedEmpire, setSelectedEmpire] = useState<EEmpire>(DEFAULT_EMPIRE);
  const [amount, setAmount] = useState("0");
  const empires = useEmpires();
  const { playerAccount, login } = usePlayerAccount();
  const calls = useContractCalls();
  const {
    MAIN: { sprite },
  } = useGame();
  const playerPoints =
    tables.Value_PointsMap.useWithKeys({
      empireId: selectedEmpire,
      playerId: playerAccount?.entity ?? defaultEntity,
    })?.value ?? 0n;

  const handleInputChange = (_value: string) => {
    const value = Math.floor(Number(_value));
    const max = Math.floor(Number(formatEther(playerPoints)));
    if (value >= 0 && value <= max) {
      setAmount(value.toString());
    }
  };

  const { price: pointsToWei, message } = usePointPrice(selectedEmpire, Number(amount));
  const handleSubmit = () => {
    calls.sellPoints(selectedEmpire, BigInt(Number(amount) * POINTS_UNIT));

    setAmount("0");
  };

  return (
    <SecondaryCard>
      <div className="h-64 p-2">
        <p className="mb-4 mt-2 text-center text-xs text-gray-400">Sell points for a profit</p>

        <SecondaryCard className="flex-row items-center justify-center gap-4 bg-black/10 py-4">
          <Dropdown
            value={selectedEmpire}
            onChange={(value) => setSelectedEmpire(value)}
            variant="bottomRight"
            justify="start"
            className="w-32 gap-1"
          >
            {Array.from(empires.entries()).map(([key, empire]) => (
              <Dropdown.Item key={key} value={key}>
                <IconLabel imageUri={sprite.getSprite(empire.sprites.planet)} text={empire.name} className="text-xs" />
              </Dropdown.Item>
            ))}
          </Dropdown>
          <NumberInput
            count={amount}
            onChange={handleInputChange}
            min={0}
            max={Number(formatEther(playerPoints))}
            className="w-40 translate-y-3 place-self-center"
          />
        </SecondaryCard>
        <br></br>

        <div className="mt-2 flex flex-col items-center">
          {!!playerAccount && (
            <TransactionQueueMask id="sell-points">
              <Button size="md" className="text-base" disabled={amount == "0" || !pointsToWei} onClick={handleSubmit}>
                Sell
              </Button>
            </TransactionQueueMask>
          )}
          {!playerAccount && (
            <Button size="md" className="text-base" onClick={() => login()}>
              Login to Sell
            </Button>
          )}
          <Badge size="sm" variant="primary" className="rounded-t-none p-3">
            {message ? (
              <span className="-none text-center text-[0.6rem] text-white">{message}</span>
            ) : (
              <Price wei={pointsToWei} className="text-sm text-white" />
            )}
          </Badge>
        </div>
      </div>
    </SecondaryCard>
  );
};
