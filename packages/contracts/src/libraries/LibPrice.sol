// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Faction, Player, P_GameConfig } from "codegen/index.sol";
import { EEmpire, EAction } from "codegen/common.sol";
import { EMPIRE_COUNT } from "src/constants.sol";

library LibPrice {
    function getTotalCost(EAction actionType, EEmpire empireImpacted, bool progressAction) internal view returns (uint256) {
        uint256 totalCost = 0;
        if (progressAction) {
            require(actionType == EAction.CreateDestroyer, "[LibPrice] Action type is not a progressive action");
            totalCost = getProgressPointCost(empireImpacted);
        } else {
            require(actionType == EAction.KillDestroyer, "[LibPrice] Action type is not a regressive action");
            totalCost = getRegressPointCost(empireImpacted);
        }

        totalCost += getActionMarginalCost(actionType, empireImpacted);
        return totalCost;
    }

    // Gets the cost of the impacted empires points, iterated by EMPIRE_COUNT-1
    function getProgressPointCost(EEmpire empireImpacted) internal view returns (uint256) {
        return getPointCost(empireImpacted, EMPIRE_COUNT - 1);
    }

    // Gets the cost of a single point of each unimpacted empire
    // Iterates through each empire except the impacted one.
    function getRegressPointCost(EEmpire empireImpacted) internal view returns (uint256) {
        uint256 pointCost;
        for(uint256 i = 0; i < EMPIRE_COUNT; i++) {
            if (i == uint256(empireImpacted)) {
                continue;
            }
            pointCost += getPointCost(EEmpire(i), 1);
        }
        return pointCost;
    }

    // Gets the cost of a specific empire's points, for a given amount
    function getPointCost(EEmpire empireImpacted, uint256 pointUnits) internal view returns (uint256) {
        require(pointUnits > 0, "[LibPrice] Point units must be greater than 0");
        uint256 initPointCost = Faction.getPointCost(empireImpacted);
        uint256 pointCostIncrease = P_GameConfig.getPointCostIncrease();
        uint256 pointCost = 0;
        for(uint256 i = 0; i < pointUnits; i++) {
            pointCost += initPointCost + i * pointCostIncrease;
        }
        return pointCost;
    }

    // Gets the cost of an action that impacts a specific empire
    function getActionMarginalCost(EAction actionType, EEmpire empireImpacted) internal view returns (uint256) {
        return Faction.getActionCost(empireImpacted)[uint256(actionType)];
    }

}