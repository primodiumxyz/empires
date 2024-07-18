// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { coordToId } from "src/utils.sol";
import { Planet, PlanetData } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";

contract InitTest is PrimodiumTest {
  function setUp() public override {
    super.setUp();
  }

  function testRedPlanetInit() public {
    bytes32 redPlanetId = coordToId(1, -2);
    PlanetData memory planetData = Planet.get(redPlanetId);
    assertTrue(planetData.isPlanet);
    assertEq(planetData.shipCount, 0);
    assertEq(planetData.factionId, EEmpire.Red);
    assertEq(planetData.q, 1);
    assertEq(planetData.r, -2);
  }

  function testNonOwnedPlanetInit() public {
    bytes32 nonOwnedPlanetId = coordToId(-1, 0);
    PlanetData memory planetData = Planet.get(nonOwnedPlanetId);
    assertTrue(planetData.isPlanet);
    assertEq(planetData.shipCount, 0);
    assertEq(planetData.factionId, EEmpire.NULL);
    assertEq(planetData.q, -1);
    assertEq(planetData.r, 0);
  }
}
