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
  bytes32 shieldEaterNextPlanetId;

  function setUp() public override {
    super.setUp();
    shieldEaterNextPlanetId = PlanetsSet.getPlanetIds()[2];
  }

  function testInitialize() public {
    vm.startPrank(creator);
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    assertTrue(planetIds.length > 0, "LibShieldEater: planetIds.length is 0");

    // choose a starting planet
    LibShieldEater.initialize();

    // check that it is a valid planetId
    assertTrue(PlanetsSet.has(ShieldEater.getCurrentPlanet()), "LibShieldEater: planetId not contained in PlanetsSet");
  }

  // TODO: fix in PRI-1256

  function testShieldEaterMoves() public {
    vm.startPrank(creator);
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    LibShieldEater.initialize();

    bytes32 currentPlanet = ShieldEater.getCurrentPlanet();
    bytes32 nextPlanet = planetIds[0];
    if (currentPlanet == nextPlanet) {
      nextPlanet = planetIds[1];
    }

    LibShieldEater.update(nextPlanet);
    assertEq(ShieldEater.getCurrentPlanet(), nextPlanet, "LibShieldEater: ShieldEater did not move to next planet.");
  }

  function testShieldEaterStays() public {
    vm.startPrank(creator);
    LibShieldEater.initialize();

    bytes32 currentPlanet = ShieldEater.getCurrentPlanet();
    LibShieldEater.update(currentPlanet);
    assertEq(ShieldEater.getCurrentPlanet(), currentPlanet, "LibShieldEater: ShieldEater moved to same planet.");
  }

  function testShieldEaterEats() public {
    vm.startPrank(creator);
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    LibShieldEater.initialize();

    bytes32 currentPlanet = ShieldEater.getCurrentPlanet();
    uint256 shieldCount = 10;
    Planet.setShieldCount(currentPlanet, shieldCount);

    LibShieldEater.update(planetIds[0]);

    uint256 shieldDamage = P_ShieldEaterConfig.getVisitShieldDamage();
    uint256 expectedCharge = 1;
    if (shieldCount > shieldDamage) {
      expectedCharge += shieldDamage;
    } else {
      expectedCharge += shieldCount;
    }

    assertEq(ShieldEater.getCurrentCharge(), expectedCharge, "LibShieldEater: ShieldEater did not eat shields.");
  }

  function testShieldEaterFasts() public {
    vm.startPrank(creator);
    LibShieldEater.initialize();

    bytes32 currentPlanet = ShieldEater.getCurrentPlanet();
    uint256 shieldCount = 0;
    Planet.setShieldCount(currentPlanet, shieldCount);

    LibShieldEater.update(currentPlanet);

    assertEq(ShieldEater.getCurrentCharge(), 0, "LibShieldEater: ShieldEater did not fast.");
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
      "LibShieldEater: incorrect adjacent shield damage."
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
          "LibShieldEater: incorrect adjacent shield damage."
        );
      }
    }
  }
}
