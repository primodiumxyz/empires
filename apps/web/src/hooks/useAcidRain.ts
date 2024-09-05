import { useMemo } from "react";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";

export const useAcidRain = (planetId: Entity, empireId: EEmpire): { cycles: bigint } => {
  const { tables } = useCore();
  const acidRainData = tables.Value_AcidPlanetsSet.useWithKeys({ planetId, empireId });

  return useMemo(
    () => ({
      cycles: acidRainData?.value ?? 0n,
    }),
    [acidRainData],
  );
};
