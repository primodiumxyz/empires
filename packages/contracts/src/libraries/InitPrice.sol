// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console } from "forge-std/console.sol";
import { Empire, OverrideCost, HistoricalPointCost, P_PointConfig, P_OverrideConfig, P_GameConfig } from "codegen/index.sol";
import { EOverride } from "codegen/common.sol";

function initPrice() {
  uint256 startPointCost = P_PointConfig.getStartPointCost();
  uint8 empireCount = P_GameConfig.getEmpireCount();
  for (uint8 i = 1; i <= empireCount; i++) {
    Empire.setPointCost(i, startPointCost);
    // Set the initial point cost for each empire for historical data visualization
    HistoricalPointCost.set(i, block.timestamp, startPointCost);
    for (uint256 j = 1; j < uint256(EOverride.LENGTH); j++) {
      uint256 startOverrideCost = P_OverrideConfig.getStartOverrideCost(EOverride(j));
      OverrideCost.set(i, EOverride(j), startOverrideCost);
    }
  }
}
