// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { InvariantsBase } from "test/invariants/Invariants.Base.sol";
import { HandlerPot } from "test/invariants/pot/Handler.pot.t.sol";

contract InvariantsPot is InvariantsBase {
  function setUp() public override {
    super.setUp();
    HandlerPot handler = new HandlerPot();
    init(address(handler));
  }
}
