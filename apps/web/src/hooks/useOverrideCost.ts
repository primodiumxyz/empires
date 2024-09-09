import { useMemo } from "react";

import { EEmpire, EOverride } from "@primodiumxyz/contracts/config/enums";
import { useCore } from "@primodiumxyz/core/react";

export const useOverrideCost = (actionType: EOverride, empireImpacted: EEmpire, actionCount: bigint) : {expected: bigint, max: bigint} => {
  const { tables, utils } = useCore();
  const time = tables.Time.use();
  const turn = tables.Turn.use()?.value;
  const slippageData = tables.Slippage.use();

  return useMemo(
    () => {
      const cost = utils.getTotalCost(actionType, empireImpacted, actionCount);
      if (!slippageData) {
        return {expected: cost, max: cost};
      }
      const slippage  = slippageData.isAuto ? slippageData.autoValue?? 0 : slippageData.customValue ?? 1;
      const scaledSlippage = BigInt(Math.round(Number(slippage) * 100));

      return {expected: cost, max: cost * (10000n + scaledSlippage) / 10000n};
    },
    [actionType, empireImpacted, actionCount, time, turn],
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
