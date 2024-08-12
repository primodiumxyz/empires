// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";
import { CitadelPlanetsSet } from "adts/CitadelPlanetsSet.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { PlayersMap } from "adts/PlayersMap.sol";
import { createPlanets } from "codegen/scripts/CreatePlanets.sol";
import { initPrice } from "libraries/InitPrice.sol";
import { PendingMove, WinningEmpire, HistoricalPointCost, Magnet, Turn, P_GameConfig } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";

contract ResetSystem is System {
  function resetGame() public {
    bytes32[] memory planets = PlanetsSet.getPlanetIds();
    uint8 empireCount = P_GameConfig.getEmpireCount();

    for (uint256 i = 0; i < planets.length; i++) {
      PendingMove.deleteRecord(planets[i]);
    }

    for (uint8 i = 1; i <= empireCount; i++) {
      EEmpire empire = EEmpire(i);
      for (uint256 j = 0; j < planets.length; j++) {
        PendingMove.deleteRecord(planets[j]);
        Magnet.deleteRecord(empire, planets[i]);
      }

      EmpirePlanetsSet.clear(empire);
      PointsMap.clear(empire);
      PlayersMap.clear();
      PlanetsSet.clear();
      CitadelPlanetsSet.clear();
    }
    // Does not reset Player table, that's fine. it only contains id and spent
    // by not clearing Player.spent, we can keep track of how much each player has spent over multiple matches

    WinningEmpire.set(EEmpire.NULL);

    P_GameConfig.setGameOverBlock(block.number + 1_000);
    P_GameConfig.setGameStartTimestamp(block.timestamp);
    createPlanets(); // Planet and Empire tables are reset to default values
    initPrice(); // Empire.setPointCost and OverrideCost tables are reset to default values
    Turn.set(block.number + P_GameConfig.getTurnLengthBlocks(), EEmpire.Red, 1);
  }
}
