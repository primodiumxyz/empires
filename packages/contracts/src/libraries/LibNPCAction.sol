// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { pseudorandom, pseudorandomEntity } from "src/utils.sol";
import { Planet, P_NPCActionCosts, BuyShipsNPCAction, BuyShipsNPCActionData, BuyShieldsNPCAction, BuyShieldsNPCActionData } from "codegen/index.sol";
import { ENPCAction } from "codegen/common.sol";
import { Likelihoods } from "src/Types.sol";

library LibNPCAction {
  function executeAction(bytes32 planetId, Likelihoods memory likelihoods) internal {
    uint256 goldCount = Planet.getGoldCount(planetId);
    if (goldCount == 0) return;

    uint256 randomValue = pseudorandom(uint256(planetId) + 128, 10_000);

    _executeAction(planetId, randomValue, likelihoods);
  }

  // separated for testing
  function _executeAction(bytes32 planetId, uint256 value, Likelihoods memory likelihoods) internal {
    uint256 goldCount = Planet.getGoldCount(planetId);

    if (value < likelihoods.buyShields) {
      return;
    } else if (value < likelihoods.attackEnemy) {
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
    } else if (value < likelihoods.accumulateGold) {
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
