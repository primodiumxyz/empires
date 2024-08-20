// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { ShieldEater, P_ShieldEaterConfig, Planet, PlanetData } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";

import { pseudorandom, coordToId } from "src/utils.sol";
import { CoordData } from "src/Types.sol";

import { console } from "forge-std/console.sol";

/**
 * @title LibShieldEater
 * @dev A library for managing Shield Eater Event and Override in the Primodium Empires game.
 */
library LibShieldEater {
  /**
   * @dev Randomly selects a starting planet for the Shield Eater.
   */
  function initialize() internal {
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    uint256 randomIndex = pseudorandom(block.number, planetIds.length);
    ShieldEater.setCurrentPlanet(planetIds[randomIndex]);
    ShieldEater.setCurrentCharge(0);
    retarget();

    // Where is the Shield Eater now?
    PlanetData memory tmpPlanet = Planet.get(planetIds[randomIndex]);
    CoordData memory src = CoordData(tmpPlanet.q, tmpPlanet.r);

    // Where is the Shield Eater going?
    tmpPlanet = Planet.get(ShieldEater.getDestinationPlanet());
    CoordData memory dst = CoordData(tmpPlanet.q, tmpPlanet.r);

    // How do we get there?
    CoordData memory offset = getTargetDirection(src, dst);
    uint256 dirAttempts = 1;

    // If there is a hole in the map here, go around it
    while (!Planet.getIsPlanet(coordToId(src.q + offset.q, src.r + offset.r))) {
      if (dirAttempts > 7) {
        // If we've tried all directions, there is no path.
        // should never happen, but want to prevent infinite loop
        break;
      }
      offset = rotateTargetDirection(offset);
      dirAttempts++;
    }

    // Save the Next Planet
    ShieldEater.setNextPlanet(coordToId(src.q + offset.q, src.r + offset.r));
  }

  /**
   * @dev Selects a destination for the Shield Eater, from the top 3 planets with the most shields.
   * @notice This function is overly complicated due to contract size optimizations.
   */
  function retarget() internal {
    // save the top 3 planetIds
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    bytes32[] memory dstOptions = new bytes32[](3);
    uint256 shieldCount = 0;

    for (uint256 i = 0; i < planetIds.length; i++) {
      shieldCount = Planet.getShieldCount(planetIds[i]);
      if (shieldCount >= Planet.getShieldCount(dstOptions[0])) {
        dstOptions[2] = dstOptions[1];
        dstOptions[1] = dstOptions[0];
        dstOptions[0] = planetIds[i];
      } else if (shieldCount >= Planet.getShieldCount(dstOptions[1])) {
        dstOptions[2] = dstOptions[1];
        dstOptions[1] = planetIds[i];
      } else if (shieldCount >= Planet.getShieldCount(dstOptions[2])) {
        dstOptions[2] = planetIds[i];
      }
    }

    uint256 randomIndex = pseudorandom(block.number, 3);
    ShieldEater.setDestinationPlanet(dstOptions[randomIndex]);
  }

  /**
   * @dev Moves the Shield Eater to the next planet en route to the destination planet.
   */
  function update() internal {
    // Move the Shield Eater to the next planet
    bytes32 planetId = ShieldEater.getNextPlanet();
    ShieldEater.setCurrentPlanet(planetId);

    // Eat a little shields if there are any
    uint256 shieldCount = Planet.getShieldCount(planetId);
    uint256 shieldDamage = P_ShieldEaterConfig.getVisitShieldDamage();
    if (shieldCount > shieldDamage) {
      Planet.setShieldCount(planetId, shieldCount - shieldDamage);
      ShieldEater.setCurrentCharge(ShieldEater.getCurrentCharge() + shieldDamage);
    } else if (shieldCount > 0) {
      Planet.setShieldCount(planetId, 0);
      ShieldEater.setCurrentCharge(ShieldEater.getCurrentCharge() + shieldCount);
    }

    // If the Shield Eater has reached its destination, select a new destination
    if (planetId == ShieldEater.getDestinationPlanet()) {
      retarget();
    }

    // How do we get to our Next Planet?

    // Where is the Shield Eater now?
    PlanetData memory tmpPlanet = Planet.get(planetId);
    CoordData memory src = CoordData(tmpPlanet.q, tmpPlanet.r);

    // Where is the Shield Eater going?
    tmpPlanet = Planet.get(ShieldEater.getDestinationPlanet());
    CoordData memory dst = CoordData(tmpPlanet.q, tmpPlanet.r);

    // How do we get there?
    CoordData memory offset = getTargetDirection(src, dst);
    uint256 dirAttempts = 1;

    // If there is a hole in the map here, go around it
    while (!Planet.getIsPlanet(coordToId(src.q + offset.q, src.r + offset.r))) {
      console.log("blocked");
      if (dirAttempts > 7) {
        // If we've tried all directions, there is no path.
        // should never happen, but want to prevent infinite loop
        break;
      }
      offset = rotateTargetDirection(offset);
      console.log("newDir");
      console.logInt(offset.q);
      console.logInt(offset.r);
      dirAttempts++;
    }

    // Save the Next Planet
    ShieldEater.setNextPlanet(coordToId(src.q + offset.q, src.r + offset.r));

    // Where is the Shield Eater now?
    // PlanetData memory tmpPlanet = Planet.get(ShieldEater.getCurrentPlanet());
    // CoordData memory src = CoordData(tmpPlanet.q, tmpPlanet.r);

    // Where is the Shield Eater going?
    // tmpPlanet = Planet.get(ShieldEater.getDestinationPlanet());
    // CoordData memory dst = CoordData(tmpPlanet.q, tmpPlanet.r);

    // How do we get there?
    // uint256 dirAttempts = 1;
    // CoordData memory offset = getTargetDirection(src, dst);

    // // If there is a hole in the map here, go around it
    // while (!Planet.getIsPlanet(coordToId(src.q + offset.q, src.r + offset.r))) {
    //   if (dirAttempts > 6) {
    //     // If we've tried all directions, there is no path.
    //     // should never happen, but want to prevent infinite loop
    //     break;
    //   }
    //   offset = rotateTargetDirection(offset);
    //   dirAttempts++;
    // }

    // Next movement target selected
    // bytes32 planetId = coordToId(src.q + offset.q, src.r + offset.r);

    // Move the Shield Eater to the next planet
    // ShieldEater.setCurrentPlanet(planetId);

    // Eat a little shields if there are any
    // uint256 shieldCount = Planet.getShieldCount(planetId);
    // uint256 shieldChange = P_ShieldEaterConfig.getVisitShieldDamage();
    // if (shieldCount > shieldChange) {
    //   Planet.setShieldCount(planetId, shieldCount - shieldChange);
    //   ShieldEater.setCurrentCharge(ShieldEater.getCurrentCharge() + shieldChange);
    // } else if (shieldCount > 0) {
    //   Planet.setShieldCount(planetId, 0);
    //   ShieldEater.setCurrentCharge(ShieldEater.getCurrentCharge() + shieldCount);
    // }

    // If the Shield Eater has reached its destination, select a new destination
    // if (ShieldEater.getCurrentPlanet() == ShieldEater.getDestinationPlanet()) {
    //   retarget();
    // }
  }

  /**
   * @dev Detonates the Shield Eater at the current location, wiping out shield on all nearby planets.
   */
  function detonate() internal {
    PlanetData memory currentPlanet = Planet.get(ShieldEater.getCurrentPlanet());
    CoordData memory center = CoordData(currentPlanet.q, currentPlanet.r);

    uint256 centerDamage = P_ShieldEaterConfig.getDetonateCenterDamage();
    uint256 adjacentDamage = P_ShieldEaterConfig.getDetonateAdjacentDamage();

    if (centerDamage > 10000) {
      centerDamage = 10000;
    }

    if (adjacentDamage > 10000) {
      adjacentDamage = 10000;
    }

    // Center
    bytes32 planetId = coordToId(center.q, center.r);
    uint256 shieldCount = Planet.getShieldCount(planetId);
    Planet.setShieldCount(planetId, (shieldCount - ((shieldCount * centerDamage) / 10000)));

    // East
    planetId = coordToId(center.q + 1, center.r);
    if (Planet.getIsPlanet(planetId)) {
      shieldCount = Planet.getShieldCount(planetId);
      Planet.setShieldCount(planetId, (shieldCount - ((shieldCount * adjacentDamage) / 10000)));
    }

    // Southeast
    planetId = coordToId(center.q, center.r + 1);
    if (Planet.getIsPlanet(planetId)) {
      shieldCount = Planet.getShieldCount(planetId);
      Planet.setShieldCount(planetId, (shieldCount - ((shieldCount * adjacentDamage) / 10000)));
    }

    // Southwest
    planetId = coordToId(center.q - 1, center.r + 1);
    if (Planet.getIsPlanet(planetId)) {
      shieldCount = Planet.getShieldCount(planetId);
      Planet.setShieldCount(planetId, (shieldCount - ((shieldCount * adjacentDamage) / 10000)));
    }

    // West
    planetId = coordToId(center.q - 1, center.r);
    if (Planet.getIsPlanet(planetId)) {
      shieldCount = Planet.getShieldCount(planetId);
      Planet.setShieldCount(planetId, (shieldCount - ((shieldCount * adjacentDamage) / 10000)));
    }

    // Northwest
    planetId = coordToId(center.q, center.r - 1);
    if (Planet.getIsPlanet(planetId)) {
      shieldCount = Planet.getShieldCount(planetId);
      Planet.setShieldCount(planetId, (shieldCount - ((shieldCount * adjacentDamage) / 10000)));
    }

    // Northeast
    planetId = coordToId(center.q + 1, center.r - 1);
    if (Planet.getIsPlanet(planetId)) {
      shieldCount = Planet.getShieldCount(planetId);
      Planet.setShieldCount(planetId, (shieldCount - ((shieldCount * adjacentDamage) / 10000)));
    }

    ShieldEater.setCurrentCharge(0);
  }

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
  function getTargetDirection(CoordData memory src, CoordData memory dst) internal view returns (CoordData memory dir) {
    uint256 rng = pseudorandom(block.number, 10);
    if (dst.q > src.q) {
      dir.q = 1;
      // East or Northeast
      if (rng < 5) {
        dir.r = 0; // East
      } else {
        dir.r = -1; // Northeast
      }
    } else if (dst.q == src.q) {
      dir.q = 0;
      // Northwest or Southeast
      if (rng < 5) {
        dir.r = 1; // Southeast
      } else {
        dir.r = -1; // Northwest
      }
    } else {
      // dst.q < src.q
      dir.q = -1; //  West or Southwest
      if (rng < 5) {
        dir.r = 0; // West
      } else {
        dir.r = 1; // Southwest
      }
    }
    console.log("dir");
    console.logInt(dir.q);
    console.logInt(dir.r);
  }
  /**
   * @dev Rotates a direction 60 degrees clockwise, to avoid a gap in the planet map.
   */
  function rotateTargetDirection(CoordData memory dir) internal view returns (CoordData memory newDir) {
    uint256 rng = pseudorandom(block.number, 10);

    // We were trying to go east, so we'll try northeast or southeast
    if (dir.q == 1 && dir.r == 0) {
      if (rng < 5) {
        newDir.q = 1; // Northeast
        newDir.r = -1; // Northeast
      } else {
        newDir.q = 0; // Southeast
        newDir.r = 1; // Southeast
      }
    }
    // We were trying to go southeast, so we'll try east or southwest
    else if (dir.q == 0 && dir.r == 1) {
      if (rng < 5) {
        newDir.q = 1; // Southeast
        newDir.r = 0; // Southeast
      } else {
        newDir.q = -1; // Southwest
        newDir.r = 1; // Southwest
      }
    }
    // We were trying to go southwest, so we'll try southeast or west
    else if (dir.q == -1 && dir.r == 1) {
      if (rng < 5) {
        newDir.q = 0; // Southwest
        newDir.r = 1; // Southwest
      } else {
        newDir.q = -1; // West
        newDir.r = 0; // West
      }
    }
    // We were trying to go west, so we'll try southwest or northwest
    else if (dir.q == -1 && dir.r == 0) {
      if (rng < 5) {
        newDir.q = -1; // West
        newDir.r = 0; // West
      } else {
        newDir.q = 0; // Northwest
        newDir.r = -1; // Northwest
      }
    }
    // We were trying to go northwest, so we'll try west or northeast
    else if (dir.q == 0 && dir.r == -1) {
      if (rng < 5) {
        newDir.q = -1; // Northwest
        newDir.r = 1; // Northwest
      } else {
        newDir.q = 1; // Northeast
        newDir.r = -1; // Northeast
      }
    }
    // We were trying to go northeast, so we'll try northwest or east
    else if (dir.q == 1 && dir.r == -1) {
      if (rng < 5) {
        newDir.q = 1; // Northeast
        newDir.r = -1; // Northeast
      } else {
        newDir.q = 1; // East
        newDir.r = 0; // East
      }
    }

    console.log("newDir");
    console.logInt(newDir.q);
    console.logInt(newDir.r);
  }
}
