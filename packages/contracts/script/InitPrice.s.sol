// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console } from "forge-std/console.sol";
import { Faction, P_PointConfig } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";

function initPrice() {
    uint256 startPointCost = P_PointConfig.getStartPointCost();
    for(uint i = 0; i < uint256(EEmpire.LENGTH); i++) {
        Faction.setPointCost(EEmpire(i), startPointCost);
    }
}