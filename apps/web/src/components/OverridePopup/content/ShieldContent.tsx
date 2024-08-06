import React, { useState } from "react";

import { EEmpire, EOverride } from "@primodiumxyz/contracts/config/enums";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { NumberInput } from "@/components/core/NumberInput";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useTimeLeft } from "@/hooks/useTimeLeft";

export const ShieldContent: React.FC<{ entity: Entity }> = ({ entity }) => {
  const { tables } = useCore();
  const { addShield, removeShield } = useContractCalls();
  const { gameOver } = useTimeLeft();
  const planet = tables.Planet.use(entity);
  const planetEmpire = planet?.empireId ?? (0 as EEmpire);
  const [inputValue, setInputValue] = useState("1");
  const addShieldPriceWei = useOverrideCost(EOverride.ChargeShield, planetEmpire, BigInt(inputValue));
  const removeShieldPriceWei = useOverrideCost(EOverride.DrainShield, planetEmpire, BigInt(inputValue));

  const attackDisabled = (planet?.shieldCount ?? 0n) < BigInt(inputValue) || gameOver || Number(planetEmpire) === 0;
  const supportDisabled = gameOver || Number(planetEmpire) === 0;

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3">
      <NumberInput min={1} max={Infinity} count={inputValue} onChange={setInputValue} />
      <div className="grid w-full grid-cols-2 gap-2">
        <div className="flex flex-col items-center gap-1">
          <TransactionQueueMask id={`${entity}-remove-shield`}>
            <Button
              onClick={async () => {
                await removeShield(entity, BigInt(inputValue), removeShieldPriceWei);
                setInputValue("1");
                tables.SelectedPlanet.remove();
              }}
              disabled={attackDisabled}
              size="xs"
              variant="error"
            >
              - ATTACK
            </Button>
          </TransactionQueueMask>
          <p className="rounded-box rounded-t-none bg-error/25 p-1 text-center text-xs opacity-75">
            <Price wei={removeShieldPriceWei} />
          </p>
        </div>

        <div className="flex flex-col items-center gap-1">
          <TransactionQueueMask id={`${entity}-add-shield`}>
            <Button
              onClick={async () => {
                await addShield(entity, BigInt(inputValue), addShieldPriceWei);
                setInputValue("1");
                tables.SelectedPlanet.remove();
              }}
              disabled={supportDisabled}
              size="xs"
              variant="secondary"
            >
              + SUPPORT
            </Button>
          </TransactionQueueMask>
          <p className="rounded-box rounded-t-none bg-secondary/25 p-1 text-center text-xs opacity-75">
            <Price wei={addShieldPriceWei} />
          </p>
        </div>
      </div>
    </div>
  );
};
