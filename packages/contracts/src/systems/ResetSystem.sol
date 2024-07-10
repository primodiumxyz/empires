// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { FactionPlanetsSet } from "adts/FactionPlanetsSet.sol";
import { EEmpire } from "codegen/common.sol";
import { createPlanets } from "libraries/CreatePlanets.sol";
import { initPrice } from "libraries/InitPrice.sol";
import { RakeTaken, WinningEmpire, P_GameConfig } from "codegen/index.sol";

contract ResetSystem is System {
  function resetGame() public {
    PlanetsSet.clear();
    FactionPlanetsSet.clear(EEmpire.Red);
    FactionPlanetsSet.clear(EEmpire.Blue);
    FactionPlanetsSet.clear(EEmpire.Green);
    RakeTaken.set(false);
    WinningEmpire.set(EEmpire.NULL);

    P_GameConfig.setGameOverBlock(block.number + 1_000);
    createPlanets(); // Planet and Faction tables are reset to default values
    initPrice(); // Faction.setPointCost and ActionCost tables are reset to default values
  }
}
