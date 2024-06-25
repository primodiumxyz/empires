// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Planet, PlanetData } from "codegen/index.sol";

contract ActionSystem is System {
  function createDestroyer(bytes32 _planetId) public {
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[ActionSystem] Planet not found");
    require(planetData.factionId != bytes32(""), "[ActionSystem] Planet is not owned");

    Planet.setDestroyerCount(_planetId, planetData.destroyerCount + 1);
  }

  function killDestroyer(bytes32 _planetId) public {
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[ActionSystem] Planet not found");
    require(planetData.destroyerCount > 0, "[ActionSystem] No destroyers to kill");
    require(planetData.factionId != bytes32(""), "[ActionSystem] Planet is not owned");

    Planet.setDestroyerCount(_planetId, planetData.destroyerCount - 1);
  }
}
