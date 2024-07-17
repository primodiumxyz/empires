// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { Planet, ActionCost, Player, P_PointConfig, Faction } from "codegen/index.sol";
import { Balances } from "@latticexyz/world/src/codegen/tables/Balances.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { EEmpire, EPlayerAction } from "codegen/common.sol";
import { addressToId } from "src/utils.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID, EMPIRE_COUNT } from "src/constants.sol";

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
    vm.prank(creator);
    P_PointConfig.setPointRake(0);
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
    assertEq(
      PointsMap.get(EEmpire.Blue, bobId),
      P_PointConfig.getPointUnit(),
      "Player should have received blue points"
    );
    assertEq(
      PointsMap.get(EEmpire.Green, bobId),
      P_PointConfig.getPointUnit(),
      "Player should have received green points"
    );
  }

  function testSellPoints() public {
    EEmpire empire = Planet.getFactionId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EPlayerAction.CreateDestroyer, empire, true);
    
    vm.startPrank(alice);
    world.Empires__createDestroyer{ value: totalCost }(planetId);
    console.log("alice points after createDestroyer", PointsMap.get(empire, aliceId));

    uint256 aliceInitPoints = PointsMap.get(empire, aliceId);
    uint256 aliceInitBalance = alice.balance;
    uint256 gameInitBalance = Balances.get(EMPIRES_NAMESPACE_ID);
    uint256 pointSaleValue = LibPrice.getPointSaleValue(empire, 1);
    uint256 actionCost = ActionCost.get(empire, EPlayerAction.CreateDestroyer);
    uint256 empirePointsIssued = Faction.getPointsIssued(empire);

    world.Empires__sellPoints(empire, 1);
    
    assertEq(PointsMap.get(empire, aliceId), aliceInitPoints - P_PointConfig.getPointUnit(), "Player should have lost points");
    assertEq(alice.balance, aliceInitBalance + pointSaleValue, "Player should have gained balance");
    assertEq(Balances.get(EMPIRES_NAMESPACE_ID), gameInitBalance - pointSaleValue, "Namespace should have lost balance");
    assertEq(
      LibPrice.getPointSaleValue(empire, 1),
      pointSaleValue - P_PointConfig.getPointCostIncrease(),
      "Point Sale Value should have decreased"
    );
    assertEq(actionCost, ActionCost.get(empire, EPlayerAction.CreateDestroyer), "Action Cost should not have changed");
    assertEq(
      Faction.getPointsIssued(empire),
      empirePointsIssued - P_PointConfig.getPointUnit(),
      "Empire should have reduced points issued"
    );

    console.log("alice points after sellPoints", PointsMap.get(empire, aliceId));
  }

  function testSellPointsFailNoPointsOwned() public {
    EEmpire empire = Planet.getFactionId(planetId);
    vm.startPrank(alice);
    vm.expectRevert("[ActionSystem] Player does not have enough points to remove");
    world.Empires__sellPoints(empire, 1);
  }

  function testSellPointsFailNotEnoughPoints() public {
    EEmpire empire = Planet.getFactionId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EPlayerAction.CreateDestroyer, empire, true);
    
    vm.startPrank(alice);
    world.Empires__createDestroyer{ value: totalCost }(planetId);

    vm.expectRevert("[ActionSystem] Player does not have enough points to remove");
    world.Empires__sellPoints(empire, EMPIRE_COUNT);
  }

  function testSellPointsFailNotEnoughPointsWrongEmpire() public {
    EEmpire empire = Planet.getFactionId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EPlayerAction.CreateDestroyer, empire, true);
    
    vm.startPrank(alice);
    world.Empires__createDestroyer{ value: totalCost }(planetId);
    vm.expectRevert("[ActionSystem] Player does not have enough points to remove");
    world.Empires__sellPoints(EEmpire.Green, 1);
  }

  function testSellPointsFailGameBalanceInsufficient() public {
    EEmpire empire = Planet.getFactionId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EPlayerAction.CreateDestroyer, empire, true);
    
    vm.startPrank(alice);
    world.Empires__createDestroyer{ value: totalCost }(planetId);
    
    uint256 pointSaleValue = LibPrice.getPointSaleValue(empire, EMPIRE_COUNT - 1);

    vm.startPrank(creator);
    uint256 gameBalance = Balances.get(EMPIRES_NAMESPACE_ID);
    uint256 transferUnderSale = gameBalance - pointSaleValue + 1;
    world.transferBalanceToNamespace(EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID, transferUnderSale);
    
    vm.startPrank(alice);
    vm.expectRevert("[ActionSystem] Insufficient funds for point sale");
    world.Empires__sellPoints(empire, EMPIRE_COUNT - 1);
  }

}
