// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { Turn, P_GameConfig } from "codegen/index.sol";

contract UpdateSystemTest is PrimodiumTest {
  uint256 turnLength = 100;
  function setUp() public override {
    super.setUp();
    console.log(creator);
    vm.startPrank(creator);
    P_GameConfig.set(turnLength);
  }

  function testUpdateExecuted() public {
    world.Empires__updateWorld();

    vm.roll(block.number + turnLength - 1);

    vm.expectRevert("[UpdateSystem] Cannot update yet");
    world.Empires__updateWorld();

    vm.roll(block.number + 1);

    world.Empires__updateWorld();
  }

  function testUpdateNextTurnBlock() public {
    world.Empires__updateWorld();
    assertEq(Turn.getNextTurnBlock(), block.number + turnLength);
  }
}
