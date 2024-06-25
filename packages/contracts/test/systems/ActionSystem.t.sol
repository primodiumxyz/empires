// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { Planet } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EEmpire } from "codegen/common.sol";

contract ActionSystemTest is PrimodiumTest {
  bytes32 planetId;
  function setUp() public override {
    super.setUp();
    uint256 i = 0;
    do {
      planetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getFactionId(planetId) == EEmpire.NULL);
  }

  function testCreateDestroyer() public {
    world.Empires__createDestroyer(planetId);
    assertEq(Planet.get(planetId).destroyerCount, 1);
  }

  function testKillDestroyer() public {
    world.Empires__createDestroyer(planetId);
    assertEq(Planet.get(planetId).destroyerCount, 1);
    world.Empires__killDestroyer(planetId);
    assertEq(Planet.get(planetId).destroyerCount, 0);
  }

  function testKillDestroyerFailNoDestroyers() public {
    vm.expectRevert("[ActionSystem] No destroyers to kill");
    world.Empires__killDestroyer(planetId);
  }

  function testCreateFailNotOwned() public {
    bytes32 nonOwnedPlanetId;
    uint256 i = 0;
    do {
      nonOwnedPlanetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getFactionId(nonOwnedPlanetId) != EEmpire.NULL);

    vm.expectRevert("[ActionSystem] Planet is not owned");
    world.Empires__createDestroyer(nonOwnedPlanetId);
  }
}
