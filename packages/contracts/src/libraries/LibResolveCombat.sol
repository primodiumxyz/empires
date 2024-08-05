// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Planet_TacticalStrike, PendingMove, Arrivals, Planet, PlanetData, ShipBattleRoutine, ShipBattleRoutineData, PlanetBattleRoutine, PlanetBattleRoutineData } from "codegen/index.sol";
import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";
import { EEmpire } from "codegen/common.sol";
import { pseudorandomEntity } from "src/utils.sol";
import { console } from "forge-std/console.sol";

library LibResolveCombat {
  /**
   * @dev Resolves combat on a planet, handling arrivals, defenses, and potential conquests.
   * @param planetId The ID of the planet where combat is being resolved.
   *
   * This function performs the following steps:
   * 1. Retrieves the current planet data and defending empire.
   * 2. Calculates the total defending forces (ships + arrivals).
   * 3. Resolves battles between attacking empires to determine the main attacker.
   * 4. If there's no attacker, adds arriving ships to the planet and exits.
   * 5. Compares attacking forces against defending shields and ships.
   * 6. Updates planet ownership and forces based on combat outcome.
   * 7. Logs the battle result.
   * 8. Clears all arrivals for the planet.
   */
  function resolveCombat(bytes32 planetId) internal {
    PlanetData memory planetData = Planet.get(planetId);
    EEmpire defendingEmpire = planetData.empireId;

    uint256 defendingShips = planetData.shipCount + Arrivals.get(planetId, defendingEmpire);

    bytes32 eventEntity = pseudorandomEntity();
    (EEmpire attackingEmpire, uint256 attackingShips) = resolveMultiPartyAttackers(
      eventEntity,
      planetId,
      defendingEmpire
    );

    if (attackingEmpire == EEmpire.NULL) {
      Planet.setShipCount(planetId, defendingShips);
    } else {
      bool conquer = false;
      uint256 defendingShields = Planet.get(planetId).shieldCount;
      uint256 totalDefenses = defendingShips + defendingShields;

      // attackers bounce off shields
      if (attackingShips <= defendingShields) {
        Planet.setShieldCount(planetId, defendingShields - attackingShips);
      }
      // attackers destroy shields and damage destroyers, but don't conquer
      else if (attackingShips <= totalDefenses) {
        Planet.setShieldCount(planetId, 0);
        Planet.setShipCount(planetId, totalDefenses - attackingShips);
      }
      // attackers conquer planet
      else if (attackingShips > totalDefenses) {
        conquer = true;

        if (defendingEmpire == EEmpire.NULL) {
          Planet_TacticalStrike.setChargeRate(planetId, 1);
        }

        Planet.setShieldCount(planetId, 0);
        Planet.setShipCount(planetId, attackingShips - totalDefenses);

        EmpirePlanetsSet.add(attackingEmpire, planetId);
        EmpirePlanetsSet.remove(defendingEmpire, planetId);
        Planet.setEmpireId(planetId, attackingEmpire);
        PendingMove.deleteRecord(planetId);
      } else {
        revert("[LibResolveCombat] Invalid combat resolution");
      }

      PlanetBattleRoutine.set(
        eventEntity,
        PlanetBattleRoutineData({
          planetId: planetId,
          attackingShipCount: attackingShips,
          defendingShipCount: defendingShips,
          defendingShieldCount: defendingShields,
          conquer: conquer,
          timestamp: block.timestamp
        })
      );
    }

    Arrivals.deleteRecord(planetId, EEmpire.Green);
    Arrivals.deleteRecord(planetId, EEmpire.Blue);
    Arrivals.deleteRecord(planetId, EEmpire.Red);
  }

  /**
   * @dev Resolves a battle between two attacking empires on a planet.
   * @param planetId The ID of the planet where the battle is taking place.
   * @param defendingEmpire The empire currently controlling the planet.
   * @return The winning attacking empire and the number of ships remaining after the battle.
   *
   * This function determines which of the two non-defending empires has more ships
   * arriving at the planet, and calculates the remaining ships after they fight each other.
   * The empire with more ships wins, and the difference in ship counts is returned.
   */
  function resolveMultiPartyAttackers(
    bytes32 eventEntity,
    bytes32 planetId,
    EEmpire defendingEmpire
  ) internal returns (EEmpire, uint256) {
    EEmpire winningEmpire = EEmpire.NULL;
    uint256 winningCount = 0;
    uint256 secondPlaceCount = 0;

    for (uint256 i = 1; i < uint256(EEmpire.LENGTH); i++) {
      EEmpire empire = EEmpire(i);
      if (empire == defendingEmpire) continue;
      uint256 shipCount = Arrivals.get(planetId, empire);
      if (shipCount > winningCount) {
        secondPlaceCount = winningCount;
        winningCount = shipCount;
        winningEmpire = empire;
      } else if (shipCount > secondPlaceCount) {
        secondPlaceCount = shipCount;
      }
    }

    ShipBattleRoutine.set(
      eventEntity,
      ShipBattleRoutineData({
        redShipCount: Arrivals.get(planetId, EEmpire.Red),
        greenShipCount: Arrivals.get(planetId, EEmpire.Green),
        blueShipCount: Arrivals.get(planetId, EEmpire.Blue),
        planetId: planetId,
        timestamp: block.timestamp
      })
    );

    uint256 remainingShips = winningCount - secondPlaceCount;
    return (winningEmpire, remainingShips);
  }
}
