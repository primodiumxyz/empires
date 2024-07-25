// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { addressToId } from "src/utils.sol";

import { P_NPCActionCosts, Planet } from "codegen/index.sol";
import { ENPCAction } from "codegen/common.sol";
import { LibNPCAction } from "libraries/LibNPCAction.sol";
import { Likelihoods } from "src/Types.sol";

contract LibNPCActionTest is PrimodiumTest {
  bytes32 planetId;
  bytes32 aliceId;
  bytes32 bobId;

  Likelihoods likelihoods =
    Likelihoods({
      planetId: planetId,
      buyShields: 2000,
      attackEnemy: 4000,
      accumulateGold: 6000,
      buyShips: 8000,
      supportAlly: 10000,
      attackTargetId: bytes32(""),
      supportTargetId: bytes32("")
    });
  function setUp() public override {
    super.setUp();
    aliceId = addressToId(alice);
    bobId = addressToId(bob);
  }

  function testAccumulateGold() public {
    Planet.setGoldCount(planetId, 1);

    assertEq(Planet.getGoldCount(planetId), 1, "Planet gold count should be 1");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 0, "Planet shield count should be 0");

    LibNPCAction._executeAction(likelihoods, likelihoods.accumulateGold - 1);

    assertEq(Planet.getGoldCount(planetId), 1, "Planet gold count should be 1");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 0, "Planet shield count should be 0");
  }

  function testBuyShips() public {
    Planet.setGoldCount(planetId, 2);
    P_NPCActionCosts.set(ENPCAction.BuyShips, 2);

    assertEq(Planet.getGoldCount(planetId), 2, "Planet gold count should be 2");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 0, "Planet shield count should be 0");

    LibNPCAction._executeAction(likelihoods, likelihoods.buyShips - 1);

    assertEq(Planet.getGoldCount(planetId), 0, "Planet gold count should be 0");
    assertEq(Planet.getShipCount(planetId), 1, "Planet ship count should be 1");
    assertEq(Planet.getShieldCount(planetId), 0, "Planet shield count should be 0");

    Planet.setGoldCount(planetId, 9);

    assertEq(Planet.getGoldCount(planetId), 9, "Planet gold count should be 9");
    assertEq(Planet.getShipCount(planetId), 1, "Planet ship count should be 1");
    assertEq(Planet.getShieldCount(planetId), 0, "Planet shield count should be 0");

    LibNPCAction._executeAction(likelihoods, likelihoods.buyShips - 1);

    assertEq(Planet.getGoldCount(planetId), 1, "Planet gold count should be 1");
    assertEq(Planet.getShipCount(planetId), 5, "Planet ship count should be 5");
    assertEq(Planet.getShieldCount(planetId), 0, "Planet shield count should be 0");
  }

  function testBuyShields() public {
    Planet.setGoldCount(planetId, 2);
    P_NPCActionCosts.set(ENPCAction.BuyShields, 2);

    assertEq(Planet.getGoldCount(planetId), 2, "Planet gold count should be 2");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 0, "Planet shield count should be 0");

    LibNPCAction._executeAction(likelihoods, likelihoods.buyShields - 1);

    assertEq(Planet.getGoldCount(planetId), 0, "Planet gold count should be 0");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 1, "Planet shield count should be 1");

    Planet.setGoldCount(planetId, 7);

    assertEq(Planet.getGoldCount(planetId), 7, "Planet gold count should be 7");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 1, "Planet shield count should be 1");

    LibNPCAction._executeAction(likelihoods, likelihoods.buyShields - 1);

    assertEq(Planet.getGoldCount(planetId), 1, "Planet gold count should be 1");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 4, "Planet shield count should be 4");
  }
}
