// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest, StdInvariant } from "test/PrimodiumTest.t.sol";
import { TestPlus } from "solady/TestPlus.sol";
import { HandlerBase } from "test/invariants/Handler.Base.sol";

/// @dev These base invariants are run for each fuzzing campaign
abstract contract InvariantsBase is StdInvariant, PrimodiumTest, TestPlus {
  HandlerBase handler;

  function init(address _handler) internal {
    handler = HandlerBase(_handler);
    targetContract(_handler);
  }
}
