import { useMemo } from "react";

import { EEmpire, EOverride } from "@primodiumxyz/contracts/config/enums";
import { useCore } from "@primodiumxyz/core/react";

export const useOverrideCost = (actionType: EOverride, empireImpacted: EEmpire, actionCount: bigint) => {
  const { tables, utils } = useCore();
  const time = tables.Time.use();

  return useMemo(
    () => utils.getTotalCost(actionType, empireImpacted, actionCount),
    [actionType, empireImpacted, actionCount, time],
  );
};

export const useNextDecreaseOverrideCost = (actionType: EOverride, empireImpacted: EEmpire, actionCount: bigint) => {
  const { tables, utils } = useCore();
  const time = tables.Time.use();

  return useMemo(() => {
    const overrideConfig = tables.P_OverrideConfig.get();
    const currentOverrideCost =
      tables.OverrideCost.getWithKeys({ empireId: empireImpacted, overrideAction: actionType })?.value ?? 0n;

    let newOverrideCost = currentOverrideCost;
    if (newOverrideCost > (overrideConfig?.minOverrideCost ?? 0n) + (overrideConfig?.overrideGenRate ?? 0n)) {
      newOverrideCost -= overrideConfig?.overrideGenRate ?? 0n;
    } else {
      newOverrideCost = overrideConfig?.minOverrideCost ?? 0n;
    }

    return utils.getTotalCost(actionType, empireImpacted, actionCount, newOverrideCost);
  }, [actionType, empireImpacted, actionCount, time, tables.P_OverrideConfig, tables.OverrideCost]);
};
