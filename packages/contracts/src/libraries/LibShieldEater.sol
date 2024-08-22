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

    do {
      retarget();
    } while (ShieldEater.getDestinationPlanet() == ShieldEater.getCurrentPlanet());

    bytes32[] memory foundPath = LibShieldEater.getPath();
    ShieldEater.setPath(foundPath);
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

    uint256 randomIndex = pseudorandom(uint256(pseudorandomEntity()), 3);
    ShieldEater.setDestinationPlanet(dstOptions[randomIndex]);
  }

  /**
   * @dev Moves the Shield Eater to the next planet en route to the destination planet.
   */
  function update() internal {
    bytes32 planetId;
    uint256 index = ShieldEater.getPathIndex();

    // Move the Shield Eater to the next planet
    if (ShieldEater.lengthPath() > index) {
      planetId = ShieldEater.getItemPath(index);
      ShieldEater.setPathIndex(index + 1);
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
    }

    // If the Shield Eater has reached its destination, or we have no path, select a new destination
    if (planetId == ShieldEater.getDestinationPlanet()) {
      do {
        retarget();
      } while (ShieldEater.getDestinationPlanet() == ShieldEater.getCurrentPlanet());

      // What's our new path?
      bytes32[] memory foundPath = getPath();
      ShieldEater.setPath(foundPath);
      ShieldEater.setPathIndex(0);
    }
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

  // /**
  //  * @dev Returns the direction to move to advance from the source to the destination.
  //  */
  // function getTargetDirection(CoordData memory src, CoordData memory dst) internal view returns (CoordData memory dir) {
  //   uint256 rng = pseudorandom(block.number, 10);
  //   if (dst.q > src.q) {
  //     dir.q = 1;
  //     // East or Northeast
  //     if (rng < 5) {
  //       dir.r = 0; // East
  //     } else {
  //       dir.r = -1; // Northeast
  //     }
  //   } else if (dst.q == src.q) {
  //     dir.q = 0;
  //     // Northwest or Southeast
  //     if (rng < 5) {
  //       dir.r = 1; // Southeast
  //     } else {
  //       dir.r = -1; // Northwest
  //     }
  //   } else {
  //     // dst.q < src.q
  //     dir.q = -1; //  West or Southwest
  //     if (rng < 5) {
  //       dir.r = 0; // West
  //     } else {
  //       dir.r = 1; // Southwest
  //     }
  //   }
  //   // console.log("dir");
  //   // console.logInt(dir.q);
  //   // console.logInt(dir.r);

  //   uint256 dirAttempts = 1;

  //   // If there is a hole in the map here, go around it
  //   while (
  //     (!Planet.getIsPlanet(coordToId(src.q + dir.q, src.r + dir.r))) ||
  //     (ShieldEater.getPreviousPlanet() == coordToId(src.q + dir.q, src.r + dir.r))
  //   ) {
  //     if (dirAttempts > 7) {
  //       // If we've tried all directions, there is no path.
  //       // should never happen, but want to prevent infinite loop
  //       break;
  //     }
  //     dir = rotateTargetDirection(dir, dirAttempts);
  //     dirAttempts++;
  //   }
  // }
  // /**
  //  * @dev Rotates a direction 60 degrees clockwise, to avoid a gap in the planet map.
  //  */
  // function rotateTargetDirection(CoordData memory dir, uint256 salt) internal view returns (CoordData memory newDir) {
  //   uint256 rng = pseudorandom(block.number + salt, 10);

  //   // We were trying to go east, so we'll try northeast or southeast
  //   if (dir.q == 1 && dir.r == 0) {
  //     if (rng < 5) {
  //       newDir.q = 1; // Northeast
  //       newDir.r = -1; // Northeast
  //     } else {
  //       newDir.q = 0; // Southeast
  //       newDir.r = 1; // Southeast
  //     }
  //   }
  //   // We were trying to go southeast, so we'll try east or southwest
  //   else if (dir.q == 0 && dir.r == 1) {
  //     if (rng < 5) {
  //       newDir.q = 1; // Southeast
  //       newDir.r = 0; // Southeast
  //     } else {
  //       newDir.q = -1; // Southwest
  //       newDir.r = 1; // Southwest
  //     }
  //   }
  //   // We were trying to go southwest, so we'll try southeast or west
  //   else if (dir.q == -1 && dir.r == 1) {
  //     if (rng < 5) {
  //       newDir.q = 0; // Southwest
  //       newDir.r = 1; // Southwest
  //     } else {
  //       newDir.q = -1; // West
  //       newDir.r = 0; // West
  //     }
  //   }
  //   // We were trying to go west, so we'll try southwest or northwest
  //   else if (dir.q == -1 && dir.r == 0) {
  //     if (rng < 5) {
  //       newDir.q = -1; // West
  //       newDir.r = 0; // West
  //     } else {
  //       newDir.q = 0; // Northwest
  //       newDir.r = -1; // Northwest
  //     }
  //   }
  //   // We were trying to go northwest, so we'll try west or northeast
  //   else if (dir.q == 0 && dir.r == -1) {
  //     if (rng < 5) {
  //       newDir.q = -1; // Northwest
  //       newDir.r = 1; // Northwest
  //     } else {
  //       newDir.q = 1; // Northeast
  //       newDir.r = -1; // Northeast
  //     }
  //   }
  //   // We were trying to go northeast, so we'll try northwest or east
  //   else if (dir.q == 1 && dir.r == -1) {
  //     if (rng < 5) {
  //       newDir.q = 1; // Northeast
  //       newDir.r = -1; // Northeast
  //     } else {
  //       newDir.q = 1; // East
  //       newDir.r = 0; // East
  //     }
  //   }

  //   // console.log("newDir");
  //   // console.logInt(newDir.q);
  //   // console.logInt(newDir.r);
  // }

  function getNeighbor(bytes32 planetId, EDirection direction) internal view returns (bytes32 neighbor) {
    PlanetData memory planet = Planet.get(planetId);
    if (direction == EDirection.East) {
      // console.log("Looking East");
      neighbor = coordToId(planet.q + 1, planet.r);
    } else if (direction == EDirection.Southeast) {
      // console.log("Looking Southeast");
      neighbor = coordToId(planet.q, planet.r + 1);
    } else if (direction == EDirection.Southwest) {
      // console.log("Looking Southwest");
      neighbor = coordToId(planet.q - 1, planet.r + 1);
    } else if (direction == EDirection.West) {
      // console.log("Looking West");
      neighbor = coordToId(planet.q - 1, planet.r);
    } else if (direction == EDirection.Northwest) {
      // console.log("Looking Northwest");
      neighbor = coordToId(planet.q, planet.r - 1);
    } else if (direction == EDirection.Northeast) {
      // console.log("Looking Northeast");
      neighbor = coordToId(planet.q + 1, planet.r - 1);
    } else {
      // console.log("Looking Nowhere");
    }

    if (neighbor == bytes32(0)) {
      // console.log("No neighbor found in that direction");
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

  function getDirection(
    bytes32 currentNode,
    bytes32 destinationNode,
    bytes32[] memory path,
    uint256 pathIndex
  ) internal view returns (bytes32 pathNode) {
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
        if (onPath(nextNode, path, pathIndex)) {
          // console.log("Already Visited");
          continue;
        }
        // check distance
        distance = getDistance(nextNode, destinationNode);
        // console.log("Distance: %s", distance);

        // if distance is less than next distance
        if (distance <= minDistance) {
          // save min distance
          minDistance = distance;
          // save min distance node
          pathNode = nextNode;
          pathDirection = i;
        }
      } else {
        // console.log("Not a planet");
      }
    }

    if (pathDirection == uint256(EDirection.East)) {
      // console.log("Moving East");
    } else if (pathDirection == uint256(EDirection.Southeast)) {
      // console.log("Moving Southeast");
    } else if (pathDirection == uint256(EDirection.Southwest)) {
      // console.log("Moving Southwest");
    } else if (pathDirection == uint256(EDirection.West)) {
      // console.log("Moving West");
    } else if (pathDirection == uint256(EDirection.Northwest)) {
      // console.log("Moving Northwest");
    } else if (pathDirection == uint256(EDirection.Northeast)) {
      // console.log("Moving Northeast");
    } else {
      // console.log("No Path Found");
    }
  }

  function onPath(bytes32 planetId, bytes32[] memory path, uint256 pathIndex) internal pure returns (bool) {
    for (uint256 i = 0; i < pathIndex; i++) {
      if (planetId == path[i]) {
        return true;
      }
    }
    return false;
  }

  function getPath() internal view returns (bytes32[] memory path) {
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    bytes32[] memory tempPath = new bytes32[](planetIds.length);
    PlanetData memory planetData;

    bytes32 startingNode = ShieldEater.getCurrentPlanet();
    bytes32 destinationNode = ShieldEater.getDestinationPlanet();

    bytes32 currentNode = startingNode;
    uint256 pathIndex = 0;
    uint256 loopIndex = 0;

    planetData = Planet.get(startingNode);
    // console.log("Starting Node [%s,%s]", uint256(int256(planetData.q)), uint256(int256(planetData.r)));
    // console.log(uint256(startingNode));

    planetData = Planet.get(destinationNode);
    // console.log("Destination Node [%s,%s]\n", uint256(int256(planetData.q)), uint256(int256(planetData.r)));
    // console.log(uint256(destinationNode));

    planetData = Planet.get(currentNode);
    // console.log("currentNode Node [%s,%s]", uint256(int256(planetData.q)), uint256(int256(planetData.r)));
    // is the current node the destination node?
    while (currentNode != destinationNode) {
      // get the next node
      currentNode = getDirection(currentNode, destinationNode, tempPath, pathIndex);

      planetData = Planet.get(currentNode);
      // console.log("currentNode Node [%s,%s]", uint256(int256(planetData.q)), uint256(int256(planetData.r)));
      // console.log(uint256(currentNode));

      // add the current node to the path
      tempPath[pathIndex] = currentNode;
      pathIndex++;
      loopIndex++;
      if (loopIndex >= planetIds.length) {
        break;
      }
    }

    path = new bytes32[](pathIndex);
    for (uint256 i = 0; i < pathIndex; i++) {
      path[i] = tempPath[i];
    }
  }
}
