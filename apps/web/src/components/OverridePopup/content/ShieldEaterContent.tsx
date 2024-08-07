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
  // const {detonateShieldEater} = useContractCalls()
  // TODO(SE): Temp
  const detonateShieldEater = async () => {};
  const { showBlockchainUnits } = useSettings();
  const { currentPlanet, turnsToDestination, cooldownMs, cooldownBlocks } = useShieldEater();

  const selectedPlanet = tables.SelectedPlanet.use()?.value ?? defaultEntity;
  const selectedPlanetEmpire = tables.Planet.get(selectedPlanet)?.empireId ?? (0 as EEmpire);
  const cooldownDuration = useMemo(() => msToDuration(cooldownMs ?? 0), [cooldownMs]);

  const detonatePriceWei = useOverrideCost(EOverride.DetonateShieldEater, selectedPlanetEmpire, 1n);
  const detonateDisabled = currentPlanet !== selectedPlanet || !!cooldownMs;

  const caption =
    currentPlanet !== selectedPlanet
      ? `The shield eater is currently on ${entityToPlanetName(currentPlanet)}.`
      : cooldownMs
        ? `The shield eater is on cooldown for ${cooldownDuration.toLocaleString()}${showBlockchainUnits.enabled ? ` (${cooldownBlocks} blocks)` : ""}.`
        : undefined;

  return (
    <div className="flex flex-col items-center">
      {!!caption && (
        <p className="mb-1 rounded-box rounded-t-none bg-error/25 p-1 text-center text-xs opacity-75">{caption}</p>
      )}
      <TransactionQueueMask id={`${entity}-boost-charge`}>
        <Button
          onClick={async () => {
            await detonateShieldEater();
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
