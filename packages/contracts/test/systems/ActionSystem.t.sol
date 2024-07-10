// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { Planet, ActionCost, Player, P_PointConfig } from "codegen/index.sol";
import { Balances } from "@latticexyz/world/src/codegen/tables/Balances.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { EEmpire, EPlayerAction } from "codegen/common.sol";
import { addressToId } from "src/utils.sol";
import { EMPIRES_NAMESPACE_ID, EMPIRE_COUNT } from "src/constants.sol";

contract ActionSystemTest is PrimodiumTest {
  bytes32 planetId;
  bytes32 aliceId;
  bytes32 bobId;

  function setUp() public override {
    super.setUp();
    uint256 i = 0;
    do {
      planetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getFactionId(planetId) == EEmpire.NULL);
    aliceId = addressToId(alice);
    bobId = addressToId(bob);
  }

  function testCreateDestroyer() public {
    uint256 cost = LibPrice.getTotalCost(EPlayerAction.CreateDestroyer, Planet.getFactionId(planetId), true);
    world.Empires__createDestroyer{ value: cost }(planetId);
    assertEq(Planet.get(planetId).destroyerCount, 1);
  }

  function testKillDestroyer() public {
    uint256 cost = LibPrice.getTotalCost(EPlayerAction.CreateDestroyer, Planet.getFactionId(planetId), true);
    world.Empires__createDestroyer{ value: cost }(planetId);
    assertEq(Planet.get(planetId).destroyerCount, 1);

    cost = LibPrice.getTotalCost(EPlayerAction.KillDestroyer, Planet.getFactionId(planetId), false);
    world.Empires__killDestroyer{ value: cost }(planetId);
    assertEq(Planet.get(planetId).destroyerCount, 0);
  }

  function testKillDestroyerFailNoDestroyers() public {
    vm.expectRevert("[ActionSystem] No destroyers to kill");
    world.Empires__killDestroyer(planetId);
  }

  function testCreateFailNotOwned() public {
    bytes32 nonOwnedPlanetId;
    uint256 i = 0;
    do {
      nonOwnedPlanetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getFactionId(nonOwnedPlanetId) != EEmpire.NULL);

    vm.expectRevert("[ActionSystem] Planet is not owned");
    world.Empires__createDestroyer(nonOwnedPlanetId);
  }

  function testPurchaseActionProgress() public {
    EEmpire empire = Planet.getFactionId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EPlayerAction.CreateDestroyer, empire, true);
    uint256 actionCost = ActionCost.get(empire, EPlayerAction.CreateDestroyer);

    vm.startPrank(alice);
    world.Empires__createDestroyer{ value: totalCost }(planetId);
    assertGt(
      LibPrice.getTotalCost(EPlayerAction.CreateDestroyer, empire, true),
      totalCost,
      "Total Cost should have increased"
    );
    assertGt(ActionCost.get(empire, EPlayerAction.CreateDestroyer), actionCost, "Action Cost should have increased");
    assertEq(Player.getSpent(aliceId), totalCost, "Player should have spent total cost");
    assertEq(Balances.get(EMPIRES_NAMESPACE_ID), totalCost, "Namespace should have received the balance");
    assertEq(
      PointsMap.get(EEmpire.Red, aliceId),
      (EMPIRE_COUNT - 1) * P_PointConfig.getPointUnit(),
      "Player should have received points"
    );
  }

  function testPurchaseActionRegress() public {
    testPurchaseActionProgress();

    EEmpire empire = Planet.getFactionId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EPlayerAction.KillDestroyer, empire, false);
    uint256 actionCost = ActionCost.get(empire, EPlayerAction.KillDestroyer);
    uint256 initBalance = Balances.get(EMPIRES_NAMESPACE_ID);

    vm.startPrank(bob);
    world.Empires__killDestroyer{ value: totalCost }(planetId);
    assertGt(
      LibPrice.getTotalCost(EPlayerAction.KillDestroyer, empire, false),
      totalCost,
      "Total Cost should have increased"
    );
    assertGt(ActionCost.get(empire, EPlayerAction.KillDestroyer), actionCost, "Action Cost should have increased");
    assertEq(Player.getSpent(bobId), totalCost, "Player should have spent total cost");
    assertEq(Balances.get(EMPIRES_NAMESPACE_ID), initBalance + totalCost, "Namespace should have received the balance");
    assertEq(PointsMap.get(EEmpire.Blue, bobId), P_PointConfig.getPointUnit(), "Player should have received blue points");
    assertEq(PointsMap.get(EEmpire.Green, bobId), P_PointConfig.getPointUnit(), "Player should have received green points");
  }
}
