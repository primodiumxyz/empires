// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { addressToId } from "src/utils.sol";

import { Empire, P_PointConfig, ShieldEater, P_ShieldEaterConfig, Planet, PlanetData } from "codegen/index.sol";
import { EEmpire, EDirection } from "codegen/common.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { LibShieldEater } from "libraries/LibShieldEater.sol";

import { pseudorandom, coordToId } from "src/utils.sol";
import { CoordData } from "src/Types.sol";

contract LibShieldEaterTest is PrimodiumTest {
  function setUp() public override {
    super.setUp();
  }

  function testInitialize(uint256 fuzz) public {
    vm.startPrank(creator);
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    assertTrue(planetIds.length > 0, "LibShieldEater: planetIds.length is 0");

    // set a random block.number
    fuzz = bound(fuzz, 1000000, 1e36);
    vm.roll(fuzz);

    // choose a starting planet
    LibShieldEater.initialize();

    // check that it is a valid planetId
    assertTrue(PlanetsSet.has(ShieldEater.getCurrentPlanet()), "LibShieldEater: planetId not contained in PlanetsSet");
  }

  function testShieldEaterUpdate(uint256 fuzz) public {
    vm.startPrank(creator);
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();

    // set a random block.number
    fuzz = bound(fuzz, 1000000, 1e36);
    vm.roll(fuzz);

    // populate shieldCount for all planets
    for (uint256 i = 0; i < planetIds.length; i++) {
      Planet.setShieldCount(planetIds[i], 1);
    }

    LibShieldEater.initialize();

    // first update will set the destination node
    LibShieldEater.update();

    PlanetData memory currPlanetData = Planet.get(ShieldEater.getCurrentPlanet());
    PlanetData memory destPlanetData = Planet.get(ShieldEater.getDestinationPlanet());

    uint256 loopcount = 0;

    while (destPlanetData.q != currPlanetData.q || destPlanetData.r != currPlanetData.r) {
      LibShieldEater.update();
      currPlanetData = Planet.get(ShieldEater.getCurrentPlanet());
      destPlanetData = Planet.get(ShieldEater.getDestinationPlanet());
      loopcount++;

      // if we've reached the destination, then the path has been cleared
      // so only run these checks if we're still en route
      if (ShieldEater.getCurrentPlanet() != ShieldEater.getDestinationPlanet()) {
        // the current planet was already pushed to the path, so we should find it once, but not twice
        bytes32[] memory path = ShieldEater.getPath();
        uint256 foundCount = 0;
        for (uint256 i = 0; i < path.length; i++) {
          if (path[i] == ShieldEater.getCurrentPlanet()) {
            foundCount++;
          }
        }
        assertFalse(foundCount == 0, "LibShieldEater: ShieldEater did not log current plan into path.");
        assertFalse(foundCount > 1, "LibShieldEater: ShieldEater walked over its own path.");
      }

      // and that it eats the correct number of shields along the way
      assertTrue(ShieldEater.getCurrentCharge() == loopcount * 2, "LibShieldEater: CurrentCharge != loopcount");
    }

    assertTrue(loopcount < planetIds.length, "LibShieldEater: loopcount exceeded planetIds.length");

    assertEq(currPlanetData.q, destPlanetData.q, "LibShieldEater: currPlanetData.q != destPlanetData.q");
    assertEq(currPlanetData.r, destPlanetData.r, "LibShieldEater: currPlanetData.r != destPlanetData.r");

    assertTrue(ShieldEater.getRetargetPending(), "LibShieldEater: RetargetPending not true.");
    assertTrue(ShieldEater.getPath().length == 0, "LibShieldEater: Path not empty.");
    assertTrue(ShieldEater.getPathIndex() == 0, "LibShieldEater: PathIndex not zero.");
  }

  function testShieldEaterRetarget(uint256 fuzz) public {
    vm.startPrank(creator);
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    bytes32 newDestination;
    uint256 maxShieldCount = 0;
    uint256 i = 0;

    // set a random block.number
    fuzz = bound(fuzz, 1000000, 1e36);
    vm.roll(fuzz);

    // populate shieldCount for all planets
    for (i = 0; i < planetIds.length; i++) {
      Planet.setShieldCount(planetIds[i], pseudorandom(i, 100));
    }

    // find planet with highest shields
    for (i = 0; i < planetIds.length; i++) {
      // skip if it's the current planet
      if (planetIds[i] == ShieldEater.getCurrentPlanet()) {
        continue;
      }
      if (Planet.getShieldCount(planetIds[i]) >= maxShieldCount) {
        maxShieldCount = Planet.getShieldCount(planetIds[i]);
        newDestination = planetIds[i];
      }
    }

    // choose a next destination (which should be the planet with highest shields)
    LibShieldEater.retarget();

    console.log("ShieldEater.getDestinationPlanet():");
    console.logBytes32(ShieldEater.getDestinationPlanet());

    // check that it is a valid planetId
    assertTrue(
      PlanetsSet.has(ShieldEater.getDestinationPlanet()),
      "LibShieldEater: planetId not contained in PlanetsSet"
    );
  }

  function testShieldEaterRetargetSecondHighest(uint256 fuzz) public {
    vm.startPrank(creator);
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    uint256 i = 0;

    // set a random block.number
    fuzz = bound(fuzz, 1000000, 1e36);
    vm.roll(fuzz);

    // populate shieldCount for all planets
    for (i = 0; i < planetIds.length; i++) {
      Planet.setShieldCount(planetIds[i], pseudorandom(i, 100));
    }

    bytes32 highest;
    bytes32 secondHighest;

    uint256 highShieldCount = 0;

    // find planet with highest shields
    for (i = 0; i < planetIds.length; i++) {
      if (Planet.getShieldCount(planetIds[i]) >= highShieldCount) {
        highShieldCount = Planet.getShieldCount(planetIds[i]);
        highest = planetIds[i];
      }
    }

    // place the SheidlEater on planet with highest shield count
    ShieldEater.setCurrentPlanet(highest);

    // find planet with second highest shields
    highShieldCount = 0;
    for (i = 0; i < planetIds.length; i++) {
      // skip highest
      if (planetIds[i] == highest) {
        continue;
      }
      if (Planet.getShieldCount(planetIds[i]) >= highShieldCount) {
        highShieldCount = Planet.getShieldCount(planetIds[i]);
        secondHighest = planetIds[i];
      }
    }

    // choose a next destination (which should be the planet with second highest shields)
    LibShieldEater.retarget();

    // destination should be second highest
    assertEq(ShieldEater.getDestinationPlanet(), secondHighest, "LibShieldEater: destination not second highest.");
  }

  function testShieldEaterDetonate(uint256 fuzz) public {
    vm.startPrank(creator);

    // set a random block.number
    fuzz = bound(fuzz, 1000000, 1e36);
    vm.roll(fuzz);

    uint256 centerDamage = P_ShieldEaterConfig.getDetonateCenterDamage();
    if (centerDamage > 10000) {
      centerDamage = 10000;
    }

    uint256 adjacentDamage = P_ShieldEaterConfig.getDetonateAdjacentDamage();
    if (adjacentDamage > 10000) {
      adjacentDamage = 10000;
    }

    bytes32 centerPlanet = ShieldEater.getCurrentPlanet();
    bytes32 neighborPlanet;

    uint256 baseShieldCount = 10;
    uint256 preShieldCount;
    uint256 postShieldCount;

    // Center
    Planet.setShieldCount(centerPlanet, baseShieldCount);

    for (uint256 i = 2; i < uint256(EDirection.LENGTH); i++) {
      // get the neighbor
      neighborPlanet = LibShieldEater.getNeighbor(centerPlanet, EDirection(i));

      // if neighbor is a planet
      if (Planet.getIsPlanet(neighborPlanet)) {
        Planet.setShieldCount(neighborPlanet, baseShieldCount + i);
      }
    }

    LibShieldEater.detonate();

    preShieldCount = baseShieldCount;
    postShieldCount = Planet.getShieldCount(centerPlanet);

    assertTrue(
      postShieldCount == preShieldCount - ((preShieldCount * centerDamage) / 10000),
      "LibShieldEater: incorrect shield damage to center."
    );

    assertEq(ShieldEater.getCurrentCharge(), 0, "LibShieldEater: CurrentCharge not zero.");

    for (uint256 i = 2; i < uint256(EDirection.LENGTH); i++) {
      // get the neighbor
      neighborPlanet = LibShieldEater.getNeighbor(centerPlanet, EDirection(i));

      // if neighbor is a planet
      if (Planet.getIsPlanet(neighborPlanet)) {
        preShieldCount = baseShieldCount + i;
        postShieldCount = Planet.getShieldCount(neighborPlanet);

        assertTrue(
          postShieldCount == preShieldCount - ((preShieldCount * adjacentDamage) / 10000),
          "LibShieldEater: incorrect shield damage to neighbor."
        );
      }
    }
  }

  function testShieldEaterGetDirection() public {}
}
