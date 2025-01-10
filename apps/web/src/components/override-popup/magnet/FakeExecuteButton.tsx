import { formatEther } from "viem";

import { EEmpire, EOverride } from "@primodiumxyz/contracts/config/enums";
import { useCore, usePlayerAccount } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { PointsReceived } from "@/components/shared/PointsReceived";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useOverridePointsReceived } from "@/hooks/useOverridePointsReceived";

export const FakeExecuteButton = ({
  planetId,
  empire,
  inputValue,
  setInputValue,
}: {
  planetId: Entity;
  empire: EEmpire;
  inputValue: string;
  setInputValue: (value: string) => void;
}) => {
  const { tables } = useCore();
  const { login } = usePlayerAccount();

  const placeMagnetPriceWei = useOverrideCost(EOverride.PlaceMagnet, empire, BigInt(inputValue));

  const pointLockPct = tables.P_MagnetConfig.useWithKeys()?.lockedPointsPercent ?? 0n;
  const empirePoints = tables.Empire.useWithKeys({ id: empire })?.pointsIssued ?? 0n;
  const pointsLocked = (empirePoints * pointLockPct) / 10000n;
  const placeMagnetPointsReceived = useOverridePointsReceived(EOverride.PlaceMagnet, empire, BigInt(inputValue));

  return (
    <div className="flex">
      <div className="flex flex-col items-center justify-center">
        <p className="px-2 py-1 text-xs opacity-50">{formatEther(pointsLocked)} POINTS WILL BE LOCKED</p>
        <TransactionQueueMask id={`${planetId}-place-magnet`} className="">
          <Button onClick={() => login()} size="xs" variant="secondary" className="">
            LOGIN TO PLACE MAGNET
          </Button>
        </TransactionQueueMask>
        <p className="rounded-box rounded-t-none bg-error/25 p-1 text-center text-xs opacity-75">
          <Price wei={placeMagnetPriceWei} />
        </p>

        <PointsReceived points={placeMagnetPointsReceived} inline />
      </div>
    </div>
  );
};
