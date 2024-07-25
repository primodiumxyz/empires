import { useMemo } from "react";

import { EEmpire, EPlayerAction } from "@primodiumxyz/contracts/config/enums";
import { useCore } from "@primodiumxyz/core/react";

export const useActionCost = (actionType: EPlayerAction, empireImpacted: EEmpire, actionCount: bigint) => {
  const { tables, utils } = useCore();

  const time = tables.Time.use();

  return useMemo(() => utils.getTotalCost(actionType, empireImpacted, actionCount), [actionType, empireImpacted, actionCount, time]);
};
