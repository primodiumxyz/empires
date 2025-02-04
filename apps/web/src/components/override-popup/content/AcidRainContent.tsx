import { EEmpire, EOverride } from "@primodiumxyz/contracts";
import { useCore, usePlayerAccount } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { PointsReceived } from "@/components/shared/PointsReceived";
import { Price } from "@/components/shared/Price";
import { SlippageSettings } from "@/components/shared/SlippageSettings";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useAcidRain } from "@/hooks/useAcidRain";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useOverridePointsReceived } from "@/hooks/useOverridePointsReceived";

export const AcidRainContent: React.FC<{ entity: Entity }> = ({ entity }) => {
  const { tables } = useCore();
  const { placeAcidRain } = useContractCalls();
  const { playerAccount, login } = usePlayerAccount();

  const planet = tables.Planet.use(entity);
  const planetEmpire = planet?.empireId ?? (0 as EEmpire);
  const { cycles } = useAcidRain(entity, planetEmpire);

  const { expected: placeAcidPriceWei, max: placeAcidPriceWeiMax } = useOverrideCost(
    EOverride.PlaceAcid,
    planetEmpire,
    1n,
  );
  const placeAcidDisabled = !planetEmpire || cycles > 0n;
  const placeAcidPointsReceived = useOverridePointsReceived(EOverride.PlaceAcid, planetEmpire, 1n);

  const caption = !planetEmpire
    ? "Can't trigger on an unowned planet"
    : cycles > 0n
      ? cycles === 1n
        ? "Acid Rain is active (last turn)"
        : `Acid Rain is active (${cycles} turns left)`
      : "";

  return (
    <div className="flex flex-col items-center gap-1">
      {!!caption && <p className="mb-1 rounded-box bg-error/25 p-1 text-center text-xs opacity-75">{caption}</p>}

      <PointsReceived points={placeAcidPointsReceived} inline explicit />
      {!!playerAccount && (
        <TransactionQueueMask id={`${entity}-place-acid`} className="relative flex items-center">
          <Button
            onClick={async () => {
              await placeAcidRain(entity, planetEmpire, placeAcidPriceWeiMax);
              tables.SelectedPlanet.remove();
            }}
            disabled={placeAcidDisabled}
            size="sm"
            variant="error"
          >
            Place Acid
          </Button>
          <SlippageSettings className="absolute top-1/2 -translate-y-1/2 left-[105%]" disabled={placeAcidDisabled} />
        </TransactionQueueMask>
      )}
      {!playerAccount && (
        <Button onClick={() => login()} size="xs" variant="secondary">
          LOGIN TO ACTIVATE
        </Button>
      )}
      <div className="w-fit rounded-box rounded-t-none bg-secondary/25 px-1 text-center text-xs opacity-75">
        <Price wei={placeAcidPriceWei} />
        <p className="opacity-70 text-[0.6rem]">
          Max <Price wei={placeAcidPriceWeiMax} />
        </p>
      </div>
    </div>
  );
};
