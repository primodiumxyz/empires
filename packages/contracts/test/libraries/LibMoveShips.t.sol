// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { PendingMove, Planet, PlanetData, P_GameConfig } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EEmpire, EMovement, EOrigin, EDirection } from "codegen/common.sol";
import { LibMoveShips } from "libraries/LibMoveShips.sol";
import { coordToId } from "src/utils.sol";

contract LibMoveShipsTest is PrimodiumTest {
  bytes32 planetId;

  bytes32 targetPlanet = coordToId(100, -1);

  function setUp() public override {
    super.setUp();
    uint256 i = 0;
    do {
      planetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getEmpireId(planetId) == EEmpire.NULL);
    vm.startPrank(creator);
    P_GameConfig.setGameOverBlock(block.number + 100000);
    vm.roll(1);
    vm.warp(1);
    vm.prevrandao(bytes32("1"));
  }

  function testCreatePendingMove() public {
    Planet.setEmpireId(planetId, EEmpire.Red);
    Planet.setShipCount(planetId, 1);
    bool moved = LibMoveShips.createPendingMove(planetId, targetPlanet);
    assertTrue(moved, "should have moved");

    assertFalse(PendingMove.get(planetId).empireId == EEmpire.NULL);
    assertEq(PendingMove.get(planetId).destinationPlanetId, targetPlanet);
  }

  function testFailCreatePendingMoveTargetNotPlanet() public {
    Planet.setEmpireId(planetId, EEmpire.Red);
    Planet.setShipCount(planetId, 1);
    LibMoveShips.createPendingMove(planetId, bytes32("69"));
  }

  function testExecuteMove() public {
    assignPlanetToEmpire(planetId, EEmpire.Red);
    assignPlanetToEmpire(targetPlanet, EEmpire.Red);
    vm.startPrank(creator);
    Planet.setShipCount(planetId, 1);
    Planet.setShipCount(targetPlanet, 2);
    bool moved = LibMoveShips.createPendingMove(planetId, targetPlanet);
    assertTrue(moved, "should have moved");

    bytes32 destination = PendingMove.get(planetId).destinationPlanetId;

    LibMoveShips.executePendingMoves(planetId);

    assertEq(Planet.getShipCount(planetId), 0, "ship count should be 0");
    assertEq(Planet.getShipCount(targetPlanet), 3, "target planet should have 3 ships");

    assertTrue(PendingMove.get(planetId).empireId == EEmpire.NULL);
    assertEq(PendingMove.get(planetId).destinationPlanetId, bytes32(0));
  }
}
