// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { addressToId } from "src/utils.sol";

import { Empire, Player, P_PointConfig, ShieldEater, P_ShieldEaterConfig, Planet, PlanetData } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";

import { LibShieldEater } from "libraries/LibShieldEater.sol";

import { pseudorandom, coordToId } from "src/utils.sol";
import { CoordData } from "src/Types.sol";

contract LibShieldEaterTest is PrimodiumTest {
  function setUp() public override {
    super.setUp();
  }

  function testChooseStartingPlanet(uint256 fuzz) public {
    vm.startPrank(creator);
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    assertTrue(planetIds.length > 0, "LibShieldEater: planetIds.length is 0");

    // set a random block.number
    fuzz = bound(fuzz, 1000000, 1e36);
    vm.roll(fuzz);

    // choose a starting planet
    LibShieldEater.chooseStartingPlanet();

    // check that it is a valid planetId
    assertTrue(PlanetsSet.has(ShieldEater.getCurrentPlanet()), "LibShieldEater: planetId not contained in PlanetsSet");
  }

  function testChooseNextDestination(uint256 fuzz) public {
    vm.startPrank(creator);
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();

    // set a random block.number
    fuzz = bound(fuzz, 1000000, 1e36);
    vm.roll(fuzz);

    // populate lastEMStormVisit for all planets
    for (uint256 i = 0; i < planetIds.length; i++) {
      Planet.setLastShieldEaterVisit(planetIds[i], pseudorandom(i, fuzz - 1));
    }

    // save the top 3 planetIds
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

    // choose a next destination
    LibShieldEater.chooseNextDestination();

    // check that it is a valid planetId
    assertTrue(
      PlanetsSet.has(ShieldEater.getDestinationPlanet()),
      "LibShieldEater: planetId not contained in PlanetsSet"
    );

    // check that it is one of the top 3 planetIds
    assertTrue(
      ShieldEater.getDestinationPlanet() == longestWithoutVisit[0] ||
        ShieldEater.getDestinationPlanet() == longestWithoutVisit[1] ||
        ShieldEater.getDestinationPlanet() == longestWithoutVisit[2],
      "LibShieldEater: planetId not one of the top 3"
    );
  }

  function testMoveShieldEater(uint256 fuzz) public {
    vm.startPrank(creator);

    // set a random block.number
    fuzz = bound(fuzz, 1000000, 1e36);
    vm.roll(fuzz);

    LibShieldEater.chooseStartingPlanet();
    LibShieldEater.chooseNextDestination();

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
      LibShieldEater.moveShieldEater();
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

  function testDetonateShieldEater(uint256 fuzz) public {
    vm.startPrank(creator);

    // set a random block.number
    fuzz = bound(fuzz, 1000000, 1e36);
    vm.roll(fuzz);

    PlanetData memory currentPlanet = Planet.get(ShieldEater.getCurrentPlanet());
    CoordData memory center = CoordData(currentPlanet.q, currentPlanet.r);

    // Center
    Planet.setShieldCount(ShieldEater.getCurrentPlanet(), 10);
    Planet.setLastShieldEaterVisit(ShieldEater.getCurrentPlanet(), block.number);

    // East
    CoordData memory neighbor = CoordData(center.q + 1, center.r);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      Planet.setShieldCount(coordToId(neighbor.q, neighbor.r), 11);
      Planet.setLastShieldEaterVisit(coordToId(neighbor.q, neighbor.r), block.number);
    }

    // Southeast
    neighbor = CoordData(center.q, center.r + 1);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      Planet.setShieldCount(coordToId(neighbor.q, neighbor.r), 12);
      Planet.setLastShieldEaterVisit(coordToId(neighbor.q, neighbor.r), block.number);
    }

    // Southwest
    neighbor = CoordData(center.q - 1, center.r + 1);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      Planet.setShieldCount(coordToId(neighbor.q, neighbor.r), 13);
      Planet.setLastShieldEaterVisit(coordToId(neighbor.q, neighbor.r), block.number);
    }

    // West
    neighbor = CoordData(center.q - 1, center.r);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      Planet.setShieldCount(coordToId(neighbor.q, neighbor.r), 14);
      Planet.setLastShieldEaterVisit(coordToId(neighbor.q, neighbor.r), block.number);
    }

    // Northwest
    neighbor = CoordData(center.q, center.r - 1);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      Planet.setShieldCount(coordToId(neighbor.q, neighbor.r), 15);
      Planet.setLastShieldEaterVisit(coordToId(neighbor.q, neighbor.r), block.number);
    }

    // Northeast
    neighbor = CoordData(center.q + 1, center.r - 1);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      Planet.setShieldCount(coordToId(neighbor.q, neighbor.r), 16);
      Planet.setLastShieldEaterVisit(coordToId(neighbor.q, neighbor.r), block.number);
    }

    LibShieldEater.detonateShieldEater();

    assertEq(Planet.getShieldCount(ShieldEater.getCurrentPlanet()), 0, "LibShieldEater: Center shieldCount not zero.");
    assertEq(
      Planet.getLastShieldEaterVisit(ShieldEater.getCurrentPlanet()),
      block.number,
      "LibShieldEater: Center lastShieldEaterVisit not updated."
    );

    // East
    neighbor = CoordData(center.q + 1, center.r);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      assertEq(
        Planet.getShieldCount(coordToId(neighbor.q, neighbor.r)),
        0,
        "LibShieldEater: East shieldCount not zero."
      );
      assertEq(
        Planet.getLastShieldEaterVisit(coordToId(neighbor.q, neighbor.r)),
        block.number,
        "LibShieldEater: East lastShieldEaterVisit not updated."
      );
    }

    // Southeast
    neighbor = CoordData(center.q, center.r + 1);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      assertEq(
        Planet.getShieldCount(coordToId(neighbor.q, neighbor.r)),
        0,
        "LibShieldEater: Southeast shieldCount not zero."
      );
      assertEq(
        Planet.getLastShieldEaterVisit(coordToId(neighbor.q, neighbor.r)),
        block.number,
        "LibShieldEater: Southeast lastShieldEaterVisit not updated."
      );
    }

    // Southwest
    neighbor = CoordData(center.q - 1, center.r + 1);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      assertEq(
        Planet.getShieldCount(coordToId(neighbor.q, neighbor.r)),
        0,
        "LibShieldEater: Southwest shieldCount not zero."
      );
      assertEq(
        Planet.getLastShieldEaterVisit(coordToId(neighbor.q, neighbor.r)),
        block.number,
        "LibShieldEater: Southwest lastShieldEaterVisit not updated."
      );
    }

    // West
    neighbor = CoordData(center.q - 1, center.r);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      assertEq(
        Planet.getShieldCount(coordToId(neighbor.q, neighbor.r)),
        0,
        "LibShieldEater: West shieldCount not zero."
      );
      assertEq(
        Planet.getLastShieldEaterVisit(coordToId(neighbor.q, neighbor.r)),
        block.number,
        "LibShieldEater: West lastShieldEaterVisit not updated."
      );
    }

    // Northwest
    neighbor = CoordData(center.q, center.r - 1);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      assertEq(
        Planet.getShieldCount(coordToId(neighbor.q, neighbor.r)),
        0,
        "LibShieldEater: Northwest shieldCount not zero."
      );
      assertEq(
        Planet.getLastShieldEaterVisit(coordToId(neighbor.q, neighbor.r)),
        block.number,
        "LibShieldEater: Northwest lastShieldEaterVisit not updated."
      );
    }

    // Northeast
    neighbor = CoordData(center.q + 1, center.r - 1);
    if (Planet.getIsPlanet(coordToId(neighbor.q, neighbor.r))) {
      assertEq(
        Planet.getShieldCount(coordToId(neighbor.q, neighbor.r)),
        0,
        "LibShieldEater: Northeast shieldCount not zero."
      );
      assertEq(
        Planet.getLastShieldEaterVisit(coordToId(neighbor.q, neighbor.r)),
        block.number,
        "LibShieldEater: Northeast lastShieldEaterVisit not updated."
      );
    }
  }

  // function testDetonateShieldEaterCooldown(uint256 fuzz) public {
  //   vm.startPrank(creator);

  //   // set a random block.number
  //   fuzz = bound(fuzz, 1000000, 1e36);
  //   vm.roll(fuzz);

  //   // console.log("P_ShieldEaterConfig.getDetonationCooldown()");
  //   // console.log(P_ShieldEaterConfig.getDetonationCooldown());

  //   // console.log("ShieldEater.getLastDetonationBlock()");
  //   // console.log(ShieldEater.getLastDetonationBlock());

  //   // console.log("block.number");
  //   // console.log(block.number);

  //   LibShieldEater.detonateShieldEater();

  //   vm.roll(fuzz + P_ShieldEaterConfig.getDetonationCooldown() - 1);

  //   // console.log("P_ShieldEaterConfig.getDetonationCooldown()");
  //   // console.log(P_ShieldEaterConfig.getDetonationCooldown());

  //   // console.log("ShieldEater.getLastDetonationBlock()");
  //   // console.log(ShieldEater.getLastDetonationBlock());

  //   console.log("block.number");
  //   console.log(block.number);

  //   console.log("ShieldEater.getLastDetonationBlock() + P_ShieldEaterConfig.getDetonationCooldown()");
  //   console.log(ShieldEater.getLastDetonationBlock() + P_ShieldEaterConfig.getDetonationCooldown());

  //   // vm.expectRevert("[LibShieldEater] detonateShieldEater cooldown not yet expired");
  //   vm.expectRevert();
  //   LibShieldEater.detonateShieldEater();
  // }
}
