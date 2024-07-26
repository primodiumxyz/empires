// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { pseudorandom, pseudorandomEntity } from "src/utils.sol";
import { AccumulateGoldNPCAction, AccumulateGoldNPCActionData, Planet, P_NPCActionCosts, BuyShipsNPCAction, BuyShipsNPCActionData, BuyShieldsNPCAction, BuyShieldsNPCActionData } from "codegen/index.sol";
import { ENPCAction } from "codegen/common.sol";
import { RoutineThresholds } from "src/Types.sol";

import { LibMoveShips } from "./LibMoveShips.sol";

library LibNPCAction {
  /**
   * @dev Executes an NPC action for a given planet based on routineThresholds.
   * @param planetId The ID of the planet for which to execute the action.
   * @param routineThresholds A struct containing the routineThresholds of different actions.
   *
   * This function performs the following steps:
   * 1. Checks if the planet has any gold. If not, it returns early.
   * 2. Generates a random value based on the planet ID.
   * 3. Calls the internal _executeAction function with the routineThresholds and random value.
   *
   * The actual action performed is determined by the _executeAction function
   * based on the random value and the provided routineThresholds.
   */
  function executeAction(bytes32 planetId, RoutineThresholds memory routineThresholds) internal {
    uint256 goldCount = Planet.getGoldCount(planetId);
    if (goldCount == 0) return;

    uint256 randomValue = pseudorandom(uint256(planetId) + 128, 10_000);

    _executeAction(routineThresholds, randomValue);
  }

  // separated for testing
  function _executeAction(RoutineThresholds memory routineThresholds, uint256 value) internal {
    if (value < routineThresholds.accumulateGold) {
      _accumulateGold(routineThresholds.planetId);
    } else if (value < routineThresholds.buyShields) {
      _buyShields(routineThresholds.planetId);
    } else if (value < routineThresholds.buyShips) {
      _buyShips(routineThresholds.planetId);
    } else if (value < routineThresholds.supportAlly) {
      LibMoveShips.createPendingMove(routineThresholds.planetId, routineThresholds.supportTargetId);
    } else if (value < routineThresholds.attackEnemy) {
      LibMoveShips.createPendingMove(routineThresholds.planetId, routineThresholds.attackTargetId);
    } else {
      revert("Invalid routineThresholds");
    }
  }

  /**
   * @dev Accumulates gold for a given planet.
   * @param planetId The ID of the planet to accumulate gold for.
   *
   * This function performs the following steps:
   * 1. Retrieves the amount of gold to be added from the P_NPCActionCosts table.
   * 2. Gets the current gold count of the planet.
   * 3. Adds the new gold to the planet's existing gold count.
   * 4. Updates the planet's gold count with the new total.
   * 5. Logs an AccumulateGoldNPCAction with details of the gold accumulation.
   */
  function _accumulateGold(bytes32 planetId) internal {
    uint256 goldAdded = P_NPCActionCosts.get(ENPCAction.AccumulateGold);
    uint256 goldCount = Planet.getGoldCount(planetId);
    Planet.setGoldCount(planetId, goldCount + goldAdded);
    AccumulateGoldNPCAction.set(
      pseudorandomEntity(),
      AccumulateGoldNPCActionData({ goldAdded: goldAdded, planetId: planetId, timestamp: block.timestamp })
    );
  }

  /**
   * @dev Buys shields for a given planet using available gold.
   * @param planetId The ID of the planet to buy shields for.
   *
   * This function performs the following steps:
   * 1. Retrieves the planet's current gold count.
   * 2. Gets the shield price from the P_NPCActionCosts table.
   * 3. Calculates the number of shields that can be bought with the available gold.
   * 4. If shields can be bought, updates the planet's shield count and gold count.
   * 5. Logs a BuyShieldsNPCAction with details of the shield purchase.
   */
  function _buyShields(bytes32 planetId) internal {
    uint256 goldCount = Planet.getGoldCount(planetId);
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

  /**
   * @dev Buys ships for a given planet using available gold.
   * @param planetId The ID of the planet to buy ships for.
   *
   * This function performs the following steps:
   * 1. Retrieves the planet's current gold count.
   * 2. Gets the ship price from the P_NPCActionCosts table.
   * 3. Calculates the number of ships that can be bought with the available gold.
   * 4. If ships can be bought, updates the planet's ship count and gold count.
   * 5. Logs a BuyShipsNPCAction with details of the ship purchase.
   */
  function _buyShips(bytes32 planetId) internal {
    uint256 goldCount = Planet.getGoldCount(planetId);
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
  }
}
