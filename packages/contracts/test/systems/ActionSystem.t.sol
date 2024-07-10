// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { Planet, P_PointConfig } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { EEmpire, EPlayerAction } from "codegen/common.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";
import { Balances } from "@latticexyz/world/src/codegen/tables/Balances.sol";

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
    uint256 cost = LibPrice.getTotalCost(EPlayerAction.CreateDestroyer, Planet.getFactionId(planetId), true);
    world.Empires__createDestroyer{ value: cost }(planetId);
    assertEq(Planet.get(planetId).destroyerCount, 1);
  }

  function testKillDestroyer() public {
    uint256 cost = LibPrice.getTotalCost(EPlayerAction.CreateDestroyer, Planet.getFactionId(planetId), true);
    world.Empires__createDestroyer{ value: cost }(planetId);
    assertEq(Planet.get(planetId).destroyerCount, 1);

    cost = LibPrice.getTotalCost(EPlayerAction.KillDestroyer, Planet.getFactionId(planetId), false);
    world.Empires__killDestroyer{ value: cost }(planetId);
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

  function testTakeRake() public {
    uint256 cost = LibPrice.getTotalCost(EPlayerAction.CreateDestroyer, Planet.getFactionId(planetId), true);
    vm.prank(creator);
    P_PointConfig.setPointRake(5_000); // out of 10_000 so 50%
    world.Empires__createDestroyer{ value: cost }(planetId);

    assertEq(Balances.get(EMPIRES_NAMESPACE_ID), cost / 2);
    assertEq(Balances.get(ADMIN_NAMESPACE_ID), cost / 2);
  }
}
