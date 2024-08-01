import React, { useState } from "react";

import { EEmpire } from "@primodiumxyz/contracts";
import { EOverride } from "@primodiumxyz/contracts/config/enums";
import { formatNumber } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { Dropdown } from "@/components/core/Dropdown";
import { NumberInput } from "@/components/core/NumberInput";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEthPrice } from "@/hooks/useEthPrice";
import { useOverrideCost } from "@/hooks/useOverrideCost";

export const PlaceMagnetOverridePane: React.FC<{ planetId: Entity }> = ({ planetId }) => {
  const [inputValue, setInputValue] = useState("1");
  const [empire, setEmpire] = useState<EEmpire>(EEmpire.Red);
  const { price } = useEthPrice();
  const { utils, tables } = useCore();
  const { placeMagnet } = useContractCalls();

  const onPlaceMagnet = () => {
    placeMagnet(empire, planetId, BigInt(inputValue), 1n);
  };

  const placeMagnetPriceWei = useOverrideCost(EOverride.PlaceMagnet, empire, BigInt(inputValue));
  const pointLockPct = tables.P_MagnetConfig.useWithKeys()?.lockedPointsPercent ?? 0n;
  const empirePoints = tables.Empire.useWithKeys({ id: empire })?.pointsIssued ?? 0n;
  const pointsLocked = (empirePoints * pointLockPct) / 10000n;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <Dropdown value={empire} onChange={(value) => setEmpire(value)}>
        <Dropdown.Item value={EEmpire.Green}>Green</Dropdown.Item>
        <Dropdown.Item value={EEmpire.Red}>Red</Dropdown.Item>
        <Dropdown.Item value={EEmpire.Blue}>Blue</Dropdown.Item>
      </Dropdown>
      <NumberInput min={1} max={Infinity} count={inputValue} onChange={setInputValue} />
      <div className="flex gap-2">
        <div className="gap1 flex flex-col items-center">
          <TransactionQueueMask id={`${planetId}-place-magnet`} className="w-full">
            <Button onClick={onPlaceMagnet} size="xs" variant="error" className="w-full">
              PLACE MAGNET
            </Button>
          </TransactionQueueMask>
          <div className="flex flex-row items-center gap-2">
            <p className="rounded-box rounded-t-none bg-error/25 p-1 text-center text-xs opacity-75">
              {utils.weiToUsd(placeMagnetPriceWei, price ?? 0)}
            </p>
            <p className="rounded-box rounded-t-none bg-error/25 p-1 text-center text-xs opacity-75">
              Lock {formatNumber(pointsLocked)}pts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
