import React from "react";

import { EEmpire, EOverride } from "@primodiumxyz/contracts";
import { useCore, usePlayerAccount } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { PointsReceived } from "@/components/shared/PointsReceived";
import { Price } from "@/components/shared/Price";
import { SlippageSettings } from "@/components/shared/SlippageSettings";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useOverridePointsReceived } from "@/hooks/useOverridePointsReceived";
import { useShieldEater } from "@/hooks/useShieldEater";

export const ShieldEaterContent: React.FC<{ entity: Entity }> = ({ entity }) => {
  const { tables } = useCore();
  const { detonateShieldEater } = useContractCalls();
  const { currentPlanet, cooldownShields } = useShieldEater();
  const { playerAccount, login } = usePlayerAccount();

  const planet = tables.Planet.use(entity);
  const planetEmpire = planet?.empireId ?? (0 as EEmpire);

  const { expected: detonatePriceWei, max: detonatePriceWeiMax } = useOverrideCost(
    EOverride.DetonateShieldEater,
    planetEmpire,
    1n,
  );
  const detonateDisabled = currentPlanet !== entity || !!cooldownShields;
  const detonatePointsReceived = useOverridePointsReceived(EOverride.DetonateShieldEater, planetEmpire, 1n);

  const caption =
    currentPlanet && currentPlanet !== entity
      ? `Not on current planet.`
      : cooldownShields
        ? `Shield eater is charging, come back after it eats ${cooldownShields.toLocaleString()} more shields.`
        : undefined;

  return (
    <div className="flex flex-col items-center">
      {!!caption && <p className="mb-1 rounded-box bg-error/25 p-1 text-center text-xs opacity-75">{caption}</p>}
      {!!playerAccount && (
        <TransactionQueueMask id="detonate-shield-eater" className="relative">
          <Button
            onClick={async () => {
              await detonateShieldEater(entity, detonatePriceWeiMax);
              tables.SelectedPlanet.remove();
            }}
            disabled={detonateDisabled}
            size="sm"
            variant="error"
          >
            Activate
          </Button>
          <SlippageSettings className="absolute top-1/2 -translate-y-1/2 left-[105%]" disabled={detonateDisabled} />
        </TransactionQueueMask>
      )}
      {!playerAccount && (
        <Button onClick={() => login()} size="xs" variant="secondary">
          LOGIN TO ACTIVATE
        </Button>
      )}
      <div className="w-fit rounded-box rounded-t-none bg-secondary/25 px-1 text-center text-xs opacity-75">
        <Price wei={detonatePriceWei} />
        <p className="opacity-70 text-[0.6rem]">
          Max <Price wei={detonatePriceWeiMax} />
        </p>
      </div>
      {currentPlanet === entity && <PointsReceived points={detonatePointsReceived} inline explicit allowNullEmpire />}
    </div>
  );
};
