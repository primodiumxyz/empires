// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { InvariantsBase } from "test/invariants/Invariants.Base.t.sol";
import { HandlerPot } from "test/invariants/pot/Handler.pot.t.sol";

contract InvariantsPot is InvariantsBase {
  HandlerPot handler;

  function setUp() public override {
    super.setUp();
    handler = new HandlerPot(address(world), creator);
    init(address(handler));
  }

  function invariant_pot_balanceOfEmpiresContractShouldEqualExpectedPot() public view {
    assert(handler.getPot() == handler.getExpectedPot());
  }

  function invariant_pot_rakeShouldEqualExpectedRake() public view {
    assert(handler.getRake() == handler.getExpectedRake());
  }
}
