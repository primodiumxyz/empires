// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Empire, Player, P_PointConfig, ShieldEater, Planet, PlanetData } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";

import { PlanetsSet } from "adts/PlanetsSet.sol";

import { pseudorandom, coordToId } from "src/utils.sol";
import { CoordData } from "src/Types.sol";

/**
 * @title LibShieldEater
 * @dev A library for managing Shield Eater Event and Override in the Primodium Empires game.
 */
library LibShieldEater {
  /**
   * @dev Randomly selects a starting planet for the Shield Eater.
   */
  function chooseStartingPlanet() internal {
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    uint256 randomIndex = pseudorandom(block.number, planetIds.length);
    ShieldEater.setCurrentPlanet(planetIds[randomIndex]);
    Planet.setLastShieldEaterVisit(planetIds[randomIndex], block.number);
  }

  /**
   * @dev Selects a destination for the Shield Eater, biased towards planets that have
   *      not been visited recently.
   */
  function chooseNextDestination() internal {
    // get a list of all planets
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    bytes32[] memory longestWithoutVisit = new bytes32[](3);
    uint256 longest = 0;

    // TODO: so expensive.  optimize.
    for (uint256 i = 0; i < planetIds.length; i++) {
      if (block.number - Planet.getLastShieldEaterVisit(planetIds[i]) >= longest) {
        longestWithoutVisit[2] = longestWithoutVisit[1];
        longestWithoutVisit[1] = longestWithoutVisit[0];
        longestWithoutVisit[0] = planetIds[i];
      }
    }

    uint256 randomIndex = pseudorandom(block.number, 3);
    ShieldEater.setDestinationPlanet(longestWithoutVisit[randomIndex]);
  }

  /**
   * @dev Moves the Shield Eater to the next planet en route to the destination planet.
   */
  function moveShieldEater() internal {
    PlanetData memory tmpPlanet = Planet.get(ShieldEater.getCurrentPlanet());
    CoordData memory src = CoordData(tmpPlanet.q, tmpPlanet.r);

    tmpPlanet = Planet.get(ShieldEater.getDestinationPlanet());
    CoordData memory dst = CoordData(tmpPlanet.q, tmpPlanet.r);

    CoordData memory offset = getTargetDirection(src, dst);

    if (!Planet.getIsPlanet(coordToId(src.q + offset.q, src.r + offset.r))) {
      offset = rotateTargetDirection(offset);
    }

    ShieldEater.setCurrentPlanet(coordToId(src.q + offset.q, src.r + offset.r));
    Planet.setLastShieldEaterVisit(coordToId(src.q + offset.q, src.r + offset.r), block.number);
  }

  /**
   * @dev Detonates the Shield Eater at the current location, wiping out shield on all nearby planets.
   */
  function detonateShieldEater() internal {}

  /********************/
  /* HELPER FUNCTIONS */
  /********************/

  // Direction Offsets
  // EDirection.East: [1, 0],
  // EDirection.Southeast: [0, 1],
  // EDirection.Southwest: [-1, 1],
  // EDirection.West: [-1, 0],
  // EDirection.Northwest: [0, -1],
  // EDirection.Northeast: [1, -1]

  // q = x, r = y
  // q is right positive
  // r is down positive

  /**
   * @dev Returns the direction to move to advance from the source to the destination.
   */

  function getTargetDirection(CoordData memory src, CoordData memory dst) internal pure returns (CoordData memory dir) {
    if (dst.q > src.q) {
      dir.q = 1; // East or Northeast
      if (dst.r > src.r) {
        dir.r = 0; // East
      } else {
        dir.r = -1; // Northeast
      }
    } else if (dst.q == src.q) {
      dir.q = 0; // Northwest or Southeast
      if (dst.r > src.r) {
        dir.r = 1; // Southeast
      } else {
        dir.r = -1; // Northwest
      }
    } else {
      // dst.q < src.q
      dir.q = -1; //  West or Southwest
      if (dst.r > src.r) {
        dir.r = 1; // Southwest
      } else {
        dir.r = 0; // West
      }
    }
  }

  /**
   * @dev Rotates a direction 60 degrees clockwise, to avoid a gap in the planet map.
   */

  function rotateTargetDirection(CoordData memory dir) internal pure returns (CoordData memory newDir) {
    if (dir.q == 1) {
      if (dir.r == 0) {
        //* East
        newDir.q = 0; //* Southeast
        newDir.r = 1;
      } else {
        //* Northeast
        newDir.q = 1; //* East
        newDir.r = 0;
      }
    } else if (dir.q == 0) {
      if (dir.r == 1) {
        //* Southeast
        newDir.q = -1; //* Southwest
        newDir.r = 1;
      } else {
        //* Northwest
        newDir.q = 1; //* Northeast
        newDir.r = -1;
      }
    } else {
      // (dir.q == -1)
      if (dir.r == 0) {
        //* West
        newDir.q = 0; //* Northwest
        newDir.r = -1;
      } else {
        //* Southwest
        newDir.q = -1; //* West
        newDir.r = 0;
      }
    }
  }
}
