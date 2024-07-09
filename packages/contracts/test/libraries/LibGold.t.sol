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

  function testGiveGold() public {
    P_NPCActionCosts.set(ENPCAction.BuyDestroyers, 2);

    Planet.setGoldCount(planetId, 1);
    uint256 noneThreshold = P_NPCActionThresholds.getNone();
    uint256 buyThreshold = P_NPCActionThresholds.getBuyDestroyers();
    LibGold._spendGold(planetId, buyThreshold - 1);

    assertEq(Planet.getGoldCount(planetId), 1, "Planet gold count should be 1");
    assertEq(Planet.getDestroyerCount(planetId), 0, "Planet destroyer count should be 0");

    Planet.setGoldCount(planetId, 2);
    LibGold._spendGold(planetId, noneThreshold - 1);

    assertEq(Planet.getGoldCount(planetId), 2, "Planet gold count should be 1");
    assertEq(Planet.getDestroyerCount(planetId), 0, "Planet destroyer count should be 0");

    LibGold._spendGold(planetId, buyThreshold - 1);

    assertEq(Planet.getGoldCount(planetId), 0, "Planet gold count");
    assertEq(Planet.getDestroyerCount(planetId), 1, "Planet destroyer count");

    Planet.setGoldCount(planetId, 9);

    LibGold._spendGold(planetId, buyThreshold - 1);

    assertEq(Planet.getGoldCount(planetId), 1, "Planet gold count");
    assertEq(Planet.getDestroyerCount(planetId), 5, "Planet destroyer count");
  }
}
