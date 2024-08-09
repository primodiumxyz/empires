import React, { useMemo } from "react";

import { EEmpire, EOverride } from "@primodiumxyz/contracts/config/enums";
import { entityToPlanetName } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { defaultEntity, Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useSettings } from "@/hooks/useSettings";
import { useShieldEater } from "@/hooks/useShieldEater";
import { msToDuration } from "@/util/time";

export const ShieldEaterContent: React.FC<{ entity: Entity }> = ({ entity }) => {
  const { tables } = useCore();
  const { detonateShieldEater } = useContractCalls();
  const { showBlockchainUnits } = useSettings();
  const { currentPlanet, cooldownShields } = useShieldEater();

  const planet = tables.Planet.use(entity);
  const planetEmpire = planet?.empireId ?? (0 as EEmpire);

  const detonatePriceWei = useOverrideCost(EOverride.DetonateShieldEater, planetEmpire, 1n);
  const detonateDisabled = currentPlanet !== entity || !!cooldownShields;

  const caption =
    currentPlanet !== entity
      ? `The shield eater is currently on ${entityToPlanetName(currentPlanet)}.`
      : cooldownShields
        ? `The shield eater is eating, come back after it ate ${cooldownShields} more shields.`
        : undefined;

  return (
    <div className="flex flex-col items-center">
      {!!caption && (
        <p className="mb-1 rounded-box rounded-t-none bg-error/25 p-1 text-center text-xs opacity-75">{caption}</p>
      )}
      <TransactionQueueMask id="detonate-shield-eater">
        <Button
          onClick={async () => {
            await detonateShieldEater(entity);
            tables.SelectedPlanet.remove();
          }}
          disabled={detonateDisabled}
          size="sm"
          variant="error"
        >
          Activate
        </Button>
      </TransactionQueueMask>
      <p className="rounded-box rounded-t-none bg-error/25 p-1 text-center text-xs opacity-75">
        <Price wei={detonatePriceWei} />
      </p>
    </div>
  );
};
