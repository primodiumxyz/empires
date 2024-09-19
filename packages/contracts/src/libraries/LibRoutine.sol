// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { pseudorandom, nextLogEntity } from "src/utils.sol";
import { Turn, AccumulateGoldRoutineLog, AccumulateGoldRoutineLogData, Planet, P_RoutineCosts, BuyShipsRoutineLog, BuyShipsRoutineLogData, BuyShieldsRoutineLog, BuyShieldsRoutineLogData } from "codegen/index.sol";
import { ERoutine } from "codegen/common.sol";
import { RoutineThresholds } from "src/Types.sol";

import { LibMoveShips } from "./LibMoveShips.sol";

library LibRoutine {
  /**
   * @dev Executes a routine for a given planet based on routineThresholds.
   * @param planetId The ID of the planet for which to execute the routine.
   * @param routineThresholds A struct containing the routineThresholds of different overrides.
   *
   * This function performs the following steps:
   * 1. Generates a random value based on the planet ID.
   * 2. Calls the internal _executeRoutine function with the routineThresholds and random value.
   *
   * The actual routine performed is determined by the _executeRoutine function
   * based on the random value and the provided routineThresholds.
   */
  function executeRoutine(bytes32 planetId, RoutineThresholds memory routineThresholds) internal {
    uint256 randomValue = pseudorandom(uint256(planetId) + 128, 10_000);
    _executeRoutine(routineThresholds, randomValue);
  }

  // separated for testing
  function _executeRoutine(RoutineThresholds memory routineThresholds, uint256 value) internal {
    if (value < routineThresholds.accumulateGold) {
      _accumulateGold(routineThresholds.planetId);
    } else if (value < routineThresholds.buyShields) {
      _buyShields(routineThresholds.planetId);
    } else if (value < routineThresholds.buyShips) {
      _buyShips(routineThresholds.planetId);
    } else if (value < routineThresholds.moveShips && routineThresholds.moveTargetId != routineThresholds.planetId) {
      LibMoveShips.createPendingMove(routineThresholds.planetId, routineThresholds.moveTargetId);
    } else {
      revert("Invalid routineThresholds");
    }
  }

  /**
   * @dev Accumulates gold for a given planet.
   * @param planetId The ID of the planet to accumulate gold for.
   *
   * This function performs the following steps:
   * 1. Retrieves the amount of gold to be added from the P_RoutineCosts table.
   * 2. Gets the current gold count of the planet.
   * 3. Adds the new gold to the planet's existing gold count.
   * 4. Updates the planet's gold count with the new total.
   * 5. Logs an AccumulateGoldRoutine with details of the gold accumulation.
   */
  function _accumulateGold(bytes32 planetId) internal {
    uint256 goldAdded = P_RoutineCosts.get(ERoutine.AccumulateGold);
    uint256 goldCount = Planet.getGoldCount(planetId);
    Planet.setGoldCount(planetId, goldCount + goldAdded);
    AccumulateGoldRoutineLog.set(
      nextLogEntity(),
      AccumulateGoldRoutineLogData({
        turn: Turn.getValue(),
        goldAdded: goldAdded,
        planetId: planetId,
        timestamp: block.timestamp
      })
    );
  }

  /**
   * @dev Buys shields for a given planet using available gold.
   * @param planetId The ID of the planet to buy shields for.
   *
   * This function performs the following steps:
   * 1. Retrieves the planet's current gold count.
   * 2. Gets the shield price from the P_RoutineCosts table.
   * 3. Calculates the number of shields that can be bought with the available gold.
   * 4. If shields can be bought, updates the planet's shield count and gold count.
   * 5. Logs a BuyShieldsRoutine with details of the shield purchase.
   */
  function _buyShields(bytes32 planetId) internal {
    uint256 goldCount = Planet.getGoldCount(planetId);
    uint256 shieldPrice = P_RoutineCosts.get(ERoutine.BuyShields);
    if (shieldPrice == 0) return;
    uint256 shieldsToBuy = goldCount / shieldPrice;
    if (shieldsToBuy == 0) return;
    uint256 newGoldCount = goldCount - (shieldsToBuy * shieldPrice);
    Planet.setShieldCount(planetId, Planet.getShieldCount(planetId) + shieldsToBuy);
    Planet.setGoldCount(planetId, newGoldCount);

    BuyShieldsRoutineLog.set(
      nextLogEntity(),
      BuyShieldsRoutineLogData({
        turn: Turn.getValue(),
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
   * 2. Gets the ship price from the P_RoutineCosts table.
   * 3. Calculates the number of ships that can be bought with the available gold.
   * 4. If ships can be bought, updates the planet's ship count and gold count.
   * 5. Logs a BuyShipsRoutine with details of the ship purchase.
   */
  function _buyShips(bytes32 planetId) internal {
    uint256 goldCount = Planet.getGoldCount(planetId);
    uint256 shipPrice = P_RoutineCosts.get(ERoutine.BuyShips);
    if (shipPrice == 0) return;
    uint256 shipsToBuy = goldCount / shipPrice;
    if (shipsToBuy == 0) return;
    uint256 newGoldCount = goldCount - (shipsToBuy * shipPrice);
    Planet.setShipCount(planetId, Planet.getShipCount(planetId) + shipsToBuy);
    Planet.setGoldCount(planetId, newGoldCount);

    BuyShipsRoutineLog.set(
      nextLogEntity(),
      BuyShipsRoutineLogData({
        turn: Turn.getValue(),
        goldSpent: shipsToBuy * shipPrice,
        shipBought: shipsToBuy,
        planetId: planetId,
        timestamp: block.timestamp
      })
    );
  }
}
