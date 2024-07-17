// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Faction, Player, P_PointConfig, P_PointConfigData, P_ActionConfig, P_ActionConfigData, ActionCost } from "codegen/index.sol";
import { EEmpire, EPlayerAction } from "codegen/common.sol";
import { EMPIRE_COUNT } from "src/constants.sol";
import { console } from "forge-std/console.sol";

/**
 * @title LibPrice
 * @dev Library for calculating the cost of actions and point units in the game.
 */
library LibPrice {
  /**
   * @dev Calculates the total cost of an action that is to be purchased.
   * @param _actionType The type of action.
   * @param _empireImpacted The empire impacted by the action.
   * @param _progressAction Flag indicating whether the action is progressive or regressive to the impacted empire.
   * @return totalCost The total cost of the action.
   */
  function getTotalCost(
    EPlayerAction _actionType,
    EEmpire _empireImpacted,
    bool _progressAction
  ) internal view returns (uint256) {
    uint256 totalCost = 0;
    if (_progressAction) {
      require(_actionType == EPlayerAction.CreateDestroyer, "[LibPrice] Action type is not a progressive action");
      totalCost = getProgressPointCost(_empireImpacted);
    } else {
      require(_actionType == EPlayerAction.KillDestroyer, "[LibPrice] Action type is not a regressive action");
      totalCost = getRegressPointCost(_empireImpacted);
    }

    totalCost += ActionCost.get(_empireImpacted, _actionType);
    return totalCost;
  }

  /**
   * @dev Calculates the cost of purchasing multiple points related to a progressive action that aids an empire.
   * @param _empireImpacted The empire impacted by the action.
   * @return pointCost The cost of all points related to the action.
   */
  function getProgressPointCost(EEmpire _empireImpacted) internal view returns (uint256) {
    uint256 pointUnit = P_PointConfig.getPointUnit();
    return getPointCost(_empireImpacted, (EMPIRE_COUNT - 1) * pointUnit);
  }

  /**
   * @dev Calculates the cost of purchasing points related to a regressive action. Points are purchased for all empires except the impacted empire.
   * @param _empireImpacted The empire impacted by the action.
   * @return pointCost The cost of all points related to the action.
   */
  function getRegressPointCost(EEmpire _empireImpacted) internal view returns (uint256) {
    uint256 pointCost;
    uint256 pointUnit = P_PointConfig.getPointUnit();
    for (uint256 i = 1; i < uint256(EEmpire.LENGTH); i++) {
      if (i == uint256(_empireImpacted)) {
        continue;
      }
      pointCost += getPointCost(EEmpire(i), pointUnit);
    }
    return pointCost;
  }

  /**
   * @dev Calculates the cost of a specific number of points for a specific empire.
   * @param _empire The empire to purchase points from.
   * @param _points The number of points.
   * @return pointCost The cost of the points from the specific empire.
   */
  function getPointCost(EEmpire _empire, uint256 _points) internal view returns (uint256) {
    require(_points > 0, "[LibPrice] Point units must be greater than 0");
    uint256 initPointCost = Faction.getPointCost(_empire);
    uint256 pointCostIncrease = P_PointConfig.getPointCostIncrease();

    uint256 triangleSum = ((_points * (_points + 1)) / 2);
    uint256 unscaledPointCost = initPointCost + (triangleSum * pointCostIncrease);
    uint256 pointUnit = P_PointConfig.getPointUnit();
    require(unscaledPointCost >= pointUnit, "[LibPrice] Point cost is less than minimum point cost");
    return unscaledPointCost / pointUnit;
  }

  /**
   * @dev Increases the cost of points for a specific empire.
   * @param _empire The empire to increase the point cost for.
   * @param _points The number of point units to increase the cost by.
   */
  function pointCostUp(EEmpire _empire, uint256 _points) internal {
    uint256 newPointCost = (Faction.getPointCost(_empire) + (P_PointConfig.getPointCostIncrease() * _points)) /
      P_PointConfig.getPointUnit();
    Faction.setPointCost(_empire, newPointCost);
  }

  /**
   * @dev Increases the cost of a specific action for a specific empire.
   * @param _empire The empire to increase the action cost for.
   * @param _actionType The type of action to increase the cost for.
   */
  function actionCostUp(EEmpire _empire, EPlayerAction _actionType) internal {
    uint256 newActionCost = ActionCost.get(_empire, _actionType) + P_ActionConfig.getActionCostIncrease();
    ActionCost.set(_empire, _actionType, newActionCost);
  }

  /**
   * @dev Decreases the cost of points for a specific empire.
   * @param _empire The empire to decrease the point cost for.
   */
  function turnEmpirePointCostDown(EEmpire _empire) internal {
    P_PointConfigData memory config = P_PointConfig.get();
    uint256 newPointCost = Faction.getPointCost(_empire);
    if (newPointCost >= config.minPointCost + config.pointGenRate) {
      newPointCost -= config.pointGenRate;
    } else {
      newPointCost = config.minPointCost;
    }
    Faction.setPointCost(_empire, newPointCost);
  }

  /**
   * @dev Decreases the cost of all actions that impact a specific empire.
   * @param _empireImpacted The empire to decrease the action costs for.
   */
  function empirePlayerActionsCostDown(EEmpire _empireImpacted) internal {
    P_ActionConfigData memory config = P_ActionConfig.get();
    for (uint256 i = 1; i < uint256(EPlayerAction.LENGTH); i++) {
      uint256 newActionCost = ActionCost.get(_empireImpacted, EPlayerAction(i));
      if (newActionCost > config.minActionCost + config.actionGenRate) {
        newActionCost -= config.actionGenRate;
      } else {
        newActionCost = config.minActionCost;
      }
      ActionCost.set(_empireImpacted, EPlayerAction(i), newActionCost);
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
    uint256 pointCostDecrease = config.pointCostIncrease;
    uint256 currentPointCost = Faction.getPointCost(_empire);

    require(
      currentPointCost >= config.minPointCost + pointCostDecrease * _points,
      "[LibPrice] Selling points beyond minimum price"
    );

    uint256 triangleSum = (_points * (_points + 1)) / 2;
    uint256 totalSaleValue = (currentPointCost - config.pointSellTax) * _points - pointCostDecrease * triangleSum;

    return totalSaleValue;
  }

  /**
   * @dev Decreases an empire's point cost by a specific number of point units.
   * @param _empire The empire for which the point cost is being decreased.
   * @param _points The number of point units to decrease the cost by.
   * @notice If the resulting point cost after the decrease is less than the minimum point cost, the function reverts with an error message.
   */
  function sellEmpirePointCostDown(EEmpire _empire, uint256 _points) internal {
    uint256 currentPointCost = Faction.getPointCost(_empire);
    uint256 pointCostDecrease = P_PointConfig.getPointCostIncrease();
    if (currentPointCost >= P_PointConfig.getMinPointCost() + pointCostDecrease * _points) {
      Faction.setPointCost(_empire, currentPointCost - pointCostDecrease * _points);
    } else {
      revert("[LibPrice] Selling points beyond minimum price");
    }
  }
}
