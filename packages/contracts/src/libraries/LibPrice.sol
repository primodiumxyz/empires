// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Faction, Player, P_GameConfig } from "codegen/index.sol";
import { EEmpire, EAction } from "codegen/common.sol";
import { EMPIRE_COUNT } from "src/constants.sol";

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

        totalCost += getActionMarginalCost(_actionType, _empireImpacted);
        return totalCost;
    }

    // Gets the cost of the impacted empires points, iterated by EMPIRE_COUNT-1
    function getProgressPointCost(EEmpire _empireImpacted) internal view returns (uint256) {
        return getPointCost(_empireImpacted, EMPIRE_COUNT - 1);
    }

    // Gets the cost of a single point of each unimpacted empire
    // Iterates through each empire except the impacted one.
    function getRegressPointCost(EEmpire _empireImpacted) internal view returns (uint256) {
        uint256 pointCost;
        for(uint256 i = 0; i < EMPIRE_COUNT; i++) {
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

    // Gets the cost of an action that impacts a specific empire
    function getActionMarginalCost(EAction _actionType, EEmpire _empireImpacted) internal view returns (uint256) {
        return Faction.getActionCost(_empireImpacted)[uint256(_actionType)];
    }
}