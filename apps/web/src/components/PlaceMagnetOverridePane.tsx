import React, { useCallback, useMemo, useState } from "react";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { EOverride } from "@primodiumxyz/contracts/config/enums";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { Dropdown } from "@/components/core/Dropdown";
import { NumberInput } from "@/components/core/NumberInput";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useBalance } from "@/hooks/useBalance";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useOverrideCost } from "@/hooks/useOverrideCost";

export const PlaceMagnetOverridePane: React.FC<{ planetId: Entity }> = ({ planetId }) => {
  const [inputValue, setInputValue] = useState("1");
  const [empire, setEmpire] = useState<EEmpire>(EEmpire.Red);
  const { tables } = useCore();
  const { placeMagnet } = useContractCalls();

  const placeMagnetPriceWei = useOverrideCost(EOverride.PlaceMagnet, empire, BigInt(inputValue));

  const onPlaceMagnet = useCallback(() => {
    placeMagnet(empire, planetId, BigInt(inputValue), placeMagnetPriceWei);
  }, [empire, planetId, inputValue, placeMagnetPriceWei, placeMagnet]);

  const pointLockPct = tables.P_MagnetConfig.useWithKeys()?.lockedPointsPercent ?? 0n;
  const empirePoints = tables.Empire.useWithKeys({ id: empire })?.pointsIssued ?? 0n;
  const pointsLocked = (empirePoints * pointLockPct) / 10000n;
  const {
    playerAccount: { address, entity },
  } = useAccountClient();
  const playerPoints = tables.Value_PointsMap.useWithKeys({ empireId: empire, playerId: entity })?.value ?? 0n;
  const playerBalance = useBalance(address).value ?? 0n;

  const magnetExists = tables.Magnet.useWithKeys({ planetId, empireId: empire }) !== undefined;
  const { disabled, message } = useMemo(() => {
    if (playerBalance < placeMagnetPriceWei) return { disabled: true, message: "Not enough money" };
    if (playerPoints < pointsLocked) return { disabled: true, message: "Not enough points" };
    if (magnetExists) return { disabled: true, message: "Magnet already exists" };
    return { disabled: false, message: "" };
  }, [placeMagnetPriceWei, pointsLocked, magnetExists, playerBalance, playerPoints]);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <Dropdown value={empire} onChange={(value) => setEmpire(value)}>
        <Dropdown.Item value={EEmpire.Green}>Green</Dropdown.Item>
        <Dropdown.Item value={EEmpire.Red}>Red</Dropdown.Item>
        <Dropdown.Item value={EEmpire.Blue}>Blue</Dropdown.Item>
      </Dropdown>
      <div className="flex flex-col items-center">
        <p className="text-xs">Turns</p>
        <NumberInput min={1} max={Infinity} count={inputValue} onChange={setInputValue} />
      </div>
      <div className="flex gap-2">
        <div className="gap1 flex flex-col items-center">
          {message && <p className="px-2 text-xs text-error">{message}</p>}
          {!message && (
            <TransactionQueueMask id={`${planetId}-place-magnet`} className="w-full">
              <Button onClick={onPlaceMagnet} size="xs" variant="accent" className="w-full" disabled={disabled}>
                PLACE MAGNET
              </Button>
            </TransactionQueueMask>
          )}
          <div className="flex flex-row items-center gap-2">
            <p className="rounded-box rounded-t-none bg-error/25 p-1 text-center text-xs opacity-75">
              <Price wei={placeMagnetPriceWei} />
            </p>
            <p className="rounded-box rounded-t-none bg-error/25 p-1 text-center text-xs opacity-75">
              Lock {formatEther(pointsLocked)}pts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
