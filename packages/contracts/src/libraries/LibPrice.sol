// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Empire, HistoricalPointCost, P_PointConfig, P_PointConfigData, P_GameConfig, P_OverrideConfig, P_OverrideConfigData, OverrideCost } from "codegen/index.sol";
import { EEmpire, EOverride } from "codegen/common.sol";

/**
 * @title LibPrice
 * @dev Library for calculating the cost of overrides and point units in the game.
 */
library LibPrice {
  /**
   * @dev Calculates the total cost of an override that is to be purchased.
   * @param _overrideType The type of override.
   * @param _empireImpacted The empire impacted by the override.
   * @param _overrideCount The number of overrides to be purchased.
   * @return totalCost The total cost of the override.
   */
  function getTotalCost(
    EOverride _overrideType,
    EEmpire _empireImpacted,
    uint256 _overrideCount
  ) internal view returns (uint256) {
    uint256 totalCost = 0;
    if (P_OverrideConfig.getIsProgressOverride(_overrideType)) {
      totalCost = getProgressPointCost(_overrideType, _empireImpacted, _overrideCount);
    } else {
      totalCost = getRegressPointCost(_overrideType, _empireImpacted, _overrideCount);
    }

    totalCost += getMarginalOverrideCost(_overrideType, _empireImpacted, _overrideCount);

    return totalCost;
  }

  /**
   * @dev Calculates the cost of purchasing multiple points related to a progressive override that aids an empire.
   * @param _overrideType The type of override.
   * @param _empireImpacted The empire impacted by the override.
   * @param _overrideCount The number of overrides to be purchased.
   * @return pointCost The cost of all points related to the override.
   */
  function getProgressPointCost(EOverride _overrideType, EEmpire _empireImpacted, uint256 _overrideCount) internal view returns (uint256) {
    uint8 empireCount = P_GameConfig.getEmpireCount();
    return getPointCost(_empireImpacted, _overrideCount * (empireCount - 1) * P_PointConfig.getPointUnit() * P_OverrideConfig.getPointMultiplier(_overrideType));
  }

  /**
   * @dev Calculates the cost of purchasing points related to a regressive override. Points are purchased for all empires except the impacted empire.
   * @param _overrideType The type of override.
   * @param _empireImpacted The empire impacted by the override.
   * @param _overrideCount The number of overrides to be purchased.
   * @return pointCost The cost of all points related to the override.
   */
  function getRegressPointCost(EOverride _overrideType, EEmpire _empireImpacted, uint256 _overrideCount) internal view returns (uint256) {
    uint256 pointCost;
    uint8 empireCount = P_GameConfig.getEmpireCount();
    for (uint8 i = 1; i <= empireCount; i++) {
      if (EEmpire(i) == _empireImpacted) {
        continue;
      }
      pointCost += getPointCost(EEmpire(i), _overrideCount * P_PointConfig.getPointUnit() * P_OverrideConfig.getPointMultiplier(_overrideType));
    }
    return pointCost;
  }

  /**
   * @dev Calculates the cost of a specific number of points for a specific empire.
   * @param _empire The empire to purchase points from.
   * @param _points The number of points. (in 1e18)
   * @return pointCost The cost of the points from the specific empire.
   */
  function getPointCost(EEmpire _empire, uint256 _points) internal view returns (uint256) {
    uint256 pointUnit = P_PointConfig.getPointUnit();
    require(_points > 0, "[LibPrice] Points must be greater than 0");
    require(_points % pointUnit == 0, "[LibPrice] Points must be a multiple of the point unit (1e18)");

    uint256 initPointCost = Empire.getPointCost(_empire);
    uint256 pointCostIncrease = P_PointConfig.getPointCostIncrease();
    uint256 wholePoints = _points / pointUnit;

    uint256 triangleSumOBO = ((wholePoints - 1) * wholePoints) / 2;
    uint256 pointCost = initPointCost * wholePoints + pointCostIncrease * triangleSumOBO;
    return pointCost;
  }

  /**
   * @dev Calculates the marginal cost of a specific number of overrides for a specific empire.
   * @param _overrideType The type of override.
   * @param _empire The empire being impacted.
   * @param _overrideCount The number of overrides.
   * @return overrideCost The marginal cost of the overrides that impact a specific empire.
   */
  function getMarginalOverrideCost(
    EOverride _overrideType,
    EEmpire _empire,
    uint256 _overrideCount
  ) internal view returns (uint256) {
    require(_overrideCount > 0, "[LibPrice] Override count must be greater than 0");

    uint256 initOverrideCost = OverrideCost.get(_empire, _overrideType);
    uint256 overrideCostIncrease = P_OverrideConfig.getOverrideCostIncrease(_overrideType);

    uint256 triangleSumOBO = ((_overrideCount - 1) * _overrideCount) / 2;
    uint256 overrideCost = initOverrideCost * _overrideCount + overrideCostIncrease * triangleSumOBO;

    return overrideCost;
  }

  /**
   * @dev Increases the cost of points for a specific empire.
   * @param _empire The empire to increase the point cost for.
   * @param _points The number of point units to increase the cost by.
   */
  function pointCostUp(EEmpire _empire, uint256 _points) internal {
    uint256 pointUnit = P_PointConfig.getPointUnit();
    require(_points > 0, "[LibPrice] Points must be greater than 0");
    require(_points % pointUnit == 0, "[LibPrice] Points must be a multiple of the point unit (1e18)");
    uint256 wholePoints = _points / pointUnit;

    uint256 newPointCost = Empire.getPointCost(_empire) + P_PointConfig.getPointCostIncrease() * wholePoints;
    Empire.setPointCost(_empire, newPointCost);
    HistoricalPointCost.set(_empire, block.timestamp, newPointCost);
  }

  /**
   * @dev Increases the cost of a specific override for a specific empire.
   * @param _empire The empire to increase the override cost for.
   * @param _overrideType The type of override to increase the cost for.
   * @param _overrideCount The number of overrides to increase the cost by.
   */
  function overrideCostUp(EEmpire _empire, EOverride _overrideType, uint256 _overrideCount) internal {
    require(_overrideCount > 0, "[LibPrice] Override count must be greater than 0");
    uint256 newOverrideCost = OverrideCost.get(_empire, _overrideType) +
      P_OverrideConfig.getOverrideCostIncrease(_overrideType) *
      _overrideCount;
    OverrideCost.set(_empire, _overrideType, newOverrideCost);
  }

  /**
   * @dev Decreases the cost of points for a specific empire.
   * @param _empire The empire to decrease the point cost for.
   */
  function turnEmpirePointCostDown(EEmpire _empire) internal {
    P_PointConfigData memory config = P_PointConfig.get();
    uint256 newPointCost = Empire.getPointCost(_empire);
    if (newPointCost >= config.minPointCost + config.pointGenRate) {
      newPointCost -= config.pointGenRate;
    } else {
      newPointCost = config.minPointCost;
    }
    Empire.setPointCost(_empire, newPointCost);
    HistoricalPointCost.set(_empire, block.timestamp, newPointCost);
  }

  /**
   * @dev Decreases the cost of all overrides that impact a specific empire.
   * @param _empireImpacted The empire to decrease the override costs for.
   */
  function empireOverridesCostDown(EEmpire _empireImpacted) internal {
    for (uint256 i = 1; i < uint256(EOverride.LENGTH); i++) {
      P_OverrideConfigData memory config = P_OverrideConfig.get(EOverride(i));
      uint256 newOverrideCost = OverrideCost.get(_empireImpacted, EOverride(i));
      if (newOverrideCost > config.minOverrideCost + config.overrideGenRate) {
        newOverrideCost -= config.overrideGenRate;
      } else {
        newOverrideCost = config.minOverrideCost;
      }
      OverrideCost.set(_empireImpacted, EOverride(i), newOverrideCost);
    }
  }

  /**
   * @dev Calculates the value of selling a specific number of points from a specific empire.
   * @notice The value of the points sold is calculated based on the current point cost and the point sell tax. Reverts if exceeding the minimum point cost.
   * @param _empire The empire to sell points from.
   * @param _points The number of points to sell.
   * @return pointSaleValue The value of the points to be sold.
   */
  function getPointSaleValue(EEmpire _empire, uint256 _points) internal view returns (uint256) {
    P_PointConfigData memory config = P_PointConfig.get();
    uint256 pointUnit = config.pointUnit;

    require(_points > 0, "[LibPrice] Points must be greater than 0");
    require(_points % pointUnit == 0, "[LibPrice] Points must be a multiple of the point unit (1e18)");
    uint256 wholePoints = _points / pointUnit;
    uint256 currentPointCost = Empire.getPointCost(_empire);
    uint256 pointCostDecrease = config.pointCostIncrease;

    require(
      currentPointCost >= config.minPointCost + pointCostDecrease * wholePoints,
      "[LibPrice] Selling points beyond minimum price"
    );

    uint256 triangleSum = (wholePoints * (wholePoints + 1)) / 2;
    uint256 totalSaleValue = (currentPointCost - config.pointSellTax) * wholePoints - pointCostDecrease * triangleSum;

    return totalSaleValue;
  }

  /**
   * @dev Decreases an empire's point cost by a specific number of point units.
   * @param _empire The empire for which the point cost is being decreased.
   * @param _points The number of point units to decrease the cost by.
   * @notice If the resulting point cost after the decrease is less than the minimum point cost, the function reverts with an error message.
   */
  function sellEmpirePointCostDown(EEmpire _empire, uint256 _points) internal {
    P_PointConfigData memory config = P_PointConfig.get();
    uint256 pointUnit = config.pointUnit;
    require(_points > 0, "[LibPrice] Points must be greater than 0");
    require(_points % pointUnit == 0, "[LibPrice] Points must be a multiple of the point unit (1e18)");
    uint256 wholePoints = _points / pointUnit;

    uint256 currentPointCost = Empire.getPointCost(_empire);
    uint256 pointCostDecrease = config.pointCostIncrease;

    if (currentPointCost >= config.minPointCost + pointCostDecrease * wholePoints) {
      uint256 newPointCost = currentPointCost - pointCostDecrease * wholePoints;
      Empire.setPointCost(_empire, newPointCost);
      HistoricalPointCost.set(_empire, block.timestamp, newPointCost);
    } else {
      revert("[LibPrice] Selling points beyond minimum price");
    }
  }
}
