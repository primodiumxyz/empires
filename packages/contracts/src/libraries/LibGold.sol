// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { pseudorandom, pseudorandomEntity } from "src/utils.sol";
import { Planet, P_NPCActionThresholdsData, P_NPCActionThresholds, P_NPCActionCosts, BuyShipsNPCAction, BuyShipsNPCActionData, BuyShieldsNPCAction, BuyShieldsNPCActionData } from "codegen/index.sol";
import { ENPCAction } from "codegen/common.sol";

library LibGold {
  function spendGold(bytes32 planetId) internal {
    uint256 goldCount = Planet.getGoldCount(planetId);
    if (goldCount == 0) return;

    uint256 randomValue = pseudorandom(uint256(planetId) + 128, 10_000);
    _spendGold(planetId, randomValue);
  }

  // separated for testing
  function _spendGold(bytes32 planetId, uint256 value) internal {
    uint256 goldCount = Planet.getGoldCount(planetId);
    P_NPCActionThresholdsData memory actionConfig = P_NPCActionThresholds.get();

    if (value < actionConfig.none) {
      return;
    } else if (value < actionConfig.buyShips) {
      uint256 shipPrice = P_NPCActionCosts.get(ENPCAction.BuyShips);
      if (shipPrice == 0) return;
      uint256 shipsToBuy = goldCount / shipPrice;
      if (shipsToBuy == 0) return;
      uint256 newGoldCount = goldCount - (shipsToBuy * shipPrice);
      Planet.setShipCount(planetId, Planet.getShipCount(planetId) + shipsToBuy);
      Planet.setGoldCount(planetId, newGoldCount);

      BuyShipsNPCAction.set(
        pseudorandomEntity(),
        BuyShipsNPCActionData({
          goldSpent: shipsToBuy * shipPrice,
          shipBought: shipsToBuy,
          planetId: planetId,
          timestamp: block.timestamp
        })
      );
    } else if (value < actionConfig.buyShields) {
      uint256 shieldPrice = P_NPCActionCosts.get(ENPCAction.BuyShields);
      if (shieldPrice == 0) return;
      uint256 shieldsToBuy = goldCount / shieldPrice;
      if (shieldsToBuy == 0) return;
      uint256 newGoldCount = goldCount - (shieldsToBuy * shieldPrice);
      Planet.setShieldCount(planetId, Planet.getShieldCount(planetId) + shieldsToBuy);
      Planet.setGoldCount(planetId, newGoldCount);

      BuyShieldsNPCAction.set(
        pseudorandomEntity(),
        BuyShieldsNPCActionData({
          goldSpent: shieldsToBuy * shieldPrice,
          shieldBought: shieldsToBuy,
          planetId: planetId,
          timestamp: block.timestamp
        })
      );
    }
  }
}
