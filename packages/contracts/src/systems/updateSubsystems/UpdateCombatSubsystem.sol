// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { LibResolveCombat } from "libraries/LibResolveCombat.sol";

contract UpdateCombatSubsystem is EmpiresSystem {
  function updateCombat() public {
    // resolve combat on all planets
    // todo: only resolve combat on planets that have pending arrivals
    bytes32[] memory planets = PlanetsSet.getPlanetIds();
    for (uint i = 0; i < planets.length; i++) {
      LibResolveCombat.resolveCombat(planets[i]);
    }
  }
}
