import { useMemo } from "react";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";

export const usePointPrice = (empire: EEmpire, points: number): { price: bigint; message: string } => {
  const { tables } = useCore();

  const currentPointCost = tables.Faction.useWithKeys({ id: empire })?.pointCost ?? 0n;
  const config = tables.P_PointConfig.use();
  return useMemo(() => {
    if (!config || currentPointCost == 0n || points == 0) {
      return { price: 0n, message: "" };
    }

    const pointsBigInt = BigInt(points);
    const pointCostDecrease = config?.pointCostIncrease ?? 0n;

    if (currentPointCost < (config?.minPointCost ?? 0n) + pointCostDecrease * pointsBigInt) {
      return { price: 0n, message: "Insufficient point cost" };
    }

    const triangleSum = (pointsBigInt * (pointsBigInt + 1n)) / 2n;
    const totalSaleValue =
      (currentPointCost - (config?.pointSellTax ?? 0n)) * pointsBigInt - pointCostDecrease * triangleSum;

    return { price: totalSaleValue, message: "" };
  }, [empire, currentPointCost, config, points]);
};
