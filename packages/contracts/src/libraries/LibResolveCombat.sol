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
    if (empire == planetData.empireId) Planet.setShipCount(planetId, planetData.shipCount + arrivingShips);
    else {
      bool conquer = planetData.shipCount < arrivingShips;

      uint256 remainingShips = conquer ? arrivingShips - planetData.shipCount : planetData.shipCount - arrivingShips;

      if (conquer) {
        EmpirePlanetsSet.add(empire, planetId);
        EmpirePlanetsSet.remove(planetData.empireId, planetId);

        Planet.setEmpireId(planetId, empire);
      }

      Planet.setShipCount(planetId, remainingShips);
      BattleNPCAction.set(
        pseudorandomEntity(),
        BattleNPCActionData({
          planetId: planetId,
          attackingShipCount: arrivingShips,
          defendingShipCount: planetData.shipCount,
          conquer: conquer,
          timestamp: block.timestamp
        })
      );
    }
    Arrivals.deleteRecord(planetId);
  }
}
