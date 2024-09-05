// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";
import { CitadelPlanetsSet } from "adts/CitadelPlanetsSet.sol";
import { AcidPlanetsSet } from "adts/AcidPlanetsSet.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { PlayersMap } from "adts/PlayersMap.sol";
import { PendingMove, WinningEmpire, HistoricalPointCost, Magnet, P_GameConfig } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";

contract ResetClearLoopSubsystem is EmpiresSystem {
  function clearLoop() public {
    bytes32[] memory planets = PlanetsSet.getPlanetIds();
    uint8 empireCount = P_GameConfig.getEmpireCount();

    for (uint256 i = 0; i < planets.length; i++) {
      PendingMove.deleteRecord(planets[i]);
    }

    for (uint8 i = 1; i <= empireCount; i++) {
      EEmpire empire = EEmpire(i);
      for (uint256 j = 0; j < planets.length; j++) {
        PendingMove.deleteRecord(planets[j]);
        Magnet.deleteRecord(empire, planets[j]);
      }

      EmpirePlanetsSet.clear(empire);
      AcidPlanetsSet.clear(empire);
      PointsMap.clear(empire);
      PlayersMap.clear();
      PlanetsSet.clear();
      CitadelPlanetsSet.clear();
    }
    // Does not reset Player table, that's fine. it only contains id and spent
    // by not clearing Player.spent, we can keep track of how much each player has spent over multiple matches

    WinningEmpire.set(EEmpire.NULL);
  }
}
