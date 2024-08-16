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

  // TODO: find new home planet for red
  // function testRedPlanetInit() public {
  //   bytes32 redPlanetId = coordToId(97, 0);
  //   PlanetData memory planetData = Planet.get(redPlanetId);
  //   assertTrue(planetData.isPlanet, "[testRedPlanetInit] isPlanet is not true");
  //   assertEq(planetData.shipCount, 0, "[testRedPlanetInit] shipCount is not 0");
  //   assertEq(planetData.empireId, EEmpire.Red, "[testRedPlanetInit] empireId is not Red");
  //   assertEq(planetData.q, 97, "[testRedPlanetInit] q is not 97");
  //   assertEq(planetData.r, 0, "[testRedPlanetInit] r is not 0");

  //   // *** Tactical Strike Feature Disabled ***

  //   // Planet_TacticalStrikeData memory planetTacticalStrikeData = Planet_TacticalStrike.get(redPlanetId);
  //   // assertEq(
  //   //   planetTacticalStrikeData.chargeRate,
  //   //   P_TacticalStrikeConfig.getChargeRate(),
  //   //   "[testRedPlanetInit] chargeRate is not equal to P_TacticalStrikeConfig.getChargeRate()"
  //   // );
  //   // assertEq(planetTacticalStrikeData.charge, 0, "[testRedPlanetInit] planetTacticalStrikeData.charge is not 0");
  // }

  function testNonOwnedPlanetInit() public {
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
