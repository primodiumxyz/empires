// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { TestPlus } from "solady/TestPlus.sol";

/// @dev These base invariants are run for each fuzzing campaign
abstract contract InvariantsBase is PrimodiumTest, TestPlus {
  function setUp() public virtual override {
    super.setUp();
  }

  function init(address _handler) internal {
    targetContract(_handler);
  }
}
