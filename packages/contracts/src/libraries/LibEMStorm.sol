// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Empire, Player, P_PointConfig, EMStorm, Planet } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";

import { PlanetsSet } from "adts/PlanetsSet.sol";

import { pseudorandom, coordToId } from "src/utils.sol";

/**
 * @title LibEMStorm
 * @dev A library for managing EM Storm Override in the Primodium Empires game.
 */
library LibEMStorm {
  /**
   * @dev Randomly selects a starting planet for the storm.
   */
  function chooseStartingPlanet() internal {
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    uint256 randomIndex = pseudorandom(block.number, planetIds.length);
    EMStorm.setCurrentPlanet(planetIds[randomIndex]);
  }

  /**
   * @dev Selects a destination for the storm, biased towards planets that have
   *      not been visited recently.
   */
  function chooseNextDestination() internal {
    // get a list of all planets
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    bytes32[] memory longestWithoutVisit = new bytes32[](3);
    uint256 longest = 0;

    // TODO: so expensive.  optimize.
    for (uint256 i = 0; i < planetIds.length; i++) {
      if (block.number - Planet.getLastEMStormVisit(planetIds[i]) >= longest) {
        longestWithoutVisit[2] = longestWithoutVisit[1];
        longestWithoutVisit[1] = longestWithoutVisit[0];
        longestWithoutVisit[0] = planetIds[i];
      }
    }

    uint256 randomIndex = pseudorandom(block.number, 3);
    EMStorm.setDestinationPlanet(longestWithoutVisit[randomIndex]);
  }

  function createPendingEMStormMove() internal {
    // get current location
    bytes32 currentPlanet = EMStorm.getCurrentPlanet();

    // get destination
    bytes32 destinationPlanet = EMStorm.getDestinationPlanet();

    // get surrounding planets
  }
}
