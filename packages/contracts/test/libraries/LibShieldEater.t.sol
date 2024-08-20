// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { addressToId } from "src/utils.sol";

import { Empire, P_PointConfig, ShieldEater, P_ShieldEaterConfig, Planet, PlanetData } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";
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
      Planet.setShieldCount(planetIds[i], pseudorandom(i, 100));
    }

    LibShieldEater.initialize();
    // LibShieldEater.retarget();

    PlanetData memory currPlanetData = Planet.get(ShieldEater.getCurrentPlanet());
    PlanetData memory destPlanetData = Planet.get(ShieldEater.getDestinationPlanet());

    console.log("               [ q, r]");
    console.log("currPlanetData:");
    console.logInt(currPlanetData.q);
    console.logInt(currPlanetData.r);
    console.log("destPlanetData:");
    console.logInt(destPlanetData.q);
    console.logInt(destPlanetData.r);
    console.log("---");

    uint256 loopcount = 0;

    while (currPlanetData.q != destPlanetData.q || currPlanetData.r != destPlanetData.r) {
      LibShieldEater.update();
      currPlanetData = Planet.get(ShieldEater.getCurrentPlanet());
      console.log("currPlanetData:");
      console.logInt(currPlanetData.q);
      console.logInt(currPlanetData.r);
      loopcount++;
      if (loopcount > 20) {
        break;
      }
    }

    assertEq(currPlanetData.q, destPlanetData.q, "LibShieldEater: currPlanetData.q != destPlanetData.q");
    assertEq(currPlanetData.r, destPlanetData.r, "LibShieldEater: currPlanetData.r != destPlanetData.r");
  }

  function testShieldEaterRetarget(uint256 fuzz) public {
    vm.startPrank(creator);
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    bytes32[3] memory testTargets;
    uint256 maxShieldCount = 0;
    uint256 i = 0;

    // set a random block.number
    fuzz = bound(fuzz, 1000000, 1e36);
    vm.roll(fuzz);

    // populate shieldCount for all planets
    for (i = 0; i < planetIds.length; i++) {
      Planet.setShieldCount(planetIds[i], pseudorandom(i, 100));
    }

    for (i = 0; i < planetIds.length; i++) {
      if (Planet.getShieldCount(planetIds[i]) >= maxShieldCount) {
        maxShieldCount = Planet.getShieldCount(planetIds[i]);
        testTargets[0] = planetIds[i];
      }
    }

    maxShieldCount = 0;
    for (i = 0; i < planetIds.length; i++) {
      if (planetIds[i] == testTargets[0]) {
        continue;
      }
      if (Planet.getShieldCount(planetIds[i]) >= maxShieldCount) {
        maxShieldCount = Planet.getShieldCount(planetIds[i]);
        testTargets[1] = planetIds[i];
      }
    }

    maxShieldCount = 0;
    for (i = 0; i < planetIds.length; i++) {
      if (planetIds[i] == testTargets[0] || planetIds[i] == testTargets[1]) {
        continue;
      }
      if (Planet.getShieldCount(planetIds[i]) >= maxShieldCount) {
        maxShieldCount = Planet.getShieldCount(planetIds[i]);
        testTargets[2] = planetIds[i];
      }
    }

    console.log("testTargets:");
    console.logBytes32(testTargets[0]);
    console.logBytes32(testTargets[1]);
    console.logBytes32(testTargets[2]);
    console.log("testTargets[0]: %s", Planet.getShieldCount(testTargets[0]));
    console.log("testTargets[1]: %s", Planet.getShieldCount(testTargets[1]));
    console.log("testTargets[2]: %s", Planet.getShieldCount(testTargets[2]));
    console.log("---");

    // choose a next destination
    LibShieldEater.retarget();

    console.log("ShieldEater.getDestinationPlanet():");
    console.logBytes32(ShieldEater.getDestinationPlanet());

    // check that it is a valid planetId
    assertTrue(
      PlanetsSet.has(ShieldEater.getDestinationPlanet()),
      "LibShieldEater: planetId not contained in PlanetsSet"
    );

    // check that it is one of the top 3 planetIds
    assertTrue(
      ShieldEater.getDestinationPlanet() == testTargets[0] ||
        ShieldEater.getDestinationPlanet() == testTargets[1] ||
        ShieldEater.getDestinationPlanet() == testTargets[2],
      "LibShieldEater: planetId not one of the top 3"
    );
  }

  function testShieldEaterDetonate(uint256 fuzz) public {
    vm.startPrank(creator);

    // set a random block.number
    fuzz = bound(fuzz, 1000000, 1e36);
    vm.roll(fuzz);

    PlanetData memory currentPlanet = Planet.get(ShieldEater.getCurrentPlanet());
    CoordData memory center = CoordData(currentPlanet.q, currentPlanet.r);

    // Center
    Planet.setShieldCount(ShieldEater.getCurrentPlanet(), 10);

    // East
    CoordData memory neighbor = CoordData(center.q + 1, center.r);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      Planet.setShieldCount(coordToId(neighbor.q, neighbor.r), 11);
    }

    // Southeast
    neighbor = CoordData(center.q, center.r + 1);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      Planet.setShieldCount(coordToId(neighbor.q, neighbor.r), 12);
    }

    // Southwest
    neighbor = CoordData(center.q - 1, center.r + 1);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      Planet.setShieldCount(coordToId(neighbor.q, neighbor.r), 13);
    }

    // West
    neighbor = CoordData(center.q - 1, center.r);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      Planet.setShieldCount(coordToId(neighbor.q, neighbor.r), 14);
    }

    // Northwest
    neighbor = CoordData(center.q, center.r - 1);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      Planet.setShieldCount(coordToId(neighbor.q, neighbor.r), 15);
    }

    // Northeast
    neighbor = CoordData(center.q + 1, center.r - 1);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      Planet.setShieldCount(coordToId(neighbor.q, neighbor.r), 16);
    }

    LibShieldEater.detonate();

    assertEq(Planet.getShieldCount(ShieldEater.getCurrentPlanet()), 0, "LibShieldEater: Center shieldCount not zero.");

    // East
    neighbor = CoordData(center.q + 1, center.r);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      assertEq(Planet.getShieldCount(coordToId(neighbor.q, neighbor.r)), 6, "LibShieldEater: East shieldCount not 6.");
    }

    // Southeast
    neighbor = CoordData(center.q, center.r + 1);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      assertEq(
        Planet.getShieldCount(coordToId(neighbor.q, neighbor.r)),
        6,
        "LibShieldEater: Southeast shieldCount not 6."
      );
    }

    // Southwest
    neighbor = CoordData(center.q - 1, center.r + 1);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      assertEq(
        Planet.getShieldCount(coordToId(neighbor.q, neighbor.r)),
        7,
        "LibShieldEater: Southwest shieldCount not 7."
      );
    }

    // West
    neighbor = CoordData(center.q - 1, center.r);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      assertEq(Planet.getShieldCount(coordToId(neighbor.q, neighbor.r)), 7, "LibShieldEater: West shieldCount not 7.");
    }

    // Northwest
    neighbor = CoordData(center.q, center.r - 1);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      assertEq(
        Planet.getShieldCount(coordToId(neighbor.q, neighbor.r)),
        8,
        "LibShieldEater: Northwest shieldCount not 8."
      );
    }

    // Northeast
    neighbor = CoordData(center.q + 1, center.r - 1);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      assertEq(
        Planet.getShieldCount(coordToId(neighbor.q, neighbor.r)),
        8,
        "LibShieldEater: Northeast shieldCount not 8."
      );
    }
  }

  function testShieldEaterDeepNavSim() public {
    uint256 turn = 1000;
    vm.startPrank(creator);
    vm.roll(turn);
    LibShieldEater.initialize();
    assertTrue(PlanetsSet.has(ShieldEater.getCurrentPlanet()), "getCurrentPlanet planetId not contained in PlanetsSet");
    LibShieldEater.retarget();
    assertTrue(
      PlanetsSet.has(ShieldEater.getDestinationPlanet()),
      "getDestinationPlanet planetId not contained in PlanetsSet"
    );

    PlanetData memory currPlanetData = Planet.get(ShieldEater.getCurrentPlanet());
    PlanetData memory destPlanetData = Planet.get(ShieldEater.getDestinationPlanet());

    for (uint256 i = 0; i < 10; i++) {
      console.log("loop[%s]", i);
      // vm.roll(turn + i);
      console.log(
        "dest[%s]: [%s,%s]",
        destPlanetData.shieldCount,
        uint256(int256(destPlanetData.q)),
        uint256(int256(destPlanetData.r))
      );

      console.log(
        "curr[%s]: [%s,%s]",
        currPlanetData.shieldCount,
        uint256(int256(currPlanetData.q)),
        uint256(int256(currPlanetData.r))
      );

      while (currPlanetData.q != destPlanetData.q || currPlanetData.r != destPlanetData.r) {
        LibShieldEater.update();
        currPlanetData = Planet.get(ShieldEater.getCurrentPlanet());
        destPlanetData = Planet.get(ShieldEater.getDestinationPlanet());
        console.log(
          "curr[%s]: [%s,%s]",
          currPlanetData.shieldCount,
          uint256(int256(currPlanetData.q)),
          uint256(int256(currPlanetData.r))
        );
      }
    }
  }
}
