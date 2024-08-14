import { useMemo } from "react";

import { EEmpire, EOverride, POINTS_UNIT } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { useEmpires } from "@/hooks/useEmpires";

export type OverridePointsReceived = {
  targetEmpire: EEmpire;
  impactedEmpires: EEmpire[];
  value: bigint;
};

export const useOverridePointsReceived = (
  overrideType: EOverride,
  empireImpacted: EEmpire,
  overrideCount: bigint,
): OverridePointsReceived => {
  const { tables } = useCore();
  const empires = useEmpires();
  const config = tables.P_OverrideConfig.useWithKeys({ overrideAction: overrideType });
  const pointUnit = tables.P_PointConfig.use()?.pointUnit ?? BigInt(POINTS_UNIT);

  return useMemo(() => {
    if (config?.isProgressOverride) {
      return {
        targetEmpire: empireImpacted,
        impactedEmpires: [empireImpacted],
        value: overrideCount * BigInt(empires.size - 1) * pointUnit,
      };
    } else {
      return {
        targetEmpire: empireImpacted,
        impactedEmpires: [...empires.keys()].filter((empire) => empire !== empireImpacted),
        value: overrideCount * pointUnit,
      };
    }
  }, [config, pointUnit, overrideCount, empireImpacted, empires]);
};
