// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Arrivals, Planet, PlanetData, BattleNPCAction, BattleNPCActionData } from "codegen/index.sol";
import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";
import { EEmpire } from "codegen/common.sol";
import { pseudorandomEntity } from "src/utils.sol";

library LibResolveCombat {
  function resolveCombat(EEmpire empire, bytes32 planetId) internal {
    uint256 arrivingShips = Arrivals.get(planetId);
    if (arrivingShips == 0) return;

    PlanetData memory planetData = Planet.get(planetId);
    if (empire == planetData.empireId) {
      Planet.setShipCount(planetId, planetData.shipCount + arrivingShips);
    } else {
      bool conquer = false;
      uint256 defendingShips = Planet.get(planetId).shipCount;
      uint256 defendingShields = Planet.get(planetId).shieldCount;
      uint256 totalDefenses = defendingShips + defendingShields;

      // attackers bounce off shields
      if (arrivingShips <= defendingShields) {
        Planet.setShieldCount(planetId, defendingShields - arrivingShips);
      }
      // attackers destroy shields and damage destroyers, but don't conquer
      else if (arrivingShips <= totalDefenses) {
        Planet.setShieldCount(planetId, 0);
        Planet.setShipCount(planetId, totalDefenses - arrivingShips);
      }
      // attackers conquer planet
      else if (arrivingShips > totalDefenses) {
        Planet.setShieldCount(planetId, 0);
        Planet.setShipCount(planetId, arrivingShips - totalDefenses);

        EmpirePlanetsSet.add(empire, planetId);
        EmpirePlanetsSet.remove(planetData.empireId, planetId);
        Planet.setEmpireId(planetId, empire);
      }
      // should be impossible
      else {}

      BattleNPCAction.set(
        pseudorandomEntity(),
        BattleNPCActionData({
          planetId: planetId,
          attackingShipCount: arrivingShips,
          defendingShipCount: defendingShips,
          defendingShieldCount: defendingShields,
          conquer: conquer,
          timestamp: block.timestamp
        })
      );
    }
    Arrivals.deleteRecord(planetId);
  }
}
