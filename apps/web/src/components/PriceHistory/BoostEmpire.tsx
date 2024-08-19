import { useEffect, useState } from "react";

import { EEmpire, EOverride } from "@primodiumxyz/contracts";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Badge } from "@/components/core/Badge";
import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { Dropdown } from "@/components/core/Dropdown";
import { IconLabel } from "@/components/core/IconLabel";
import { NumberInput } from "@/components/core/NumberInput";
import { PointsReceived } from "@/components/shared/PointsReceived";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useBalance } from "@/hooks/useBalance";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useOverridePointsReceived } from "@/hooks/useOverridePointsReceived";
import { DEFAULT_EMPIRE } from "@/util/lookups";

export const BoostEmpire = () => {
  const {
    playerAccount: { entity, address },
  } = useAccountClient();
  const calls = useContractCalls();
  const { tables } = useCore();
  const {
    MAIN: { sprite },
  } = useGame();
  const empires = useEmpires();
  const time = tables.Time.use();

  const [amountToBoost, setAmountToBoost] = useState("0");
  const [empire, setEmpire] = useState<EEmpire>(DEFAULT_EMPIRE);
  const boostPriceWei = useOverrideCost(EOverride.AirdropGold, empire, BigInt(amountToBoost));
  const boostPointsReceived = useOverridePointsReceived(EOverride.AirdropGold, empire, BigInt(amountToBoost));
  const playerBalance = useBalance(address);

  useEffect(() => {
    setAmountToBoost("0");
  }, [empire]);

  const handleInputChange = (_value: string) => {
    const value = Math.floor(Number(_value));
    if (value >= 0) {
      setAmountToBoost(value.toString());
    }
  };

  const handleSubmit = () => {
    calls.airdropGold(empire, BigInt(amountToBoost), boostPriceWei, boostPointsReceived.value);
    setAmountToBoost("0");
  };

  return (
    <div className="flex w-full gap-2">
      <SecondaryCard className="justify-center bg-black/10">
        <Dropdown value={empire} onChange={(value) => setEmpire(value)} className="w-32 lg:w-44" justify="start">
          {Array.from(empires.entries()).map(([key, empire]) => (
            <Dropdown.Item key={key} value={key}>
              <IconLabel imageUri={sprite.getSprite(empire.sprites.planet)} text={empire.name} />
            </Dropdown.Item>
          ))}
        </Dropdown>
      </SecondaryCard>
      <SecondaryCard className="w-full flex-row items-center justify-around gap-2">
        <NumberInput count={amountToBoost} onChange={handleInputChange} min={0} className="place-self-center" />

        <div className="grid grid-rows-2 place-items-center gap-2 xl:!grid-cols-2 xl:!grid-rows-1">
          <Badge size="sm" variant="error" className="w-full xl:badge-lg xl:w-auto xl:p-4">
            <Price wei={boostPriceWei} className=":!text-lg text-sm text-white" />
          </Badge>
          <Badge size="sm" variant="success" className="w-full flex-1 xl:badge-lg xl:w-fit xl:p-4">
            <PointsReceived points={boostPointsReceived} noCaption className="text-sm text-white opacity-100" />
          </Badge>
        </div>

        <TransactionQueueMask id="sell-points">
          <Button
            size="sm"
            className="w-full md:btn-md"
            disabled={amountToBoost == "0" || boostPriceWei > (playerBalance.value ?? 0n)}
            onClick={handleSubmit}
          >
            Buy
          </Button>
        </TransactionQueueMask>
      </SecondaryCard>
    </div>
  );
};
