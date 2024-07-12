import { useMemo } from "react";

import { EEmpire, EPlayerAction } from "@primodiumxyz/contracts/config/enums";
import { useCore } from "@primodiumxyz/core/react";

export const useActionCost = (actionType: EPlayerAction, empireImpacted: EEmpire) => {
  const { tables, utils } = useCore();

  const time = tables.Time.use();

  return useMemo(() => utils.getTotalCost(actionType, empireImpacted), [actionType, empireImpacted, time]);
};
