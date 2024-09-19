// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console } from "forge-std/console.sol";
import { Empire, OverrideCost, HistoricalPointPrice, P_PointConfig, P_OverrideConfig, P_GameConfig } from "codegen/index.sol";
import { EOverride, EEmpire } from "codegen/common.sol";

function initPrice() {
  uint256 startPointPrice = P_PointConfig.getStartPointPrice();
  uint8 empireCount = P_GameConfig.getEmpireCount();
  for (uint8 i = 1; i <= empireCount; i++) {
    Empire.setPointPrice(EEmpire(i), startPointPrice);
    // Set the initial point price for each empire for historical data visualization
    HistoricalPointPrice.set(EEmpire(i), block.timestamp, startPointPrice);
    for (uint256 j = 1; j < uint256(EOverride.LENGTH); j++) {
      uint256 startOverrideCost = P_OverrideConfig.getStartOverrideCost(EOverride(j));
      OverrideCost.set(EEmpire(i), EOverride(j), startOverrideCost);
    }
  }
}
