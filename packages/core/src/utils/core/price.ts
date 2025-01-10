import { formatEther, parseEther } from "viem";
import { EEmpire, EOverride } from "@primodiumxyz/contracts/config/enums";

import { PRICE_PRECISION, Tables } from "@core/lib";

export function createPriceUtils(tables: Tables) {
  function getTotalCost(
    _overrideType: EOverride,
    _empireImpacted: EEmpire,
    _overrideCount: bigint,
    nextTurn = false,
  ): bigint {
    let totalCost = 0n;

    if (tables.P_OverrideConfig.getWithKeys({ overrideAction: _overrideType })?.isProgressOverride) {
      totalCost = getProgressPointCost(_overrideType, _empireImpacted, _overrideCount, nextTurn);
    } else {
      totalCost = getRegressPointCost(_overrideType, _empireImpacted, _overrideCount, nextTurn);
    }

    totalCost += getMarginalOverrideCost(_overrideType, _empireImpacted, _overrideCount, nextTurn);

    return totalCost;
  }

  /**
   * @dev Calculates the cost of purchasing multiple points related to a progressive action that aids an empire.
   * @param _overrideType The type of override.
   * @param _empireImpacted The empire impacted by the action.
   * @param _overrideCount The number of actions.
   * @param nextTurn Whether to calculate the cost for the next turn.
   * @return pointCost The cost of all points related to the action.
   */
  function getProgressPointCost(
    _overrideType: EOverride,
    _empireImpacted: EEmpire,
    _overrideCount: bigint,
    nextTurn = false,
  ): bigint {
    const empires = tables.P_GameConfig.get()?.empireCount ?? 0;
    const pointUnit = tables.P_PointConfig.get()?.pointUnit ?? 1n;
    const pointMultiplier =
      tables.P_OverrideConfig.getWithKeys({ overrideAction: _overrideType })?.pointMultiplier ?? 1n;
    return getPointCost(_empireImpacted, _overrideCount * BigInt(empires - 1) * pointUnit * pointMultiplier, nextTurn);
  }

  /**
   * @dev Calculates the cost of purchasing points related to a regressive action. Points are purchased for all empires except the impacted empire.
   * @param _overrideType The type of override.
   * @param _empireImpacted The empire impacted by the action.
   * @param _overrideCount The number of actions.
   * @param nextTurn Whether to calculate the cost for the next turn.
   * @return pointCost The cost of all points related to the action.
   */
  function getRegressPointCost(
    _overrideType: EOverride,
    _empireImpacted: EEmpire,
    _overrideCount: bigint,
    nextTurn = false,
  ): bigint {
    const empires = tables.P_GameConfig.get()?.empireCount ?? 0;
    const pointUnit = tables.P_PointConfig.get()?.pointUnit ?? 1n;
    const pointMultiplier =
      tables.P_OverrideConfig.getWithKeys({ overrideAction: _overrideType })?.pointMultiplier ?? 1n;
    const empireIsDefeated =
      (_empireImpacted !== EEmpire.NULL && tables.Empire.getWithKeys({ id: _empireImpacted })?.isDefeated) ?? false;
    let pointCost = 0n;
    for (let i = 1; i <= empires; i++) {
      if (i === _empireImpacted || empireIsDefeated) {
        continue;
      }
      pointCost += getPointCost(i, _overrideCount * pointUnit * pointMultiplier, nextTurn);
    }

    return pointCost;
  }

  /**
   * @dev Calculates the cost of a specific number of points for a specific empire.
   * @param _empire The empire to purchase points from.
   * @param _points The number of points.
   * @param nextTurn Whether to calculate the cost for the next turn.
   * @return pointCost The cost of the points from the specific empire.
   */
  function getPointCost(_empire: EEmpire, _points: bigint, nextTurn = false): bigint {
    if (nextTurn) return getNextTurnPointCost(_empire, _points);
    const empireIsDefeated = tables.Empire.getWithKeys({ id: _empire })?.isDefeated ?? false;
    if (empireIsDefeated) return 0n;

    const pointUnit = tables.P_PointConfig.get()?.pointUnit ?? 1n;

    const initPointPrice = tables.Empire.getWithKeys({ id: _empire })?.pointPrice ?? 0n;
    const pointPriceIncrease = tables.P_PointConfig.get()?.pointPriceIncrease ?? 0n;
    const wholePoints = _points / pointUnit;

    const triangleSumOBO = ((wholePoints - 1n) * wholePoints) / 2n;
    const pointCost = initPointPrice * wholePoints + pointPriceIncrease * triangleSumOBO;
    return pointCost;
  }

  function getNextTurnPointCost(_empire: EEmpire, _points: bigint): bigint {
    const empireIsDefeated = tables.Empire.getWithKeys({ id: _empire })?.isDefeated ?? false;
    if (empireIsDefeated) return 0n;

    const pointUnit = tables.P_PointConfig.get()?.pointUnit ?? 1n;
    const config = tables.P_PointConfig.get();
    const currentPointPrice = tables.Empire.getWithKeys({ id: _empire })?.pointPrice ?? 0n;
    const minPointPrice = config?.minPointPrice ?? 0n;
    const pointGenRate = config?.pointGenRate ?? 0n;

    let nextTurnPointPrice = currentPointPrice;
    if (nextTurnPointPrice >= minPointPrice + pointGenRate) {
      nextTurnPointPrice -= pointGenRate;
    } else {
      nextTurnPointPrice = minPointPrice;
    }

    const pointPriceIncrease = config?.pointPriceIncrease ?? 0n;
    const wholePoints = _points / pointUnit;

    const triangleSumOBO = ((wholePoints - 1n) * wholePoints) / 2n;
    const pointCost = nextTurnPointPrice * wholePoints + pointPriceIncrease * triangleSumOBO;
    return pointCost;
  }

  /**
   * @dev Calculates the marginal cost of a specific number of actions for a specific empire.
   * @param _empire The empire being impacted.
   * @param _overrideType The type of action.
   * @param _overrideCount The number of actions.
   * @param nextTurn Whether to calculate the cost for the next turn.
   * @return overrideCost The marginal cost of the actions that impact a specific empire.
   */
  function getMarginalOverrideCost(
    _overrideType: EOverride,
    _empireImpacted: EEmpire,
    _overrideCount: bigint,
    nextTurn = false,
  ): bigint {
    if (nextTurn) return getNextTurnMarginalOverrideCost(_overrideType, _empireImpacted, _overrideCount);

    const initOverrideCost =
      tables.OverrideCost.getWithKeys({ empireId: _empireImpacted, overrideAction: _overrideType })?.value ?? 0n;
    const overrideCostIncrease =
      tables.P_OverrideConfig.getWithKeys({ overrideAction: _overrideType })?.overrideCostIncrease ?? 0n;

    const triangleSumOBO = ((_overrideCount - 1n) * _overrideCount) / 2n;
    const overrideCost = initOverrideCost * _overrideCount + triangleSumOBO * overrideCostIncrease;

    return overrideCost;
  }

  function getNextTurnMarginalOverrideCost(
    _overrideType: EOverride,
    _empireImpacted: EEmpire,
    _overrideCount: bigint,
  ): bigint {
    let currentOverrideCost =
      tables.OverrideCost.getWithKeys({ empireId: _empireImpacted, overrideAction: _overrideType })?.value ?? 0n;
    const overrideConfig = tables.P_OverrideConfig.getWithKeys({ overrideAction: _overrideType });
    const minOverrideCost = overrideConfig?.minOverrideCost ?? 0n;
    const overrideGenRate = overrideConfig?.overrideGenRate ?? 0n;
    const overrideCostIncrease = overrideConfig?.overrideCostIncrease ?? 0n;

    if (currentOverrideCost > minOverrideCost + overrideGenRate) {
      currentOverrideCost -= overrideGenRate;
    } else {
      currentOverrideCost = minOverrideCost;
    }

    const triangleSumOBO = ((_overrideCount - 1n) * _overrideCount) / 2n;
    const overrideCost = currentOverrideCost * _overrideCount + overrideCostIncrease * triangleSumOBO;

    return overrideCost;
  }

  function weiToUsd(wei: bigint, weiToUsd: number, options?: { precision?: number }): string {
    const { precision = PRICE_PRECISION } = options ?? {};
    const balance = Number(formatEther(wei));
    if (isNaN(balance)) return "$0.00";
    const balanceInUsd = balance * weiToUsd;

    const maxPrecision = Math.abs(balanceInUsd) < 0.01 ? precision : 2;

    return balanceInUsd.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: maxPrecision,
    });
  }

  function usdToWei(USD: number, weiToUsd: number): bigint {
    return parseEther((USD / (weiToUsd || 1)).toString());
  }
  const getPointPrice = (empire: EEmpire, points: number | bigint): { price: bigint; message: string } => {
    const currentPointPrice = tables.Empire.getWithKeys({ id: empire })?.pointPrice ?? 0n;
    const config = tables.P_PointConfig.get();
    const pointsBigInt = BigInt(points);
    if (!config || currentPointPrice == 0n || pointsBigInt == 0n) {
      return { price: 0n, message: "" };
    }

    const pointPriceIncrease = config?.pointPriceIncrease ?? 0n;

    if (currentPointPrice < (config?.minPointPrice ?? 0n) + pointPriceIncrease * pointsBigInt) {
      return { price: 0n, message: "Selling beyond min price" };
    }

    const triangleSum = (pointsBigInt * (pointsBigInt + 1n)) / 2n;
    const totalSaleValue =
      ((currentPointPrice * pointsBigInt - pointPriceIncrease * triangleSum) *
        (10000n - (config?.pointSellTax ?? 0n))) /
      10000n;

    return { price: totalSaleValue, message: "" };
  };

  /**
   * @dev Calculates the sum of maximum value to collect from selling points across all empires.
   * @returns The total maximum sell value.
   * @notice This is useful for calculating the guaranteed pot value with currentPot - totalMaxSellValue
   */
  function getTotalMaxSellValue(): bigint {
    const config = tables.P_PointConfig.get();
    if (!config) return 0n;

    const pointPriceIncrease = config.pointPriceIncrease;
    const empireCount = tables.P_GameConfig.get()?.empireCount ?? 0;

    let totalMaxSellValue = 0n;

    for (let i = 1; i <= empireCount; i++) {
      const empire = i as EEmpire;
      const currentPointPrice = tables.Empire.getWithKeys({ id: empire })?.pointPrice ?? 0n;
      const pointsIssued = tables.Empire.getWithKeys({ id: empire })?.pointsIssued ?? 0n;

      // Calculate the maximum number of whole points that can be sold
      const maxWholePoints = (currentPointPrice - config.minPointPrice) / pointPriceIncrease;
      const pointsToSell = pointsIssued > maxWholePoints ? maxWholePoints : pointsIssued;
      if (pointsToSell > 0n) {
        const empireSellValue = getPointPrice(empire, Number(pointsToSell)).price;
        totalMaxSellValue += empireSellValue;
      }
    }

    return totalMaxSellValue;
  }

  return {
    getTotalCost,
    getProgressPointCost,
    getRegressPointCost,
    getPointCost,
    getNextTurnPointCost,
    getNextTurnMarginalOverrideCost,
    weiToUsd,
    usdToWei,
    getPointPrice,
    getTotalMaxSellValue,
  };
}
