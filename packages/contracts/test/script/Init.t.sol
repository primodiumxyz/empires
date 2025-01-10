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

  function testRedPlanetInit() public view {
    bytes32 redPlanetId = coordToId(101, -3);
    PlanetData memory planetData = Planet.get(redPlanetId);
    assertTrue(planetData.isPlanet);
    assertEq(planetData.shipCount, 5);
    assertEq(planetData.empireId, EEmpire.Red);
    assertEq(planetData.q, 101);
    assertEq(planetData.r, -3);
  }

  function testNonOwnedPlanetInit() public view {
    bytes32 nonOwnedPlanetId = coordToId(98, 1);
    PlanetData memory planetData = Planet.get(nonOwnedPlanetId);
    assertTrue(planetData.isPlanet);
    assertEq(planetData.shipCount, 0);
    assertEq(planetData.empireId, EEmpire.NULL);
    assertEq(planetData.q, 98);
    assertEq(planetData.r, 1);
    assertEq(planetData.shieldCount, 4);
  }
}
