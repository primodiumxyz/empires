// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console } from "forge-std/console.sol";
import { Empire, OverrideCost, HistoricalPointCost, P_PointConfig, P_OverrideConfig } from "codegen/index.sol";
import { EEmpire, EOverride } from "codegen/common.sol";

function initPrice() {
  uint256 startPointCost = P_PointConfig.getStartPointCost();
  for (uint256 i = 1; i < uint256(EEmpire.LENGTH); i++) {
    Empire.setPointCost(EEmpire(i), startPointCost);
    // Set the initial point cost for each empire for historical data visualization
    HistoricalPointCost.set(EEmpire(i), block.timestamp, startPointCost);
    for (uint256 j = 1; j < uint256(EOverride.LENGTH); j++) {
      uint256 startOverrideCost = P_OverrideConfig.getStartOverrideCost(EOverride(j));
      OverrideCost.set(EEmpire(i), EOverride(j), startOverrideCost);
    }
  }
}
