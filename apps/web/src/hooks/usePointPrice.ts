import { useCallback, useMemo } from "react";

import { EEmpire, POINTS_UNIT } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";

type EmpirePrices = { [key in Exclude<EEmpire, EEmpire.LENGTH>]: bigint | undefined };
type PointPrice = {
  sell: EmpirePrices;
  buy: EmpirePrices;
};

export const usePointPrice = (): PointPrice => {
  const { tables } = useCore();

  const config = tables.P_PointConfig.use();
  const pointCostDecrease = config?.pointCostIncrease ?? BigInt(POINTS_UNIT * 0.01);
  const minPointCost = config?.minPointCost ?? BigInt(POINTS_UNIT * 0.01);
  const pointSellTax = config?.pointSellTax ?? BigInt(POINTS_UNIT * 0);

  const redEmpirePointCost = tables.Faction.useWithKeys({ id: EEmpire.Red })?.pointCost ?? BigInt(0);
  const blueEmpirePointCost = tables.Faction.useWithKeys({ id: EEmpire.Blue })?.pointCost ?? BigInt(0);
  const greenEmpirePointCost = tables.Faction.useWithKeys({ id: EEmpire.Green })?.pointCost ?? BigInt(0);

  const getPointSaleValue = useCallback(
    (pointCost: bigint) => {
      if (pointCost >= minPointCost + pointCostDecrease) return pointCost - pointCostDecrease - pointSellTax;
      return BigInt(0);
    },
    [minPointCost, pointCostDecrease, pointSellTax],
  );

  return useMemo(
    () => ({
      sell: {
        [EEmpire.Red]: getPointSaleValue(redEmpirePointCost),
        [EEmpire.Blue]: getPointSaleValue(blueEmpirePointCost),
        [EEmpire.Green]: getPointSaleValue(greenEmpirePointCost),
      },
      buy: {
        [EEmpire.Red]: redEmpirePointCost,
        [EEmpire.Blue]: blueEmpirePointCost,
        [EEmpire.Green]: greenEmpirePointCost,
      },
    }),
    [redEmpirePointCost, blueEmpirePointCost, greenEmpirePointCost, getPointSaleValue],
  );
};
