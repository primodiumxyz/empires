import { useMemo } from "react";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";

export const usePointPrice = (empire: EEmpire, points: number): { price: bigint; message: string } => {
  const { tables } = useCore();

  const currentPointPrice = tables.Empire.useWithKeys({ id: empire })?.pointPrice ?? 0n;
  const config = tables.P_PointConfig.use();
  return useMemo(() => {
    if (!config || currentPointPrice == 0n || points == 0) {
      return { price: 0n, message: "" };
    }

    const pointsBigInt = BigInt(points);
    const pointPriceIncrease = config?.pointPriceIncrease ?? 0n;

    if (currentPointPrice < (config?.minPointPrice ?? 0n) + pointPriceIncrease * pointsBigInt) {
      return { price: 0n, message: "Beyond min price" };
    }

    const triangleSum = (pointsBigInt * (pointsBigInt + 1n)) / 2n;
    const totalSaleValue =
      (currentPointPrice * pointsBigInt - pointPriceIncrease * triangleSum) * (10000n - (config?.pointSellTax ?? 0n)) / 10000n;

    return { price: totalSaleValue, message: "" };
  }, [empire, currentPointPrice, config, points]);
};
