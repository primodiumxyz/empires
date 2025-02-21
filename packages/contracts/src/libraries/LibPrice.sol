// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Empire, HistoricalPointPrice, P_PointConfig, P_PointConfigData, P_GameConfig, P_OverrideConfig, P_OverrideConfigData, OverrideCost } from "codegen/index.sol";
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
  function getProgressPointCost(
    EOverride _overrideType,
    EEmpire _empireImpacted,
    uint256 _overrideCount
  ) internal view returns (uint256) {
    uint8 empireCount = P_GameConfig.getEmpireCount();
    uint8 enemiesCount;
    for (uint8 i = 1; i <= empireCount; i++) {
      if (EEmpire(i) != _empireImpacted && !Empire.getIsDefeated(EEmpire(i))) {
        enemiesCount++;
      }
    }

    return
      getPointCost(
        _empireImpacted,
        _overrideCount *
          enemiesCount *
          P_PointConfig.getPointUnit() *
          P_OverrideConfig.getPointMultiplier(_overrideType)
      );
  }

  /**
   * @dev Calculates the cost of purchasing points related to a regressive override. Points are purchased for all empires except the impacted empire.
   * @param _overrideType The type of override.
   * @param _empireImpacted The empire impacted by the override.
   * @param _overrideCount The number of overrides to be purchased.
   * @return pointCost The cost of all points related to the override.
   */
  function getRegressPointCost(
    EOverride _overrideType,
    EEmpire _empireImpacted,
    uint256 _overrideCount
  ) internal view returns (uint256) {
    uint256 pointCost;
    uint8 empireCount = P_GameConfig.getEmpireCount();
    for (uint8 i = 1; i <= empireCount; i++) {
      if (EEmpire(i) == _empireImpacted || Empire.getIsDefeated(EEmpire(i))) {
        continue;
      }
      pointCost += getPointCost(
        EEmpire(i),
        _overrideCount * P_PointConfig.getPointUnit() * P_OverrideConfig.getPointMultiplier(_overrideType)
      );
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
    if (Empire.getIsDefeated(_empire)) {
      return 0; // needed for regressive override cases
    }

    uint256 initPointPrice = Empire.getPointPrice(_empire);
    uint256 pointPriceIncrease = P_PointConfig.getPointPriceIncrease();
    uint256 wholePoints = _points / pointUnit;

    uint256 triangleSumOBO = ((wholePoints - 1) * wholePoints) / 2;
    uint256 pointCost = initPointPrice * wholePoints + pointPriceIncrease * triangleSumOBO;
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
   * @dev Increases the price of points for a specific empire.
   * @param _empire The empire to increase the point price for.
   * @param _points The number of point units to increase the price by.
   */
  function pointPriceUp(EEmpire _empire, uint256 _points) internal {
    uint256 pointUnit = P_PointConfig.getPointUnit();
    require(_points > 0, "[LibPrice] Points must be greater than 0");
    require(_points % pointUnit == 0, "[LibPrice] Points must be a multiple of the point unit (1e18)");
    if (Empire.getIsDefeated(_empire)) {
      return; // needed for regressive override cases
    }
    uint256 wholePoints = _points / pointUnit;

    uint256 newPointPrice = Empire.getPointPrice(_empire) + P_PointConfig.getPointPriceIncrease() * wholePoints;
    Empire.setPointPrice(_empire, newPointPrice);
    HistoricalPointPrice.set(_empire, block.timestamp, newPointPrice);
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
   * @dev Decreases the price of points for a specific empire.
   * @param _empire The empire to decrease the point price for.
   */
  function turnEmpirePointPriceDown(EEmpire _empire) internal {
    P_PointConfigData memory config = P_PointConfig.get();
    uint256 newPointPrice = Empire.getPointPrice(_empire);
    if (newPointPrice >= config.minPointPrice + config.pointGenRate) {
      newPointPrice -= config.pointGenRate;
    } else {
      newPointPrice = config.minPointPrice;
    }
    Empire.setPointPrice(_empire, newPointPrice);
    HistoricalPointPrice.set(_empire, block.timestamp, newPointPrice);
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
   * @notice The value of the points sold is calculated based on the current point price and the point sell tax. Reverts if exceeding the minimum point price.
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
    uint256 currentPointPrice = Empire.getPointPrice(_empire);
    uint256 pointPriceDecrease = config.pointPriceIncrease;

    require(
      currentPointPrice >= config.minPointPrice + pointPriceDecrease * wholePoints,
      "[LibPrice] Selling points beyond minimum price"
    );

    uint256 triangleSum = (wholePoints * (wholePoints + 1)) / 2;
    uint256 totalSaleValue = ((currentPointPrice * wholePoints - pointPriceDecrease * triangleSum) *
      (10000 - config.pointSellTax)) / 10000;

    return totalSaleValue;
  }

  /**
   * @dev Decreases an empire's point price by a specific number of point units.
   * @param _empire The empire for which the point price is being decreased.
   * @param _points The number of point units to decrease the price by.
   * @notice If the resulting point price after the decrease is less than the minimum point price, the function reverts with an error message.
   */
  function sellEmpirePointPriceDown(EEmpire _empire, uint256 _points) internal {
    P_PointConfigData memory config = P_PointConfig.get();
    uint256 pointUnit = config.pointUnit;
    require(_points > 0, "[LibPrice] Points must be greater than 0");
    require(_points % pointUnit == 0, "[LibPrice] Points must be a multiple of the point unit (1e18)");
    uint256 wholePoints = _points / pointUnit;

    uint256 currentPointPrice = Empire.getPointPrice(_empire);
    uint256 pointPriceDecrease = config.pointPriceIncrease;

    if (currentPointPrice >= config.minPointPrice + pointPriceDecrease * wholePoints) {
      uint256 newPointPrice = currentPointPrice - pointPriceDecrease * wholePoints;
      Empire.setPointPrice(_empire, newPointPrice);
      HistoricalPointPrice.set(_empire, block.timestamp, newPointPrice);
    } else {
      revert("[LibPrice] Selling points beyond minimum price");
    }
  }
}
