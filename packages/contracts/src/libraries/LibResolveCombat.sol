// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { P_GameConfig, Turn, PendingMove, Planet, PlanetData, PlanetBattleRoutineLog, PlanetBattleRoutineLogData, Empire } from "codegen/index.sol";
import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";
import { AcidPlanetsSet } from "adts/AcidPlanetsSet.sol";
import { ArrivedMap } from "adts/ArrivedMap.sol";
import { pseudorandomEntity } from "src/utils.sol";
import { EEmpire } from "codegen/common.sol";

library LibResolveCombat {
  /**
   * @dev Resolves combat on a planet, handling defenses and potential conquests.
   * @param attackingEmpire The empire ID of the attacking force.
   * @param attackingShips The number of ships in the attacking force.
   * @param defendingPlanetId The ID of the planet where combat is being resolved.
   *
   * This function performs the following steps:
   * 1. Retrieves the current planet data and defending empire.
   * 2. If there's no attacker (NULL empire), the function returns early.
   * 3. If the attacking empire is the same as the defending empire, adds arriving ships to the planet.
   * 4. Otherwise, resolves combat between attacking and defending forces:
   *    - Compares attacking ships against defending shields and ships.
   *    - Updates planet ownership and forces based on combat outcome.
   * 5. Logs the battle result if combat occurred.
   */
  function resolveCombat(
    EEmpire attackingEmpire,
    uint256 attackingShips,
    bytes32 defendingPlanetId
  ) internal returns (bool) {
    PlanetData memory planetData = Planet.get(defendingPlanetId);
    EEmpire defendingEmpire = planetData.empireId;

    uint256 defendingShips = planetData.shipCount;

    if (attackingEmpire == EEmpire.NULL) {
      return false;
    } else if (defendingEmpire == attackingEmpire) {
      ArrivedMap.set(defendingPlanetId, ArrivedMap.get(defendingPlanetId) + attackingShips);
      Planet.setShipCount(defendingPlanetId, defendingShips + attackingShips);
    } else {
      bool conquer = false;
      uint256 defendingShields = Planet.getShieldCount(defendingPlanetId);
      uint256 totalDefenses = defendingShips + defendingShields;

      // attackers die from shields
      if (attackingShips <= defendingShields) {
        Planet.setShieldCount(defendingPlanetId, defendingShields - attackingShips);
      }
      // attackers destroy shields and damage destroyers, but don't conquer
      else if (attackingShips <= totalDefenses) {
        Planet.setShieldCount(defendingPlanetId, 0);
        Planet.setShipCount(defendingPlanetId, totalDefenses - attackingShips);
      }
      // attackers conquer planet
      else if (attackingShips > totalDefenses) {
        conquer = true;

        Planet.setShieldCount(defendingPlanetId, 0);
        Planet.setShipCount(defendingPlanetId, attackingShips - totalDefenses);

        EmpirePlanetsSet.add(attackingEmpire, defendingPlanetId);
        EmpirePlanetsSet.remove(defendingEmpire, defendingPlanetId);
        AcidPlanetsSet.changeEmpire(defendingEmpire, attackingEmpire, defendingPlanetId);
        Planet.setEmpireId(defendingPlanetId, attackingEmpire);
        PendingMove.deleteRecord(defendingPlanetId);
        if (EmpirePlanetsSet.size(defendingEmpire) == 0) {
          Empire.setIsDefeated(defendingEmpire, true);
        }
      } else {
        revert("[LibResolveCombat] Invalid combat resolution");
      }

      bytes32 eventEntity = pseudorandomEntity();

      PlanetBattleRoutineLog.set(
        eventEntity,
        PlanetBattleRoutineLogData({
          turn: Turn.getValue(),
          planetId: defendingPlanetId,
          attackingShipCount: attackingShips,
          defendingShipCount: defendingShips,
          defendingShieldCount: defendingShields,
          conquer: conquer,
          timestamp: block.timestamp
        })
      );

      return conquer;
    }

    return false;
  }
}
