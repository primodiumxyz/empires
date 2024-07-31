import { formatEther } from "viem";
import { EEmpire, EOverride } from "@primodiumxyz/contracts/config/enums";

import { Tables } from "@core/lib";

const OTHER_EMPIRE_COUNT = EEmpire.LENGTH - 2;

export function createPriceUtils(tables: Tables) {
  function getTotalCost(
    _actionType: EOverride,
    _empireImpacted: EEmpire,
    _actionCount: bigint,
    nextTurn = false,
  ): bigint {
    const progressAction = [EOverride.CreateShip, EOverride.ChargeShield].includes(_actionType);
    let totalCost = 0n;

    if (progressAction) {
      totalCost = getProgressPointCost(_empireImpacted, _actionCount, nextTurn);
    } else {
      totalCost = getRegressPointCost(_empireImpacted, _actionCount, nextTurn);
    }

    totalCost += getMarginalActionCost(_actionType, _empireImpacted, progressAction, _actionCount, nextTurn);

    return totalCost;
  }

  /**
   * @dev Calculates the cost of purchasing multiple points related to a progressive action that aids an empire.
   * @param _empireImpacted The empire impacted by the action.
   * @return pointCost The cost of all points related to the action.
   */
  function getProgressPointCost(_empireImpacted: EEmpire, _actionCount: bigint, nextTurn = false): bigint {
    return getPointCost(
      _empireImpacted,
      _actionCount * BigInt(OTHER_EMPIRE_COUNT) * (tables.P_PointConfig.get()?.pointUnit ?? 1n),
      nextTurn,
    );
  }

  /**
   * @dev Calculates the cost of purchasing points related to a regressive action. Points are purchased for all empires except the impacted empire.
   * @param _empireImpacted The empire impacted by the action.
   * @return pointCost The cost of all points related to the action.
   */
  function getRegressPointCost(_empireImpacted: EEmpire, _actionCount: bigint, nextTurn = false): bigint {
    let pointCost = 0n;
    for (let i = 1; i < EEmpire.LENGTH; i++) {
      if (i == _empireImpacted) {
        continue;
      }
      pointCost += getPointCost(i, _actionCount * (tables.P_PointConfig.get()?.pointUnit ?? 1n), nextTurn);
    }

    return pointCost;
  }

  /**
   * @dev Calculates the cost of a specific number of points for a specific empire.
   * @param _empire The empire to purchase points from.
   * @param _points The number of points.
   * @return pointCost The cost of the points from the specific empire.
   */
  function getPointCost(_empire: EEmpire, _points: bigint, nextTurn = false): bigint {
    if (nextTurn) return getNextTurnPointCost(_empire, _points);

    const pointUnit = tables.P_PointConfig.get()?.pointUnit ?? 1n;

    const initPointCost = tables.Empire.getWithKeys({ id: _empire })?.pointCost ?? 0n;
    const pointCostIncrease = tables.P_PointConfig.get()?.pointCostIncrease ?? 0n;
    const wholePoints = _points / pointUnit;

    const triangleSumOBO = ((wholePoints - 1n) * wholePoints) / 2n;
    const pointCost = initPointCost * wholePoints + pointCostIncrease * triangleSumOBO;
    return pointCost;
  }

  function getNextTurnPointCost(_empire: EEmpire, _points: bigint): bigint {
    const pointUnit = tables.P_PointConfig.get()?.pointUnit ?? 1n;
    const config = tables.P_PointConfig.get();
    const currentPointCost = tables.Empire.getWithKeys({ id: _empire })?.pointCost ?? 0n;
    const minPointCost = config?.minPointCost ?? 0n;
    const pointGenRate = config?.pointGenRate ?? 0n;

    let nextTurnPointCost = currentPointCost;
    if (nextTurnPointCost >= minPointCost + pointGenRate) {
      nextTurnPointCost -= pointGenRate;
    } else {
      nextTurnPointCost = minPointCost;
    }

    const pointCostIncrease = config?.pointCostIncrease ?? 0n;
    const wholePoints = _points / pointUnit;

    const triangleSumOBO = ((wholePoints - 1n) * wholePoints) / 2n;
    const pointCost = nextTurnPointCost * wholePoints + pointCostIncrease * triangleSumOBO;
    return pointCost;
  }

  /**
   * @dev Calculates the marginal cost of a specific number of actions for a specific empire.
   * @param _empire The empire being impacted.
   * @param _actionType The type of action.
   * @param _progressAction Flag indicating whether the action is progressive or regressive to the impacted empire.
   * @param _actionCount The number of actions.
   * @return actionCost The marginal cost of the actions that impact a specific empire.
   */
  function getMarginalActionCost(
    _actionType: EOverride,
    _empireImpacted: EEmpire,
    _progressAction: boolean,
    _actionCount: bigint,
    nextTurn = false,
  ): bigint {
    if (nextTurn) return getNextTurnMarginalActionCost(_actionType, _empireImpacted, _actionCount);

    const initActionCost =
      tables.OverrideCost.getWithKeys({ empireId: _empireImpacted, overrideAction: _actionType })?.value ?? 0n;
    const actionCostIncrease = tables.P_OverrideConfig.get()?.overrideCostIncrease ?? 0n;

    const triangleSumOBO = ((_actionCount - 1n) * _actionCount) / 2n;
    const actionCost = initActionCost * _actionCount + triangleSumOBO * actionCostIncrease;

    return actionCost;
  }

  function getNextTurnMarginalActionCost(
    _actionType: EOverride,
    _empireImpacted: EEmpire,
    _actionCount: bigint,
  ): bigint {
    const config = tables.P_OverrideConfig.get();
    let currentOverrideCost =
      tables.OverrideCost.getWithKeys({ empireId: _empireImpacted, overrideAction: _actionType })?.value ?? 0n;
    const minOverrideCost = config?.minOverrideCost ?? 0n;
    const overrideGenRate = config?.overrideGenRate ?? 0n;

    if (currentOverrideCost > minOverrideCost + overrideGenRate) {
      currentOverrideCost -= overrideGenRate;
    } else {
      currentOverrideCost = minOverrideCost;
    }

    const overrideCostIncrease = config?.overrideCostIncrease ?? 0n;

    const triangleSumOBO = ((_actionCount - 1n) * _actionCount) / 2n;
    const actionCost = currentOverrideCost * _actionCount + overrideCostIncrease * triangleSumOBO;

    return actionCost;
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
    getNextTurnPointCost,
    getNextTurnMarginalActionCost,
    weiToUsd,
    usdToWei,
  };
}
