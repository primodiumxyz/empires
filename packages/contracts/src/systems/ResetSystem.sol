// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";
import { CitadelPlanetsSet } from "adts/CitadelPlanetsSet.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { EEmpire } from "codegen/common.sol";
import { createPlanets } from "codegen/scripts/CreatePlanets.sol";
import { initPrice } from "libraries/InitPrice.sol";
import { PendingMove, WinningEmpire, HistoricalPointCost, Magnet, Turn, P_GameConfig } from "codegen/index.sol";

contract ResetSystem is System {
  function resetGame() public {
    bytes32[] memory planets = PlanetsSet.getPlanetIds();
    for (uint256 i = 0; i < planets.length; i++) {
      PendingMove.deleteRecord(planets[i]);
      Magnet.deleteRecord(EEmpire.Red, planets[i]);
      Magnet.deleteRecord(EEmpire.Blue, planets[i]);
      Magnet.deleteRecord(EEmpire.Green, planets[i]);
    }
    PlanetsSet.clear();
    CitadelPlanetsSet.clear();
    EmpirePlanetsSet.clear(EEmpire.Red);
    EmpirePlanetsSet.clear(EEmpire.Blue);
    EmpirePlanetsSet.clear(EEmpire.Green);
    PointsMap.clear(EEmpire.Red);
    PointsMap.clear(EEmpire.Blue);
    PointsMap.clear(EEmpire.Green);
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
