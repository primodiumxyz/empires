// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { coordToId } from "src/utils.sol";
import { Planet, PlanetData, P_TacticalStrikeConfig, Planet_TacticalStrikeData, Planet_TacticalStrike } from "codegen/index.sol";

contract InitTest is PrimodiumTest {
  function setUp() public override {
    super.setUp();
  }

  function testRedPlanetInit() public {
    bytes32 redPlanetId = coordToId(99, 1);
    PlanetData memory planetData = Planet.get(redPlanetId);
    assertTrue(planetData.isPlanet);
    assertEq(planetData.shipCount, 0);
    assertEq(planetData.empireId, 1);
    assertEq(planetData.q, 99);
    assertEq(planetData.r, 1);
    Planet_TacticalStrikeData memory planetTacticalStrikeData = Planet_TacticalStrike.get(redPlanetId);
    assertEq(planetTacticalStrikeData.chargeRate, P_TacticalStrikeConfig.getChargeRate());
    assertEq(planetTacticalStrikeData.charge, 0);
  }

  function testNonOwnedPlanetInit() public {
    bytes32 nonOwnedPlanetId = coordToId(98, 1);
    PlanetData memory planetData = Planet.get(nonOwnedPlanetId);
    assertTrue(planetData.isPlanet);
    assertEq(planetData.shipCount, 0);
    assertEq(planetData.empireId, 0);
    assertEq(planetData.q, 98);
    assertEq(planetData.r, 1);
    assertEq(planetData.shieldCount, 4);
  }
}
