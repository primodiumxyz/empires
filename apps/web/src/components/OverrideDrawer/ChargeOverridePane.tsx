import React from "react";

import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { NumberInput } from "@/components/core/NumberInput";
import { PlanetCharge } from "@/components/OverrideDrawer/PlanetCharge";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";

interface ChargeOverridePaneProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onBoostClick: () => void;
  onStunClick: () => void;
  boostPrice: bigint;
  stunPrice: bigint;
  isBoostDisabled?: boolean;
  isStunDisabled?: boolean;
  boostTxQueueId: string;
  stunTxQueueId: string;
  planetId: Entity;
}

export const ChargeOverridePane: React.FC<ChargeOverridePaneProps> = ({
  inputValue,
  onInputChange,
  onBoostClick,
  onStunClick,
  boostPrice,
  stunPrice,
  isBoostDisabled = false,
  isStunDisabled = false,
  boostTxQueueId,
  stunTxQueueId,
  planetId,
}) => {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <NumberInput min={1} max={Infinity} count={inputValue} onChange={onInputChange} />
      <div className="flex gap-2">
        <div className="flex flex-col items-center">
          <TransactionQueueMask id={stunTxQueueId}>
            <Button onClick={onStunClick} disabled={isStunDisabled} size="xs" variant="secondary">
              - STUN
            </Button>
          </TransactionQueueMask>

          <p className="rounded-box rounded-t-none bg-secondary/25 p-1 text-center text-xs opacity-75">
            <Price wei={stunPrice} />
          </p>
        </div>
        <div className="flex flex-col items-center">
          <TransactionQueueMask id={boostTxQueueId}>
            <Button onClick={onBoostClick} disabled={isBoostDisabled} size="xs" variant="error">
              + BOOST
            </Button>
          </TransactionQueueMask>
          <p className="rounded-box rounded-t-none bg-error/25 p-1 text-center text-xs opacity-75">
            <Price wei={boostPrice} />
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        CHARGE
        <PlanetCharge planetId={planetId} />
      </div>
    </div>
  );
};
