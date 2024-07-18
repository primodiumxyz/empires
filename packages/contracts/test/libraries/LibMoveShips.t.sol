// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { Planet, PlanetData, P_NPCMoveThresholds, P_GameConfig } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EEmpire, EMovement, EOrigin, EDirection } from "codegen/common.sol";
import { LibMoveShips } from "libraries/LibMoveShips.sol";
import { coordToId } from "src/utils.sol";

contract LibMoveShipsTest is PrimodiumTest {
  bytes32 planetId;
  function setUp() public override {
    super.setUp();
    uint256 i = 0;
    do {
      planetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getFactionId(planetId) == EEmpire.NULL);
    vm.startPrank(creator);
    P_GameConfig.setGameOverBlock(block.number + 100000);
    vm.roll(1);
    vm.warp(1);
    vm.prevrandao(bytes32("1"));
  }

  function testEarlyExit() public {
    Planet.setFactionId(planetId, EEmpire.NULL);
    bool moved = LibMoveShips.moveShips(planetId);
    assertFalse(moved, "shouldnt have moved");
    moved = LibMoveShips.moveShips(planetId);
    Planet.setFactionId(planetId, EEmpire.Red);
    moved = LibMoveShips.moveShips(planetId);
    assertFalse(moved, "shouldnt have moved again");
    Planet.setShipCount(planetId, 1);
    moved = LibMoveShips.moveShips(planetId);
    assertTrue(moved, "should have moved");
  }

  function testGetPlanetTargetNoMovement() public {
    PlanetData memory planetData = Planet.get(planetId);
    // set the move direction to none
    uint256 value = P_NPCMoveThresholds.getNone() - 1;
    bytes32 target = LibMoveShips.getPlanetTarget(planetData, value);
    assertEq(target, planetId);
  }

  function testGetPlanetTargetExpand() public {
    PlanetData memory planetData = Planet.get(planetId);
    // north
    Planet.setFactionId(planetId, EEmpire.Red);
    // set the move direction to none
    uint256 value = P_NPCMoveThresholds.getExpand() - 1;
    bytes32 target = LibMoveShips.getPlanetTarget(planetData, value);
    bool left = value % 2 == 0;
    // direction should be southeast if left and southwest if right

    if (left) {
      assertEq(target, coordToId(planetData.q, planetData.r + 1));
    } else {
      assertEq(target, coordToId(planetData.q - 1, planetData.r + 1));
    }
  }

  function testGetPlanetTargetRetreat() public {
    bytes32 planet = coordToId(0, 0);
    // southwest
    Planet.setShipCount(planet, 1);
    Planet.setFactionId(planet, EEmpire.Blue);
    // set the move direction to none
    PlanetData memory planetData = Planet.get(planet);
    uint256 value = P_NPCMoveThresholds.getRetreat() - 1;
    bytes32 target = LibMoveShips.getPlanetTarget(planetData, value);
    bool left = value % 2 == 0;

    if (left) {
      assertEq(target, coordToId(planetData.q, planetData.r - 1));
    } else {
      assertEq(target, coordToId(planetData.q - 1, planetData.r));
    }
  }

  function testGetPlanetTargetLateral() public {
    bytes32 planet = coordToId(0, 0);
    // southeast
    Planet.setShipCount(planet, 1);
    Planet.setFactionId(planet, EEmpire.Green);
    // set the move direction to none
    PlanetData memory planetData = Planet.get(planet);
    uint256 value = P_NPCMoveThresholds.getLateral() - 1;
    bytes32 target = LibMoveShips.getPlanetTarget(planetData, value);
    bool left = value % 2 == 0;

    if (left) {
      assertEq(target, coordToId(planetData.q + 1, planetData.r - 1));
    } else {
      assertEq(target, coordToId(planetData.q - 1, planetData.r + 1));
    }
  }
}
