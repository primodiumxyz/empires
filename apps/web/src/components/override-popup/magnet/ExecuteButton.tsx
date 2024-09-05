import { useCallback, useMemo } from "react";
import { Address, formatEther } from "viem";

import { EEmpire, EOverride } from "@primodiumxyz/contracts/config/enums";
import { useCore, usePlayerAccount } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { PointsReceived } from "@/components/shared/PointsReceived";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useBalance } from "@/hooks/useBalance";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useOverridePointsReceived } from "@/hooks/useOverridePointsReceived";
import { usePlanetMagnets } from "@/hooks/usePlanetMagnets";
import useWinningEmpire from "@/hooks/useWinningEmpire";
import { SlippageSettings } from "@/components/shared/SlippageSettings";

export const ExecuteButton = ({
  planetId,
  empire,
  address,
  entity,
  inputValue,
  setInputValue,
}: {
  planetId: Entity;
  empire: EEmpire;
  address: Address;
  entity: Entity;
  inputValue: string;
  setInputValue: (value: string) => void;
}) => {
  const { tables } = useCore();
  const { placeMagnet } = useContractCalls();
  const { playerAccount, login } = usePlayerAccount();

  const { expected: placeMagnetPriceWei, max: placeMagnetPriceWeiMax } = useOverrideCost(EOverride.PlaceMagnet, empire, BigInt(inputValue));

  const onPlaceMagnet = useCallback(async () => {
    await placeMagnet(empire, planetId, BigInt(inputValue), placeMagnetPriceWeiMax);
    setInputValue("1");
    tables.SelectedPlanet.remove();
  }, [empire, planetId, inputValue, placeMagnetPriceWeiMax, placeMagnet]);

  const pointLockPct = tables.P_MagnetConfig.useWithKeys()?.lockedPointsPercent ?? 0n;
  const empirePoints = tables.Empire.useWithKeys({ id: empire })?.pointsIssued ?? 0n;
  const pointsLocked = (empirePoints * pointLockPct) / 10000n;
  const playerPoints = tables.Value_PointsMap.useWithKeys({ empireId: empire, playerId: entity })?.value ?? 0n;
  const playerBalance = useBalance(address).value ?? 0n;
  const placeMagnetPointsReceived = useOverridePointsReceived(EOverride.PlaceMagnet, empire, BigInt(inputValue));

  const { gameOver } = useWinningEmpire();
  const magnets = usePlanetMagnets(planetId);
  const currentMagnetExists = !!magnets.find((magnet) => magnet.empire === empire)?.exists;

  const { disabled, message } = useMemo(() => {
    if (playerBalance < placeMagnetPriceWei) return { disabled: true, message: "Not enough money" };
    if (playerPoints < pointsLocked) return { disabled: true, message: `${formatEther(pointsLocked)} points needed` };
    if (currentMagnetExists) return { disabled: true, message: "Magnet already exists" };
    if (gameOver) return { disabled: true, message: "" };
    return { disabled: false, message: "" };
  }, [placeMagnetPriceWei, pointsLocked, currentMagnetExists, playerBalance, playerPoints]);

  return (
    <div className="flex">
      <div className="flex flex-col items-center justify-center gap-1">
        {message && (
          <p className="px-2 py-1 text-xs text-error">
            {message} <span className="text-success">({formatEther(playerPoints)} AVAIL.)</span>
          </p>
        )}
        {!message && (
          <p className="mt-1 text-xs opacity-50">
            {formatEther(pointsLocked)} POINTS WILL BE LOCKED{" "}
            <span className="text-success">({formatEther(playerPoints - pointsLocked)} AVAIL.)</span>
          </p>
        )}
        {!disabled && <PointsReceived points={placeMagnetPointsReceived} inline />}
        {!!playerAccount && (
          <TransactionQueueMask id={`${planetId}-place-magnet`} className="relative">
            <Button onClick={onPlaceMagnet} size="xs" variant="secondary" className="" disabled={disabled}>
              PLACE MAGNET
            </Button>
            <SlippageSettings className="absolute top-1/2 -translate-y-1/2 left-full" disabled={disabled} />
          </TransactionQueueMask>
        )}
        {!playerAccount && (
          <Button onClick={() => login()} size="xs" variant="secondary" className="">
            LOGIN TO PLACE MAGNET
          </Button>
        )}

        <div className="w-fit rounded-box rounded-t-none bg-secondary/25 px-1 text-center text-xs opacity-75">
          <Price wei={placeMagnetPriceWei} />
          <p className="opacity-70 text-[0.6rem]" >Max <Price wei={placeMagnetPriceWeiMax}  /></p>
        </div>

        

      </div>
    </div>
  );
};
