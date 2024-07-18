// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console } from "forge-std/console.sol";
import { Empire, ActionCost, HistoricalPointCost, P_PointConfig, P_ActionConfig } from "codegen/index.sol";
import { EEmpire, EPlayerAction } from "codegen/common.sol";

function initPrice() {
  uint256 startPointCost = P_PointConfig.getStartPointCost();
  uint256 startActionCost = P_ActionConfig.getStartActionCost();
  for (uint256 i = 1; i < uint256(EEmpire.LENGTH); i++) {
    Empire.setPointCost(EEmpire(i), startPointCost);
    // Set the initial point cost for each empire for historical data visualization
    HistoricalPointCost.set(EEmpire(i), block.timestamp, startPointCost);
    for (uint256 j = 1; j < uint256(EPlayerAction.LENGTH); j++) {
      ActionCost.set(EEmpire(i), EPlayerAction(j), startActionCost);
    }
  }
}
