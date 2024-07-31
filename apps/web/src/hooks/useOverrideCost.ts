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
  const overrideConfig = tables.P_OverrideConfig.use();
  const currentOverrideCost =
    tables.OverrideCost.useWithKeys({ empireId: empireImpacted, overrideAction: actionType })?.value ?? 0n;

  return useMemo(() => {
    const minOverrideCost = overrideConfig?.minOverrideCost ?? 0n;
    const overrideGenRate = overrideConfig?.overrideGenRate ?? 0n;

    let newOverrideCost = currentOverrideCost;
    if (newOverrideCost > minOverrideCost + overrideGenRate) {
      newOverrideCost -= overrideGenRate;
    } else {
      newOverrideCost = minOverrideCost;
    }

    return utils.getTotalCost(actionType, empireImpacted, actionCount, newOverrideCost);
  }, [actionType, empireImpacted, actionCount, time, overrideConfig, currentOverrideCost]);
};
