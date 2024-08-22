// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { ShieldEater, P_ShieldEaterConfig, Planet, PlanetData } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EDirection } from "codegen/common.sol";

import { pseudorandom, pseudorandomEntity, coordToId } from "src/utils.sol";
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
    ShieldEater.setRetargetPending(true);
  }

  // TODO: old retarget with randomness, saving for future work.  -kethic 8.22.2024

  // /**
  //  * @dev Selects a destination for the Shield Eater, from the top 3 planets with the most shields.
  //  * @notice This function is overly complicated due to contract size optimizations.
  //  */
  // function retarget() internal {
  //   bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
  //   bytes32[] memory dstOptions = new bytes32[](3);
  //   uint256 shieldCount = 0;
  //   bytes32 currentPlanet = ShieldEater.getCurrentPlanet();

  //   // find the top 3 planets with the most shields
  //   for (uint256 i = 0; i < planetIds.length; i++) {
  //     // skip if it's the current planet
  //     if (planetIds[i] == currentPlanet) {
  //       continue;
  //     }
  //     shieldCount = Planet.getShieldCount(planetIds[i]);
  //     if (shieldCount >= Planet.getShieldCount(dstOptions[0])) {
  //       dstOptions[2] = dstOptions[1];
  //       dstOptions[1] = dstOptions[0];
  //       dstOptions[0] = planetIds[i];
  //     } else if (shieldCount >= Planet.getShieldCount(dstOptions[1])) {
  //       dstOptions[2] = dstOptions[1];
  //       dstOptions[1] = planetIds[i];
  //     } else if (shieldCount >= Planet.getShieldCount(dstOptions[2])) {
  //       dstOptions[2] = planetIds[i];
  //     }
  //   }

  //   // choose of the top 3 planets
  //   uint256 randomIndex = pseudorandom(uint256(pseudorandomEntity()), 3);

  //   // if there are no shields on the map, it tends to gravitate towards the bottom center.
  //   // this will force it to wander around a bit more even if there's nothing to eat.
  //   if (Planet.getShieldCount(dstOptions[randomIndex]) == 0) {
  //     randomIndex = pseudorandom(uint256(pseudorandomEntity()), planetIds.length);
  //   }

  //   ShieldEater.setDestinationPlanet(dstOptions[randomIndex]);
  // }

  /**
   * @dev Selects a destination for the Shield Eater, from the top 3 planets with the most shields.
   * @notice This function is overly complicated due to contract size optimizations.
   */
  function retarget() internal {
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    bytes32 currentPlanet = ShieldEater.getCurrentPlanet();
    bytes32 newDestination;
    uint256 shieldCount;
    uint256 maxShieldCount;

    // find the top 3 planets with the most shields
    for (uint256 i = 0; i < planetIds.length; i++) {
      // skip if it's the current planet
      if (planetIds[i] == currentPlanet) {
        continue;
      }
      shieldCount = Planet.getShieldCount(planetIds[i]);
      if (shieldCount >= maxShieldCount) {
        newDestination = planetIds[i];
        maxShieldCount = shieldCount;
      }
    }

    //   // if there are no shields on the map, it tends to gravitate towards the bottom center.
    //   // this will force it to wander around a bit more even if there's nothing to eat.
    if (maxShieldCount == 0) {
      uint256 randomIndex = pseudorandom(uint256(pseudorandomEntity()), planetIds.length);
      ShieldEater.setDestinationPlanet(planetIds[randomIndex]);
    } else {
      ShieldEater.setDestinationPlanet(newDestination);
    }

    ShieldEater.setRetargetCount(ShieldEater.getRetargetCount() + 1);
  }

  /**
   * @dev Moves the Shield Eater to the next planet en route to the destination planet.
   */
  function update() internal {
    // on each call, we either find a new destination or move to the next planet in the path
    // only one of these should happen per update call.

    // if retarget pending, find a new destination
    if (ShieldEater.getRetargetPending()) {
      // how many times have we looped?  If we're stuck, clear the path and try again.
      if (ShieldEater.getRetargetCount() >= P_ShieldEaterConfig.getRetargetMaxThreshold()) {
        // we're stuck.  clear the path.
        ShieldEater.setPathIndex(0);
        bytes32[] memory emptyPath = new bytes32[](0);
        ShieldEater.setPath(emptyPath);

        // reset the retarget count
        ShieldEater.setRetargetCount(0);
      }

      // find new destination
      retarget();

      // if we found a valid destination, don't retarget on next update call
      if (ShieldEater.getDestinationPlanet() != ShieldEater.getCurrentPlanet()) {
        ShieldEater.setRetargetPending(false);
      }
    } else {
      bytes32 destinationPlanet = ShieldEater.getDestinationPlanet();
      bytes32 currentPlanet = ShieldEater.getCurrentPlanet();

      // figure out which way to go, move, and save where we've been
      bytes32 planetId = getDirection(currentPlanet, destinationPlanet);
      ShieldEater.setCurrentPlanet(planetId);
      ShieldEater.pushPath(planetId);
      ShieldEater.setPathIndex(ShieldEater.getPathIndex() + 1);

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

      // we have arrived.  clear the destination so we'll find a new one next update.
      if (planetId == destinationPlanet) {
        ShieldEater.setPathIndex(0);
        bytes32[] memory emptyPath = new bytes32[](0);
        ShieldEater.setPath(emptyPath);
        ShieldEater.setRetargetPending(true);
      }
    }
  }

  /**
   * @dev Detonates the Shield Eater at the current location, wiping out shield on all nearby planets.
   */
  function detonate() internal {
    uint256 centerDamage = P_ShieldEaterConfig.getDetonateCenterDamage();
    uint256 adjacentDamage = P_ShieldEaterConfig.getDetonateAdjacentDamage();

    if (centerDamage > 10000) {
      centerDamage = 10000;
    }

    if (adjacentDamage > 10000) {
      adjacentDamage = 10000;
    }

    // Center
    bytes32 planetId = ShieldEater.getCurrentPlanet();
    uint256 shieldCount = Planet.getShieldCount(planetId);
    Planet.setShieldCount(planetId, (shieldCount - ((shieldCount * centerDamage) / 10000)));

    // for each direction
    bytes32 neighborId;
    for (uint256 i = 2; i < uint256(EDirection.LENGTH); i++) {
      // get the neighbor
      neighborId = getNeighbor(planetId, EDirection(i));

      // if neighbor is a planet
      if (Planet.getIsPlanet(neighborId)) {
        shieldCount = Planet.getShieldCount(neighborId);
        Planet.setShieldCount(neighborId, (shieldCount - ((shieldCount * adjacentDamage) / 10000)));
      }
    }

    ShieldEater.setCurrentCharge(0);
  }

  function getNeighbor(bytes32 planetId, EDirection direction) internal view returns (bytes32 neighbor) {
    PlanetData memory planet = Planet.get(planetId);
    if (direction == EDirection.East) {
      neighbor = coordToId(planet.q + 1, planet.r);
    } else if (direction == EDirection.Southeast) {
      neighbor = coordToId(planet.q, planet.r + 1);
    } else if (direction == EDirection.Southwest) {
      neighbor = coordToId(planet.q - 1, planet.r + 1);
    } else if (direction == EDirection.West) {
      neighbor = coordToId(planet.q - 1, planet.r);
    } else if (direction == EDirection.Northwest) {
      neighbor = coordToId(planet.q, planet.r - 1);
    } else if (direction == EDirection.Northeast) {
      neighbor = coordToId(planet.q + 1, planet.r - 1);
    } else {
      // we appear to have no neighbors. return the current planet
      neighbor = planetId;
    }
  }

  function getDistance(bytes32 src, bytes32 dst) internal view returns (uint256) {
    PlanetData memory srcPlanet = Planet.get(src);
    PlanetData memory dstPlanet = Planet.get(dst);

    int256 qDiff = (dstPlanet.q - srcPlanet.q);
    qDiff *= qDiff;
    int256 rDiff = (dstPlanet.r - srcPlanet.r);
    rDiff *= rDiff;

    return uint256(int256(qDiff + rDiff + 1));
  }

  function getDirection(bytes32 currentNode, bytes32 destinationNode) internal view returns (bytes32 pathNode) {
    bytes32 nextNode;

    uint256 distance = getDistance(currentNode, destinationNode);
    uint256 minDistance = 65535;

    uint256 pathDirection = 0;

    // for each direction
    for (uint256 i = 2; i < uint256(EDirection.LENGTH); i++) {
      // get the neighbor
      nextNode = getNeighbor(currentNode, EDirection(i));

      // if neighbor is a planet
      if (Planet.getIsPlanet(nextNode)) {
        // have we visted this already?
        if (onPath(nextNode)) {
          continue;
        }
        // check distance
        distance = getDistance(nextNode, destinationNode);

        // if distance is less than next distance
        if (distance <= minDistance) {
          // save min distance
          minDistance = distance;

          // save min distance node
          pathNode = nextNode;
          pathDirection = i;
        }
      }
    }
  }

  function onPath(bytes32 planetId) internal view returns (bool) {
    bytes32[] memory path = ShieldEater.getPath();
    uint256 pathIndex = ShieldEater.getPathIndex();
    for (uint256 i = 0; i < pathIndex; i++) {
      if (planetId == path[i]) {
        return true;
      }
    }
    return false;
  }
}
