// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { addressToId } from "src/utils.sol";

import { P_NPCActionCosts, Planet, P_NPCActionThresholds } from "codegen/index.sol";
import { ENPCAction } from "codegen/common.sol";
import { LibGold } from "libraries/LibGold.sol";

contract LibGoldTest is PrimodiumTest {
  bytes32 planetId;
  bytes32 aliceId;
  bytes32 bobId;

  function setUp() public override {
    super.setUp();
    aliceId = addressToId(alice);
    bobId = addressToId(bob);
    vm.startPrank(creator);
  }

  function testBuyNone() public {
    Planet.setGoldCount(planetId, 1);

    assertEq(Planet.getGoldCount(planetId), 1, "Planet gold count should be 1");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 4, "Planet shield count should be 4");

    LibGold._spendGold(planetId, P_NPCActionThresholds.getNone() - 1);

    assertEq(Planet.getGoldCount(planetId), 1, "Planet gold count should be 1");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 4, "Planet shield count should be 4");
  }

  function testBuyShips() public {
    Planet.setGoldCount(planetId, 2);
    P_NPCActionCosts.set(ENPCAction.BuyShips, 2);

    assertEq(Planet.getGoldCount(planetId), 2, "Planet gold count should be 2");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 4, "Planet shield count should be 4");

    LibGold._spendGold(planetId, P_NPCActionThresholds.getBuyShips() - 1);

    assertEq(Planet.getGoldCount(planetId), 0, "Planet gold count should be 0");
    assertEq(Planet.getShipCount(planetId), 1, "Planet ship count should be 1");
    assertEq(Planet.getShieldCount(planetId), 4, "Planet shield count should be 4");

    Planet.setGoldCount(planetId, 9);

    assertEq(Planet.getGoldCount(planetId), 9, "Planet gold count should be 9");
    assertEq(Planet.getShipCount(planetId), 1, "Planet ship count should be 1");
    assertEq(Planet.getShieldCount(planetId), 4, "Planet shield count should be 4");

    LibGold._spendGold(planetId, P_NPCActionThresholds.getBuyShips() - 1);

    assertEq(Planet.getGoldCount(planetId), 1, "Planet gold count should be 1");
    assertEq(Planet.getShipCount(planetId), 5, "Planet ship count should be 5");
    assertEq(Planet.getShieldCount(planetId), 4, "Planet shield count should be 4");
  }

  function testBuyShields() public {
    Planet.setGoldCount(planetId, 2);
    P_NPCActionCosts.set(ENPCAction.BuyShields, 2);

    assertEq(Planet.getGoldCount(planetId), 2, "Planet gold count should be 2");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 4, "Planet shield count should be 4");

    LibGold._spendGold(planetId, P_NPCActionThresholds.getBuyShields() - 1);

    assertEq(Planet.getGoldCount(planetId), 0, "Planet gold count should be 0");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 5, "Planet shield count should be 5");

    Planet.setGoldCount(planetId, 7);

    assertEq(Planet.getGoldCount(planetId), 7, "Planet gold count should be 7");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 5, "Planet shield count should be 5");

    LibGold._spendGold(planetId, P_NPCActionThresholds.getBuyShields() - 1);

    assertEq(Planet.getGoldCount(planetId), 1, "Planet gold count should be 1");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 8, "Planet shield count should be 8");
  }
}
