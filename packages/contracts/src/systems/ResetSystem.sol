// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { FactionPlanetsSet } from "adts/FactionPlanetsSet.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { EEmpire } from "codegen/common.sol";
import { createPlanets } from "libraries/CreatePlanets.sol";
import { initPrice } from "libraries/InitPrice.sol";
import { WinningEmpire, HistoricalPointCost, P_GameConfig } from "codegen/index.sol";

contract ResetSystem is System {
  function resetGame() public {
    PlanetsSet.clear();
    FactionPlanetsSet.clear(EEmpire.Red);
    FactionPlanetsSet.clear(EEmpire.Blue);
    FactionPlanetsSet.clear(EEmpire.Green);
    PointsMap.clear(EEmpire.Red);
    PointsMap.clear(EEmpire.Blue);
    PointsMap.clear(EEmpire.Green);
    // Does not reset Player table, that's fine. it only contains id and spent
    // by not clearing Player.spent, we can keep track of how much each player has spent over multiple matches

    WinningEmpire.set(EEmpire.NULL);

    P_GameConfig.setGameOverBlock(block.number + 1_000);
    P_GameConfig.setGameStartTimestamp(block.timestamp);
    createPlanets(); // Planet and Faction tables are reset to default values
    initPrice(); // Faction.setPointCost and ActionCost tables are reset to default values
  }
}
