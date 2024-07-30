// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { coordToId } from "src/utils.sol";
import { Planet, PlanetData, P_TacticalStrikeConfig, Planet_TacticalStrikeData, Planet_TacticalStrike } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";

contract InitTest is PrimodiumTest {
  function setUp() public override {
    super.setUp();
  }

  function testRedPlanetInit() public {
    bytes32 redPlanetId = coordToId(101, -2);
    PlanetData memory planetData = Planet.get(redPlanetId);
    assertTrue(planetData.isPlanet);
    assertEq(planetData.shipCount, 0);
    assertEq(planetData.empireId, EEmpire.Red);
    assertEq(planetData.q, 101);
    assertEq(planetData.r, -2);
    Planet_TacticalStrikeData memory planetTacticalStrikeData = Planet_TacticalStrike.get(redPlanetId);
    assertEq(planetTacticalStrikeData.strikeReloadRate, 1);
    assertEq(planetTacticalStrikeData.strikeReloadCount, 0);
  }

  function testNonOwnedPlanetInit() public {
    bytes32 nonOwnedPlanetId = coordToId(99, 0);
    PlanetData memory planetData = Planet.get(nonOwnedPlanetId);
    assertTrue(planetData.isPlanet);
    assertEq(planetData.shipCount, 0);
    assertEq(planetData.empireId, EEmpire.NULL);
    assertEq(planetData.q, 99);
    assertEq(planetData.r, 0);
  }
}
