// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console } from "forge-std/console.sol";
import { Faction, ActionCost, P_PointConfig, P_ActionConfig } from "codegen/index.sol";
import { EEmpire, EPlayerAction } from "codegen/common.sol";

function initPrice() {
    uint256 startPointCost = P_PointConfig.getStartPointCost();
    uint256 startActionCost = P_ActionConfig.getStartActionCost();
    for(uint256 q = 1; q < uint256(EEmpire.LENGTH); q++) {
        Faction.setPointCost(EEmpire(q), startPointCost);
        for(uint256 z = 1; z < uint256(EPlayerAction.LENGTH); z++) {
            ActionCost.set(EEmpire(q), EPlayerAction(z), startActionCost);
        }
    }
}