import { formatEther } from "viem";
import { EEmpire, EPlayerAction } from "@primodiumxyz/contracts/config/enums";

import { Tables } from "@core/lib";

const OTHER_EMPIRE_COUNT = EEmpire.LENGTH - 2;

export function createPriceUtils(tables: Tables) {
  function getTotalCost(_actionType: EPlayerAction, _empireImpacted: EEmpire): bigint {
    const progressAction = [EPlayerAction.CreateShip, EPlayerAction.ChargeShield].includes(_actionType);
    let totalCost = 0n;
    const actionCost = tables.ActionCost.getWithKeys({ empireId: _empireImpacted, action: _actionType })?.value ?? 0n;

    if (progressAction) {
      totalCost = getProgressPointCost(_empireImpacted);
      totalCost += actionCost;
    } else {
      totalCost = getRegressPointCost(_empireImpacted);
      totalCost += (actionCost * (tables.P_ActionConfig.get()?.regressMultiplier ?? 0n)) / 10000n;
    }

    return totalCost;
  }

  /**
   * @dev Calculates the cost of purchasing multiple points related to a progressive action that aids an empire.
   * @param _empireImpacted The empire impacted by the action.
   * @return pointCost The cost of all points related to the action.
   */
  function getProgressPointCost(_empireImpacted: EEmpire): bigint {
    return getPointCost(_empireImpacted, OTHER_EMPIRE_COUNT);
  }

  /**
   * @dev Calculates the cost of purchasing points related to a regressive action. Points are purchased for all empires except the impacted empire.
   * @param _empireImpacted The empire impacted by the action.
   * @return pointCost The cost of all points related to the action.
   */
  function getRegressPointCost(_empireImpacted: EEmpire): bigint {
    let pointCost = 0n;
    for (let i = 1; i < EEmpire.LENGTH; i++) {
      if (i == _empireImpacted) {
        continue;
      }
      pointCost += getPointCost(i, 1);
    }

    return pointCost;
  }

  /**
   * @dev Calculates the cost of a specific number of points for a specific empire.
   * @param _empire The empire to purchase points from.
   * @param _pointUnits The number of points.
   * @return pointCost The cost of the points from the specific empire.
   */
  function getPointCost(_empire: EEmpire, _pointUnits: number): bigint {
    const initPointCost = tables.Empire.getWithKeys({ id: _empire })?.pointCost ?? 0n;
    const pointCostIncrease = tables.P_PointConfig.get()?.pointCostIncrease ?? 0n;
    let pointCost = 0n;
    for (let i = 0; i < _pointUnits; i++) {
      pointCost += initPointCost + BigInt(i) * pointCostIncrease;
    }
    return pointCost;
  }

  function weiToUsd<N extends boolean = false>(
    wei: bigint,
    weiToUsd: number,
    asNumber?: N,
  ): N extends true ? number : string {
    const balance = Number(formatEther(wei));
    if (isNaN(balance))
      return asNumber ? (0 as N extends true ? number : string) : ("0.00" as N extends true ? number : string);
    const balanceInUsd = balance * weiToUsd;
    if (asNumber) return balanceInUsd as N extends true ? number : string;
    return balanceInUsd.toLocaleString("en-US", { style: "currency", currency: "USD" }) as N extends true
      ? number
      : string;
  }

  function usdToWei(USD: number, weiToUsd: number): bigint {
    return BigInt(USD / weiToUsd);
  }

  return {
    getTotalCost,
    getProgressPointCost,
    getRegressPointCost,
    getPointCost,
    weiToUsd,
    usdToWei,
  };
}
