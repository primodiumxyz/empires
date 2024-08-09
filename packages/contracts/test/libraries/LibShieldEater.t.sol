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

    // set a random block.number
    fuzz = bound(fuzz, 1000000, 1e36);
    vm.roll(fuzz);

    LibShieldEater.initialize();
    LibShieldEater.retarget();

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

  //   function retarget() internal {
  //   bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
  //   bytes32[] memory dstOptions = new bytes32[](3);
  //   uint256 largest = 0;

  //   // TODO: so expensive.  rewrite as modulo wrapped writes
  //   for (uint256 i = 0; i < planetIds.length; i++) {
  //     if ((Planet.getShieldCount(planetIds[i]) >= largest) && (planetIds[i] != ShieldEater.getCurrentPlanet())) {
  //       dstOptions[2] = dstOptions[1];
  //       dstOptions[1] = dstOptions[0];
  //       dstOptions[0] = planetIds[i];
  //     }
  //   }

  //   uint256 randomIndex = pseudorandom(block.number, 3);
  //   ShieldEater.setDestinationPlanet(dstOptions[randomIndex]);
  // }

  function testShieldEaterRetarget(uint256 fuzz) public {
    vm.startPrank(creator);
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();

    // set a random block.number
    fuzz = bound(fuzz, 1000000, 1e36);
    vm.roll(fuzz);

    // populate shieldCount for all planets
    for (uint256 i = 0; i < planetIds.length; i++) {
      Planet.setShieldCount(planetIds[i], pseudorandom(i, 100));
    }

    // save the top 3 planetIds
    bytes32[] memory dstOptions = new bytes32[](3);

    for (uint256 i = 0; i < planetIds.length; i++) {
      if (planetIds[i] == ShieldEater.getCurrentPlanet()) {
        continue;
      }
      uint256 shieldCount = Planet.getShieldCount(planetIds[i]);
      if (shieldCount > Planet.getShieldCount(dstOptions[2])) {
        dstOptions[2] = planetIds[i];
        continue;
      }

      if (shieldCount > Planet.getShieldCount(dstOptions[1])) {
        dstOptions[1] = planetIds[i];
        continue;
      }

      if (shieldCount > Planet.getShieldCount(dstOptions[0])) {
        dstOptions[0] = planetIds[i];
        continue;
      }
    }

    console.log("dstOptions:");
    console.logBytes32(dstOptions[0]);
    console.logBytes32(dstOptions[1]);
    console.logBytes32(dstOptions[2]);

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
      ShieldEater.getDestinationPlanet() == dstOptions[0] ||
        ShieldEater.getDestinationPlanet() == dstOptions[1] ||
        ShieldEater.getDestinationPlanet() == dstOptions[2],
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
      assertEq(
        Planet.getShieldCount(coordToId(neighbor.q, neighbor.r)),
        8,
        "LibShieldEater: East shieldCount not eight."
      );
    }

    // Southeast
    neighbor = CoordData(center.q, center.r + 1);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      assertEq(
        Planet.getShieldCount(coordToId(neighbor.q, neighbor.r)),
        9,
        "LibShieldEater: Southeast shieldCount not nine."
      );
    }

    // Southwest
    neighbor = CoordData(center.q - 1, center.r + 1);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      assertEq(
        Planet.getShieldCount(coordToId(neighbor.q, neighbor.r)),
        10,
        "LibShieldEater: Southwest shieldCount not ten."
      );
    }

    // West
    neighbor = CoordData(center.q - 1, center.r);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      assertEq(
        Planet.getShieldCount(coordToId(neighbor.q, neighbor.r)),
        11,
        "LibShieldEater: West shieldCount not eleven."
      );
    }

    // Northwest
    neighbor = CoordData(center.q, center.r - 1);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      assertEq(
        Planet.getShieldCount(coordToId(neighbor.q, neighbor.r)),
        12,
        "LibShieldEater: Northwest shieldCount not twelve."
      );
    }

    // Northeast
    neighbor = CoordData(center.q + 1, center.r - 1);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      assertEq(
        Planet.getShieldCount(coordToId(neighbor.q, neighbor.r)),
        12,
        "LibShieldEater: Northeast shieldCount not twelve."
      );
    }
  }
}
