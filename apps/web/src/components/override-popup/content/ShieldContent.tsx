import React, { useState } from "react";

import { EEmpire, EOverride } from "@primodiumxyz/contracts/config/enums";
import { useCore, usePlayerAccount } from "@primodiumxyz/core/react";
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

export const ShieldContent: React.FC<{ entity: Entity }> = ({ entity }) => {
  const { tables } = useCore();
  const { chargeShield } = useContractCalls();
  const { gameOver } = useWinningEmpire();
  const planet = tables.Planet.use(entity);
  const planetEmpire = planet?.empireId ?? EEmpire.NULL;
  const [inputValue, setInputValue] = useState("1");
  const chargeShieldPriceWei = useOverrideCost(EOverride.ChargeShield, planetEmpire, BigInt(inputValue));
  const chargeShieldPointsReceived = useOverridePointsReceived(
    EOverride.ChargeShield,
    planetEmpire,
    BigInt(inputValue),
  );

  const supportDisabled = gameOver || Number(planetEmpire) === 0;
  const { playerAccount, login } = usePlayerAccount();

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <NumberInput min={1} max={Infinity} count={inputValue} onChange={setInputValue} />
      <div className="flex flex-col items-center">
        {!!playerAccount && (
          <TransactionQueueMask id={`${entity}-add-shield`}>
            <Button
              onClick={async () => {
                await chargeShield(entity, BigInt(inputValue), chargeShieldPriceWei);
                setInputValue("1");
                tables.SelectedPlanet.remove();
              }}
              disabled={supportDisabled}
              size="xs"
              variant="secondary"
            >
              ADD SHIELDS
            </Button>
          </TransactionQueueMask>
        )}
        {!playerAccount && (
          <Button onClick={() => login()} disabled={supportDisabled} size="xs" variant="secondary">
            LOGIN TO ADD SHIELDS
          </Button>
        )}
        <p className="-mt-1 w-fit rounded-box rounded-t-none bg-secondary/25 p-1 text-center text-xs opacity-75">
          <Price wei={chargeShieldPriceWei} />
        </p>
      </div>
      <PointsReceived points={chargeShieldPointsReceived} inline />
    </div>
  );
};
