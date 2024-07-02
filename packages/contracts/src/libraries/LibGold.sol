// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { pseudorandom } from "src/utils.sol";
import { Planet, P_NPCActionThresholdsData, P_NPCActionThresholds, P_NPCActionCosts } from "codegen/index.sol";
import { ENPCAction } from "codegen/common.sol";

library LibGold {
  function spendGold(bytes32 planetId) internal {
    uint256 goldCount = Planet.getGoldCount(planetId);
    if (goldCount == 0) return;

    uint256 value = pseudorandom(uint256(planetId) - 256, 10_000);

    P_NPCActionThresholdsData memory actionConfig = P_NPCActionThresholds.get();

    if (value < actionConfig.none) {
      return;
    } else if (value < actionConfig.buyDestroyers) {
      uint256 destroyerPrice = P_NPCActionCosts.get(ENPCAction.BuyDestroyers);
      uint256 destroyersToBuy = goldCount / destroyerPrice;
      uint256 newGoldCount = goldCount - (destroyersToBuy * destroyerPrice);
      Planet.setGoldCount(planetId, newGoldCount);
    }
  }
}
