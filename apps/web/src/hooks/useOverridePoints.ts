import { useMemo } from "react";

import { EEmpire, EOverride, POINTS_UNIT } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { useEmpires } from "@/hooks/useEmpires";

export const useOverridePoints = (overrideType: EOverride, empireImpacted: EEmpire, overrideCount: bigint) => {
  const { tables } = useCore();
  const empires = useEmpires();
  console.log(empires);
  const config = tables.P_OverrideConfig.useWithKeys({ overrideAction: overrideType });
  const pointUnit = tables.P_PointConfig.use()?.pointUnit ?? BigInt(POINTS_UNIT);

  return useMemo(() => {
    if (config?.isProgressOverride) {
      return {
        empires: [empireImpacted],
        points: overrideCount * BigInt(empires.size - 1) * pointUnit,
      };
    } else {
      return {
        empires: [...empires.keys()].filter((empire) => empire !== empireImpacted),
        points: overrideCount * pointUnit,
      };
    }
  }, [config, pointUnit, overrideCount, empireImpacted]);
};
