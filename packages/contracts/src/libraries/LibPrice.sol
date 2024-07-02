// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Faction, Player, P_GameConfig, P_GameConfigData, ActionCost } from "codegen/index.sol";
import { EEmpire, EAction } from "codegen/common.sol";

library LibPrice {
    function getTotalCost(EAction _actionType, EEmpire _empireImpacted, bool _progressAction) internal view returns (uint256) {
        uint256 totalCost = 0;
        if (_progressAction) {
            require(_actionType == EAction.CreateDestroyer, "[LibPrice] Action type is not a progressive action");
            totalCost = getProgressPointCost(_empireImpacted);
        } else {
            require(_actionType == EAction.KillDestroyer, "[LibPrice] Action type is not a regressive action");
            totalCost = getRegressPointCost(_empireImpacted);
        }

        totalCost += ActionCost.get(_empireImpacted, _actionType);
        return totalCost;
    }

    // Gets the cost of the impacted empires points, iterated by EEmpire.LENGTH - 1
    function getProgressPointCost(EEmpire _empireImpacted) internal view returns (uint256) {
        return getPointCost(_empireImpacted, uint256(EEmpire.LENGTH) - 1);
    }

    // Gets the cost of a single point of each unimpacted empire
    // Iterates through each empire except the impacted one.
    function getRegressPointCost(EEmpire _empireImpacted) internal view returns (uint256) {
        uint256 pointCost;
        for(uint256 i = 0; i < uint256(EEmpire.LENGTH); i++) {
            if (i == uint256(_empireImpacted)) {
                continue;
            }
            pointCost += getPointCost(EEmpire(i), 1);
        }
        return pointCost;
    }

    // Gets the cost of a specific empire's points, for a given amount
    function getPointCost(EEmpire _empireImpacted, uint256 _pointUnits) internal view returns (uint256) {
        require(_pointUnits > 0, "[LibPrice] Point units must be greater than 0");
        uint256 initPointCost = Faction.getPointCost(_empireImpacted);
        uint256 pointCostIncrease = P_GameConfig.getPointCostIncrease();
        uint256 pointCost = 0;
        for(uint256 i = 0; i < _pointUnits; i++) {
            pointCost += initPointCost + i * pointCostIncrease;
        }
        return pointCost;
    }

    function pointCostUp(EEmpire _empire, uint256 _pointUnits) internal {
        uint256 newPointCost = Faction.getPointCost(_empire) + P_GameConfig.getPointCostIncrease() * _pointUnits;
        Faction.setPointCost(_empire, newPointCost);
    }

    function actionCostUp(EEmpire _empire, EAction _actionType) internal {
        uint256 newActionCost = ActionCost.get(_empire, _actionType) + P_GameConfig.getActionCostIncrease();
        ActionCost.set(_empire, _actionType, newActionCost);
    }

    function pointCostDown(EEmpire _empire) internal {
        P_GameConfigData memory config = P_GameConfig.get();
        uint256 newPointCost = Faction.getPointCost(_empire);
        if (newPointCost > config.minPointCost + config.pointGenRate) {
            newPointCost -= config.pointGenRate;
        } else {
            newPointCost = config.minPointCost;
        }
        Faction.setPointCost(_empire, newPointCost);
    }

    function actionCostDown(EEmpire _empireImpacted) internal {
        P_GameConfigData memory config = P_GameConfig.get();
        for(uint256 i = 0; i < uint256(EAction.LENGTH); i++) {
            uint256 newActionCost = ActionCost.get(_empireImpacted, EAction(i));
            if (newActionCost > config.minActionCost + config.actionGenRate) {
                newActionCost -= config.actionGenRate;
            } else {
                newActionCost = config.minActionCost;
            }
            ActionCost.set(_empireImpacted, EAction(i), newActionCost);
        }
    }

}