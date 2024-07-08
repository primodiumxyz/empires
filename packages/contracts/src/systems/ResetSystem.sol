// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { FactionPlanetsSet } from "adts/FactionPlanetsSet.sol";
import { EEmpire } from "codegen/common.sol";
import { createPlanets } from "libraries/CreatePlanets.sol";

contract ResetSystem is System {
  function resetGame() public {
    PlanetsSet.clear();
    FactionPlanetsSet.clear(EEmpire.Red);
    FactionPlanetsSet.clear(EEmpire.Blue);
    FactionPlanetsSet.clear(EEmpire.Green);

    createPlanets();
  }
}
