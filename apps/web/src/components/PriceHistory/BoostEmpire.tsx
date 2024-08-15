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
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useOverridePointsReceived } from "@/hooks/useOverridePointsReceived";
import { DEFAULT_EMPIRE } from "@/util/lookups";

export const BoostEmpire = () => {
  const {
    playerAccount: { address, publicClient },
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
  const [playerBalance, setPlayerBalance] = useState<bigint>(0n);
  const boostPriceWei = useOverrideCost(EOverride.AirdropGold, empire, BigInt(amountToBoost));
  const boostPointsReceived = useOverridePointsReceived(EOverride.AirdropGold, empire, BigInt(amountToBoost));

  useEffect(() => {
    setAmountToBoost("0");
  }, [empire]);

  useEffect(() => {
    const unsubscribe = tables.Time.watch({
      onChange: () => {
        publicClient.getBalance({ address }).then(setPlayerBalance);
      },
    });

    return () => unsubscribe();
  }, [address, publicClient, time]);

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
        <Dropdown value={empire} onChange={(value) => setEmpire(value)} className="w-32 lg:w-44">
          {Array.from(empires.entries()).map(([key, empire]) => (
            <Dropdown.Item key={key} value={key}>
              <IconLabel imageUri={sprite.getSprite(empire.sprites.planet)} text={empire.name} />
            </Dropdown.Item>
          ))}
        </Dropdown>
      </SecondaryCard>
      <SecondaryCard className="w-full flex-row items-center justify-around gap-2">
        <NumberInput count={amountToBoost} onChange={handleInputChange} min={0} className="w-40 place-self-center" />

        <div className="flex gap-2">
          <Badge size="sm" variant="error" className="p-4 lg:badge-lg">
            <Price wei={boostPriceWei} className=":!text-lg text-sm text-white" />
          </Badge>
          <Badge size="sm" variant="success" className="p-4 lg:badge-lg">
            <PointsReceived points={boostPointsReceived} noCaption className="text-sm text-white opacity-100" />
          </Badge>
        </div>

        <TransactionQueueMask id="sell-points">
          <Button
            size="sm"
            className="w-full lg:btn-md lg:text-lg"
            disabled={amountToBoost == "0" || boostPriceWei > playerBalance}
            onClick={handleSubmit}
          >
            Buy
          </Button>
        </TransactionQueueMask>
      </SecondaryCard>
    </div>
  );
};
