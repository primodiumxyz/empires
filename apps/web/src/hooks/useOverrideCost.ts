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

export const useNextTurnOverrideCost = (actionType: EOverride, empireImpacted: EEmpire, actionCount: bigint) => {
  const { tables, utils } = useCore();
  const time = tables.Time.use();

  return useMemo(
    () => utils.getTotalCost(actionType, empireImpacted, actionCount, true),
    [actionType, empireImpacted, actionCount, time],
  );
};
