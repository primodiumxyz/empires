// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { Planet } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EEmpire } from "codegen/common.sol";
import { LibUpdateWorld } from "libraries/LibUpdateWorld.sol";

contract LibUpdateWorldTest is PrimodiumTest {
  bytes32 planetId;
  function setUp() public override {
    super.setUp();
    uint256 i = 0;
    do {
      planetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getFactionId(planetId) == EEmpire.NULL);
    vm.startPrank(creator);
    vm.roll(1);
    vm.warp(1);
    vm.prevrandao(bytes32("1"));
  }

  function testEarlyExit() public {
    Planet.setFactionId(planetId, EEmpire.NULL);
    bool moved = LibUpdateWorld.moveDestroyers(planetId);
    assertFalse(moved);
    moved = LibUpdateWorld.moveDestroyers(planetId);
    Planet.setFactionId(planetId, EEmpire.Red);
    assertFalse(moved);
    Planet.setDestroyerCount(planetId, 1);
    moved = LibUpdateWorld.moveDestroyers(planetId);
    assertTrue(moved);
  }
}
