// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Planet, PlanetData } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";

library LibUpdateWorld {
  function moveDestroyers(bytes32 planetId) internal {
    PlanetData memory planetData = Planet.get(planetId);
    if (planetData.factionId == EEmpire.NULL) return;

    // move destroyers
  }

  function resolveBattles(bytes32 planetId) internal {
    moveDestroyers(planetId);
  }
}
