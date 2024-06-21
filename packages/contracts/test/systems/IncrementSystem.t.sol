// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { Counter } from "codegen/index.sol";

contract IncrementSystemTest is PrimodiumTest {
  function setUp() public override {
    super.setUp();
  }

  function testInitialCounterValue() public {
    uint256 value = Counter.get();
    assertEq(value, 1);
  }

  function testIncrementCounter() public {
    uint256 value = Counter.get();
    world.Primodium_Base__increment();
    uint256 newValue = Counter.get();
    assertEq(newValue, value + 1);
  }
}
