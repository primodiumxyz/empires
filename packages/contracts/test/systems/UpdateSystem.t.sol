// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { NextTurnTimestamp, P_GameConfig } from "codegen/index.sol";

contract UpdateSystemTest is PrimodiumTest {
  uint256 turnLength = 100;
  function setUp() public override {
    super.setUp();
    console.log(creator);
    vm.startPrank(creator);
    P_GameConfig.set(turnLength);
  }

  function testUpdateExecuted() public {
    bool executed = world.Empires__updateWorld();
    assertTrue(executed);

    vm.warp(block.timestamp + turnLength - 1);

    executed = world.Empires__updateWorld();
    assertFalse(executed);

    vm.warp(block.timestamp + turnLength - 1);

    executed = world.Empires__updateWorld();
    assertTrue(executed);
  }

  function testUpdateNextTurnTimestamp() public {
    uint256 timestamp = block.timestamp;
    world.Empires__updateWorld();
    assertEq(NextTurnTimestamp.get(), timestamp + turnLength);
  }
}
