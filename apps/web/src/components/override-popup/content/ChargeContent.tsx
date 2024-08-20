import React, { useState } from "react";

import { EEmpire, EOverride } from "@primodiumxyz/contracts/config/enums";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { CapacityBar } from "@/components/core/CapacityBar";
import { NumberInput } from "@/components/core/NumberInput";
import { PointsReceived } from "@/components/shared/PointsReceived";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useCharge } from "@/hooks/useCharge";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useOverridePointsReceived } from "@/hooks/useOverridePointsReceived";
import useWinningEmpire from "@/hooks/useWinningEmpire";

export const ChargeContent: React.FC<{ entity: Entity }> = ({ entity }) => {
  const { tables } = useCore();
  const { stunCharge, boostCharge, tacticalStrike } = useContractCalls();
  const { charge, maxCharge, percent } = useCharge(entity);
  const { gameOver } = useWinningEmpire();
  const planet = tables.Planet.use(entity);
  const planetEmpire = planet?.empireId ?? EEmpire.NULL;
  const [inputValue, setInputValue] = useState("1");
  const boostChargePriceWei = useOverrideCost(EOverride.BoostCharge, planetEmpire, BigInt(inputValue));
  const stunChargePriceWei = useOverrideCost(EOverride.StunCharge, planetEmpire, BigInt(inputValue));
  const boostChargePointsReceived = useOverridePointsReceived(EOverride.BoostCharge, planetEmpire, BigInt(inputValue));
  const stunChargePointsReceived = useOverridePointsReceived(EOverride.StunCharge, planetEmpire, BigInt(inputValue));

  const isBoostDisabled = gameOver || Number(planetEmpire) === 0;
  const isStunDisabled = gameOver || Number(planetEmpire) === 0;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {percent < 100 && (
        <>
          <NumberInput min={1} max={Infinity} count={inputValue} onChange={setInputValue} />
          <div className="flex gap-2">
            <div className="flex flex-col items-center">
              <TransactionQueueMask id={`${entity}-stun-charge`}>
                <Button
                  onClick={async () => {
                    await stunCharge(entity, BigInt(inputValue), stunChargePriceWei);
                    setInputValue("1");
                    tables.SelectedPlanet.remove();
                  }}
                  disabled={isStunDisabled}
                  size="xs"
                  variant="secondary"
                >
                  - STUN
                </Button>
              </TransactionQueueMask>

              <p className="rounded-box rounded-t-none bg-secondary/25 p-1 text-center text-xs opacity-75">
                <Price wei={stunChargePriceWei} />
              </p>
              <PointsReceived points={stunChargePointsReceived} />
            </div>
            <div className="flex flex-col items-center">
              <TransactionQueueMask id={`${entity}-boost-charge`}>
                <Button
                  onClick={async () => {
                    await boostCharge(entity, BigInt(inputValue), boostChargePriceWei);
                    setInputValue("1");
                    tables.SelectedPlanet.remove();
                  }}
                  disabled={isBoostDisabled}
                  size="xs"
                  variant="error"
                >
                  + BOOST
                </Button>
              </TransactionQueueMask>
              <p className="rounded-box rounded-t-none bg-error/25 p-1 text-center text-xs opacity-75">
                <Price wei={boostChargePriceWei} />
              </p>
              <PointsReceived points={boostChargePointsReceived} />
            </div>
          </div>
        </>
      )}
      {percent >= 100 && (
        <div className="flex flex-col items-center">
          <TransactionQueueMask id={`${entity}-tactical-strike`}>
            <Button
              onClick={async () => {
                await tacticalStrike(entity);
                setInputValue("1");
                tables.SelectedPlanet.remove();
              }}
              disabled={isBoostDisabled}
              size="sm"
              variant="error"
            >
              STRIKE PLANET
            </Button>
          </TransactionQueueMask>
        </div>
      )}
      <div className="flex flex-row items-center justify-center gap-2">
        <div className="w-36">
          <CapacityBar current={charge} max={maxCharge} />
        </div>

        <p className="text-xs">{Math.floor(Math.min(percent, 100))}%</p>
      </div>
    </div>
  );
};
