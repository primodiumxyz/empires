import { useMemo } from "react";

import { EEmpire, POINTS_UNIT } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";

export const usePointPrice = (empire: EEmpire, points: bigint): bigint => {
  const { tables } = useCore();

  const config = tables.P_PointConfig.use();
  const pointCostDecrease = config?.pointCostIncrease ?? BigInt(POINTS_UNIT * 0.01);
  const minPointCost = config?.minPointCost ?? BigInt(POINTS_UNIT * 0.01);
  const pointSellTax = config?.pointSellTax ?? 0n;

  const empirePointCost = tables.Faction.useWithKeys({ id: empire })?.pointCost ?? BigInt(0);

  return useMemo(() => {
    const pointCostDecrease = config?.pointCostIncrease ?? 0n;
    const currentPointCost = tables.Faction.getWithKeys({ id: empire })?.pointCost ?? 0n;
    const triangleSum = (points * (points + 1n)) / 2n;
    const totalSaleValue = (currentPointCost - (config?.pointSellTax ?? 0n)) * points - pointCostDecrease * triangleSum;

    const sell = totalSaleValue;
    const buy = empirePointCost;
    if (currentPointCost >= minPointCost + pointCostDecrease) {
      return sell;
    }
    return BigInt(0);
  }, [minPointCost, pointCostDecrease, pointSellTax, empire, points]);
};
