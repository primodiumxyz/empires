import { useCallback, useMemo, useState } from "react";
import { Address, formatEther } from "viem";

import { EEmpire, EOverride } from "@primodiumxyz/contracts/config/enums";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { Divider } from "@/components/core/Divider";
import { NumberInput } from "@/components/core/NumberInput";
import { PointsReceived } from "@/components/shared/PointsReceived";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useBalance } from "@/hooks/useBalance";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useOverridePointsReceived } from "@/hooks/useOverridePointsReceived";
import { usePlanetMagnets } from "@/hooks/usePlanetMagnets";

export const ExecuteButton = ({
  planetId,
  empire,
  address,
  entity,
}: {
  planetId: Entity;
  empire: EEmpire;
  address: Address;
  entity: Entity;
}) => {
  const [inputValue, setInputValue] = useState("1");
  const { tables } = useCore();
  const { placeMagnet } = useContractCalls();

  const placeMagnetPriceWei = useOverrideCost(EOverride.PlaceMagnet, empire, BigInt(inputValue));

  const onPlaceMagnet = useCallback(async () => {
    await placeMagnet(empire, planetId, BigInt(inputValue), placeMagnetPriceWei);
    setInputValue("1");
    tables.SelectedPlanet.remove();
  }, [empire, planetId, inputValue, placeMagnetPriceWei, placeMagnet]);

  const pointLockPct = tables.P_MagnetConfig.useWithKeys()?.lockedPointsPercent ?? 0n;
  const empirePoints = tables.Empire.useWithKeys({ id: empire })?.pointsIssued ?? 0n;
  const pointsLocked = (empirePoints * pointLockPct) / 10000n;
  const playerPoints = tables.Value_PointsMap.useWithKeys({ empireId: empire, playerId: entity })?.value ?? 0n;
  const playerBalance = useBalance(address).value ?? 0n;
  const placeMagnetPointsReceived = useOverridePointsReceived(EOverride.PlaceMagnet, empire, BigInt(inputValue));

  const magnets = usePlanetMagnets(planetId);
  const currentMagnetExists = !!magnets.find((magnet) => magnet.empire === empire)?.exists;

  const { disabled, message } = useMemo(() => {
    if (playerBalance < placeMagnetPriceWei) return { disabled: true, message: "Not enough money" };
    if (playerPoints < pointsLocked) return { disabled: true, message: `${formatEther(pointsLocked)} points needed` };
    if (currentMagnetExists) return { disabled: true, message: "Magnet already exists" };
    return { disabled: false, message: "" };
  }, [placeMagnetPriceWei, pointsLocked, currentMagnetExists, playerBalance, playerPoints]);

  return (
    <div className="flex">
      <div className="flex flex-col items-center justify-center">
        {message && (
          <p className="px-2 py-1 text-xs text-error">
            {message} <span className="text-success">({formatEther(playerPoints)} AVAIL.)</span>
          </p>
        )}
        {!message && (
          <p className="px-2 py-1 text-xs opacity-50">
            {formatEther(pointsLocked)} POINTS WILL BE LOCKED{" "}
            <span className="text-success">({formatEther(playerPoints - pointsLocked)} AVAIL.)</span>
          </p>
        )}
        <TransactionQueueMask id={`${planetId}-place-magnet`} className="">
          <Button onClick={onPlaceMagnet} size="xs" variant="secondary" className="" disabled={disabled}>
            PLACE MAGNET
          </Button>
        </TransactionQueueMask>
        <p className="rounded-box rounded-t-none bg-error/25 p-1 text-center text-xs opacity-75">
          <Price wei={placeMagnetPriceWei} />
        </p>

        {!disabled && <PointsReceived points={placeMagnetPointsReceived} inline />}
      </div>
      <Divider direction="vertical" className="self-center" />
      <div className="flex flex-col items-center justify-start">
        <NumberInput min={1} max={Infinity} count={inputValue} onChange={setInputValue} />
      </div>
    </div>
  );
};
