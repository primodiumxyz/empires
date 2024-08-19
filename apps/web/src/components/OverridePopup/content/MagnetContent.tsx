import React, { useCallback, useMemo, useState } from "react";
import { formatEther } from "viem";

import { EEmpire, EOverride } from "@primodiumxyz/contracts/config/enums";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { Divider } from "@/components/core/Divider";
import { IconLabel } from "@/components/core/IconLabel";
import { NumberInput } from "@/components/core/NumberInput";
import { PointsReceived } from "@/components/shared/PointsReceived";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useAdjacentEmpirePlanets } from "@/hooks/useAdjacentEmpirePlanets";
import { useBalance } from "@/hooks/useBalance";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useOverridePointsReceived } from "@/hooks/useOverridePointsReceived";
import { usePlanetMagnets } from "@/hooks/usePlanetMagnets";
import { EmpireEnumToConfig } from "@/util/lookups";

/*
1. disable magnets if no adjacent planets of current empire
*/
export const MagnetContent: React.FC<{ entity: Entity }> = ({ entity: planetId }) => {
  const [inputValue, setInputValue] = useState("1");
  const [empire, setEmpire] = useState<EEmpire>(EEmpire.LENGTH);
  const { tables } = useCore();
  const { placeMagnet } = useContractCalls();

  const placeMagnetPriceWei = useOverrideCost(EOverride.PlaceMagnet, empire, BigInt(inputValue));
  const placeMagnetPointsReceived = useOverridePointsReceived(EOverride.PlaceMagnet, empire, BigInt(inputValue));

  const onPlaceMagnet = useCallback(async () => {
    await placeMagnet(empire, planetId, BigInt(inputValue), placeMagnetPriceWei);
    setInputValue("1");
    tables.SelectedPlanet.remove();
  }, [empire, planetId, inputValue, placeMagnetPriceWei, placeMagnet]);

  const pointLockPct = tables.P_MagnetConfig.useWithKeys()?.lockedPointsPercent ?? 0n;
  const empirePoints = tables.Empire.useWithKeys({ id: empire })?.pointsIssued ?? 0n;
  const pointsLocked = (empirePoints * pointLockPct) / 10000n;
  const {
    playerAccount: { address, entity },
  } = useAccountClient();
  const playerPoints = tables.Value_PointsMap.useWithKeys({ empireId: empire, playerId: entity })?.value ?? 0n;
  const playerBalance = useBalance(address).value ?? 0n;

  const magnets = usePlanetMagnets(planetId);
  const currentMagnetExists = !!magnets.find((magnet) => magnet.empire === empire)?.exists;

  const { disabled, message } = useMemo(() => {
    if (playerBalance < placeMagnetPriceWei) return { disabled: true, message: "Not enough money" };
    if (playerPoints < pointsLocked) return { disabled: true, message: "Not enough points" };
    if (currentMagnetExists) return { disabled: true, message: "Magnet already exists" };
    return { disabled: false, message: "" };
  }, [placeMagnetPriceWei, pointsLocked, currentMagnetExists, playerBalance, playerPoints]);

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex flex-row items-center gap-2">
        <div>
          <div className="grid grid-cols-3 gap-2">
            {magnets.map((magnet, index) => (
              <MagnetButton
                key={index}
                planetId={planetId}
                selected={empire === magnet.empire}
                magnetData={magnet}
                onClick={() => setEmpire(magnet.empire)}
              />
            ))}
          </div>
          {empire === EEmpire.LENGTH && <p className="text-xs opacity-50">Select empire </p>}
        </div>

        <Divider direction="vertical" className="self-center" />
        <div className="flex flex-col items-center justify-start">
          <NumberInput min={1} max={Infinity} count={inputValue} onChange={setInputValue} />
        </div>
      </div>

      {empire !== EEmpire.LENGTH && (
        <div className="flex">
          <div className="flex flex-col items-center justify-center">
            {message && <p className="px-2 text-xs text-error">{message}</p>}
            {!message && (
              <p className="px-2 py-1 text-xs opacity-50">
                {formatEther(pointsLocked)} POINTS WILL BE LOCKED{" "}
                <span className="text-success">({formatEther(playerPoints - pointsLocked)} AVAIL.)</span>
              </p>
            )}

            {!message && (
              <TransactionQueueMask id={`${planetId}-place-magnet`} className="">
                <Button onClick={onPlaceMagnet} size="xs" variant="secondary" className="" disabled={disabled}>
                  PLACE MAGNET
                </Button>
              </TransactionQueueMask>
            )}
            <p className="rounded-box rounded-t-none bg-error/25 p-1 text-center text-xs opacity-75">
              <Price wei={placeMagnetPriceWei} />
            </p>
            <PointsReceived points={placeMagnetPointsReceived} inline />
          </div>
        </div>
      )}
    </div>
  );
};

type MagnetData = { empire: EEmpire; exists: boolean; endTurn: bigint | undefined };
const MagnetButton = ({
  planetId,
  selected,
  magnetData,
  onClick,
}: {
  planetId: Entity;
  selected: boolean;
  magnetData: MagnetData;
  onClick: () => void;
}) => {
  const hasAdjacentEmpirePlanets = useAdjacentEmpirePlanets(planetId, magnetData.empire);
  const disabled = hasAdjacentEmpirePlanets.length === 0 || magnetData.exists;
  return (
    <Button
      variant={selected ? "secondary" : "neutral"}
      shape="square"
      size="sm"
      disabled={disabled}
      onClick={onClick}
      tooltip={disabled ? "Not adjacent" : ""}
    >
      <IconLabel imageUri={EmpireEnumToConfig[magnetData.empire].icons.magnet} />
    </Button>
  );
};
