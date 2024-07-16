// function getPointSaleValue(EEmpire _empire, uint256 _pointUnits) internal view returns (uint256) {
//   uint256 pointSaleValue;
//   P_PointConfigData memory config = P_PointConfig.get();
//   uint256 pointCostDecrease = config.pointCostIncrease;
//   uint256 currentPointCost = Faction.getPointCost(_empire);
//   for (uint256 i = 0; i < _pointUnits; i++) {
//     if (currentPointCost >= config.minPointCost + pointCostDecrease) {
//       currentPointCost -= pointCostDecrease;
//       pointSaleValue += currentPointCost - config.pointSellTax;
//     } else {
//       revert("[LibPrice] Selling points beyond minimum price");
//     }
//   }
//   return pointSaleValue;
// }

import { useCallback, useMemo } from "react";

import { EEmpire, POINTS_UNIT } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";

export const usePointPrice = () => {
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
      return undefined;
    },
    [minPointCost, pointCostDecrease, pointSellTax],
  );

  return useMemo(
    () => ({
      [EEmpire.Red]: getPointSaleValue(redEmpirePointCost),
      [EEmpire.Blue]: getPointSaleValue(blueEmpirePointCost),
      [EEmpire.Green]: getPointSaleValue(greenEmpirePointCost),
    }),
    [redEmpirePointCost, blueEmpirePointCost, greenEmpirePointCost, getPointSaleValue],
  );
};
