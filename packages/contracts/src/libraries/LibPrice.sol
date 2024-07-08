// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Faction, Player, P_PointConfig, P_PointConfigData, P_ActionConfig, P_ActionConfigData, ActionCost } from "codegen/index.sol";
import { EEmpire, EPlayerAction } from "codegen/common.sol";
import { OTHER_EMPIRE_COUNT } from "src/constants.sol";

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
    return getPointCost(_empireImpacted, OTHER_EMPIRE_COUNT);
  }

  /**
   * @dev Calculates the cost of purchasing points related to a regressive action. Points are purchased for all empires except the impacted empire.
   * @param _empireImpacted The empire impacted by the action.
   * @return pointCost The cost of all points related to the action.
   */
  function getRegressPointCost(EEmpire _empireImpacted) internal view returns (uint256) {
    uint256 pointCost;
    for (uint256 i = 1; i < uint256(EEmpire.LENGTH); i++) {
      if (i == uint256(_empireImpacted)) {
        continue;
      }
      pointCost += getPointCost(EEmpire(i), 1);
    }
    return pointCost;
  }

  /**
   * @dev Calculates the cost of a specific number of points for a specific empire.
   * @param _empire The empire to purchase points from.
   * @param _pointUnits The number of points.
   * @return pointCost The cost of the points from the specific empire.
   */
  function getPointCost(EEmpire _empire, uint256 _pointUnits) internal view returns (uint256) {
    require(_pointUnits > 0, "[LibPrice] Point units must be greater than 0");
    uint256 initPointCost = Faction.getPointCost(_empire);
    uint256 pointCostIncrease = P_PointConfig.getPointCostIncrease();
    uint256 pointCost = 0;
    for (uint256 i = 0; i < _pointUnits; i++) {
      pointCost += initPointCost + i * pointCostIncrease;
    }
    return pointCost;
  }

  /**
   * @dev Increases the cost of points for a specific empire.
   * @param _empire The empire to increase the point cost for.
   * @param _pointUnits The number of point units to increase the cost by.
   */
  function pointCostUp(EEmpire _empire, uint256 _pointUnits) internal {
    uint256 newPointCost = Faction.getPointCost(_empire) + P_PointConfig.getPointCostIncrease() * _pointUnits;
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
  function empirePointCostDown(EEmpire _empire) internal {
    P_PointConfigData memory config = P_PointConfig.get();
    uint256 newPointCost = Faction.getPointCost(_empire);
    if (newPointCost > config.minPointCost + config.pointGenRate) {
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
}
