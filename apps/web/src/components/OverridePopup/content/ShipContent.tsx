import React, { useState } from "react";

import { EEmpire, EOverride } from "@primodiumxyz/contracts/config/enums";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { NumberInput } from "@/components/core/NumberInput";
import { PointsReceived } from "@/components/shared/PointsReceived";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useOverridePointsReceived } from "@/hooks/useOverridePointsReceived";
import useWinningEmpire from "@/hooks/useWinningEmpire";

export const ShipContent: React.FC<{ entity: Entity }> = ({ entity }) => {
  const { tables } = useCore();
  const { createShip } = useContractCalls();
  const { gameOver } = useWinningEmpire();
  const planet = tables.Planet.use(entity);
  const planetEmpire = planet?.empireId ?? EEmpire.NULL;
  const [inputValue, setInputValue] = useState("1");
  const createShipPriceWei = useOverrideCost(EOverride.CreateShip, planetEmpire, BigInt(inputValue));
  const createShipPointsReceived = useOverridePointsReceived(EOverride.CreateShip, planetEmpire, BigInt(inputValue));

  const supportDisabled = gameOver || Number(planetEmpire) === 0;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <NumberInput min={1} max={Infinity} count={inputValue} onChange={setInputValue} />
      <div className="grid w-full grid-cols-2 gap-2">
        <div className="flex flex-col items-center gap-1">
          <TransactionQueueMask id={`${entity}-create-ship`}>
            <Button
              onClick={async () => {
                await createShip(entity, BigInt(inputValue), createShipPriceWei);
                setInputValue("1");
                tables.SelectedPlanet.remove();
              }}
              disabled={supportDisabled}
              size="xs"
              variant="secondary"
            >
              ADD SHIPS
            </Button>
          </TransactionQueueMask>
          <p className="rounded-box rounded-t-none bg-secondary/25 p-1 text-center text-xs opacity-75">
            <Price wei={createShipPriceWei} />
          </p>
          <PointsReceived points={createShipPointsReceived} />
        </div>
      </div>
    </div>
  );
};
