import React, { useState } from "react";

import { EEmpire, EOverride } from "@primodiumxyz/contracts/config/enums";
import { useCore, usePlayerAccount } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { NumberInput } from "@/components/core/NumberInput";
import { PointsReceived } from "@/components/shared/PointsReceived";
import { Price } from "@/components/shared/Price";
import { SlippageSettings } from "@/components/shared/SlippageSettings";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useOverridePointsReceived } from "@/hooks/useOverridePointsReceived";
import { useTimeLeft } from "@/hooks/useTimeLeft";

export const ShipContent: React.FC<{ entity: Entity }> = ({ entity }) => {
  const { tables } = useCore();
  const { createShip } = useContractCalls();
  const { gameActive } = useTimeLeft();
  const planet = tables.Planet.use(entity);
  const planetEmpire = planet?.empireId ?? EEmpire.NULL;
  const [inputValue, setInputValue] = useState("1");
  const { expected: createShipPriceWei, max: createShipPriceWeiMax } = useOverrideCost(
    EOverride.CreateShip,
    planetEmpire,
    BigInt(inputValue),
  );
  const createShipPointsReceived = useOverridePointsReceived(EOverride.CreateShip, planetEmpire, BigInt(inputValue));
  const { playerAccount, login } = usePlayerAccount();

  const supportDisabled = !gameActive || Number(planetEmpire) === 0;

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <PointsReceived points={createShipPointsReceived} inline />
      <NumberInput min={1} max={Infinity} count={inputValue} onChange={setInputValue} />
      <div className="flex flex-col items-center">
        {!!playerAccount && (
          <TransactionQueueMask id={`${entity}-create-ship`} className="relative flex flex-row items-center">
            <Button
              onClick={async () => {
                await createShip(entity, planetEmpire, BigInt(inputValue), createShipPriceWeiMax);
                setInputValue("1");
                tables.SelectedPlanet.remove();
              }}
              disabled={supportDisabled}
              size="xs"
              variant="secondary"
            >
              ADD SHIPS
            </Button>
            <SlippageSettings className="absolute left-[105%] top-1/2 -translate-y-1/2" disabled={supportDisabled} />
          </TransactionQueueMask>
        )}

        {!playerAccount && (
          <Button onClick={() => login()} size="xs" variant="secondary">
            LOGIN TO ADD SHIPS
          </Button>
        )}
        <div className="w-fit rounded-box rounded-t-none bg-secondary/25 px-1 text-center text-xs opacity-75">
          <Price wei={createShipPriceWei} />
          <p className="text-[0.6rem] opacity-70">
            Max <Price wei={createShipPriceWeiMax} />
          </p>
        </div>
      </div>
    </div>
  );
};
