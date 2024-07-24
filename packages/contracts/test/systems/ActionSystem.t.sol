// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { P_ActionConfig, Planet, ActionCost, Player, P_PointConfig, Empire } from "codegen/index.sol";
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
  uint256 pointUnit;

  function setUp() public override {
    super.setUp();
    uint256 i = 0;
    do {
      planetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getEmpireId(planetId) == EEmpire.NULL);
    aliceId = addressToId(alice);
    bobId = addressToId(bob);
    vm.prank(creator);
    P_PointConfig.setPointRake(0);
    pointUnit = P_PointConfig.getPointUnit();
  }

  function testCreateShip() public {
    uint256 cost = LibPrice.getTotalCost(EPlayerAction.CreateShip, Planet.getEmpireId(planetId), true);
    world.Empires__createShip{ value: cost }(planetId);
    assertEq(Planet.get(planetId).shipCount, 1);
  }

  function testKillShip() public {
    vm.startPrank(creator);
    P_ActionConfig.setReductionPct(5000);
    Planet.setShipCount(planetId, 1);

    uint256 cost = LibPrice.getTotalCost(EPlayerAction.KillShip, Planet.getEmpireId(planetId), false);
    world.Empires__killShip{ value: cost }(planetId);
    assertEq(Planet.get(planetId).shipCount, 0);
  }

  function testKillMultipleShips() public {
    vm.startPrank(creator);
    P_ActionConfig.setReductionPct(5000);
    Planet.setShipCount(planetId, 10);

    uint256 cost = LibPrice.getTotalCost(EPlayerAction.KillShip, Planet.getEmpireId(planetId), false);
    world.Empires__killShip{ value: cost }(planetId);
    assertEq(Planet.get(planetId).shipCount, 5);
  }

  function testChargeShield() public {
    uint256 currentShields = Planet.get(planetId).shieldCount;
    uint256 cost = LibPrice.getTotalCost(EPlayerAction.ChargeShield, Planet.getEmpireId(planetId), true);
    world.Empires__chargeShield{ value: cost }(planetId);
    assertEq(Planet.get(planetId).shieldCount, currentShields + 1);
  }

  function testDrainShield() public {
    uint256 cost = 0;
    vm.startPrank(creator);
    P_ActionConfig.setReductionPct(5000);
    Planet.setShieldCount(planetId, 10);

    cost = LibPrice.getTotalCost(EPlayerAction.DrainShield, Planet.getEmpireId(planetId), false);
    world.Empires__drainShield{ value: cost }(planetId);
    assertEq(Planet.get(planetId).shieldCount, 5);
  }

  function testKillShipFailNoShips() public {
    vm.expectRevert("[ActionSystem] No ships to kill");
    world.Empires__killShip(planetId);
  }

  function testDrainShieldFailNoShield() public {
    vm.expectRevert("[ActionSystem] No shields to drain");
    world.Empires__drainShield(planetId);
  }

  function testCreateFailNotOwned() public {
    bytes32 nonOwnedPlanetId;
    uint256 i = 0;
    do {
      nonOwnedPlanetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getEmpireId(nonOwnedPlanetId) != EEmpire.NULL);

    vm.expectRevert("[ActionSystem] Planet is not owned");
    world.Empires__createShip(nonOwnedPlanetId);
  }

  function testPurchaseActionProgress() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EPlayerAction.CreateShip, empire, true);
    uint256 actionCost = ActionCost.get(empire, EPlayerAction.CreateShip);

    vm.startPrank(alice);
    world.Empires__createShip{ value: totalCost }(planetId);
    assertGt(
      LibPrice.getTotalCost(EPlayerAction.CreateShip, empire, true),
      totalCost,
      "Total Cost should have increased"
    );
    assertGt(ActionCost.get(empire, EPlayerAction.CreateShip), actionCost, "Action Cost should have increased");
    assertEq(Player.getSpent(aliceId), totalCost, "Player should have spent total cost");
    assertEq(Balances.get(EMPIRES_NAMESPACE_ID), totalCost, "Namespace should have received the balance");
    assertEq(PointsMap.get(EEmpire.Red, aliceId), (EMPIRE_COUNT - 1) * pointUnit, "Player should have received points");
  }

  function testPurchaseActionRegress() public {
    testPurchaseActionProgress();

    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EPlayerAction.KillShip, empire, false);
    uint256 actionCost = ActionCost.get(empire, EPlayerAction.KillShip);
    uint256 initBalance = Balances.get(EMPIRES_NAMESPACE_ID);

    vm.startPrank(bob);
    world.Empires__killShip{ value: totalCost }(planetId);
    assertGt(
      LibPrice.getTotalCost(EPlayerAction.KillShip, empire, false),
      totalCost,
      "Total Cost should have increased"
    );
    assertGt(ActionCost.get(empire, EPlayerAction.KillShip), actionCost, "Action Cost should have increased");
    assertEq(Player.getSpent(bobId), totalCost, "Player should have spent total cost");
    assertEq(Balances.get(EMPIRES_NAMESPACE_ID), initBalance + totalCost, "Namespace should have received the balance");
    assertEq(PointsMap.get(EEmpire.Blue, bobId), pointUnit, "Player should have received blue points");
    assertEq(PointsMap.get(EEmpire.Green, bobId), pointUnit, "Player should have received green points");
  }

  function testSellPoints() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EPlayerAction.CreateShip, empire, true);

    console.log("alice balance before createShip", alice.balance);
    console.log("marginal action cost before createShip", ActionCost.get(empire, EPlayerAction.CreateShip));
    vm.startPrank(alice);
    world.Empires__createShip{ value: totalCost }(planetId);
    console.log("alice points after createShip", PointsMap.get(empire, aliceId));
    console.log("alice balance after createShip", alice.balance);

    uint256 aliceInitPoints = PointsMap.get(empire, aliceId);
    uint256 aliceInitBalance = alice.balance;
    uint256 gameInitBalance = Balances.get(EMPIRES_NAMESPACE_ID);
    uint256 pointSaleValue = LibPrice.getPointSaleValue(empire, 1 * pointUnit);
    uint256 actionCost = ActionCost.get(empire, EPlayerAction.CreateShip);
    uint256 empirePointsIssued = Empire.getPointsIssued(empire);

    world.Empires__sellPoints(empire, 1 * pointUnit);

    assertEq(PointsMap.get(empire, aliceId), aliceInitPoints - (1 * pointUnit), "Player should have lost points");
    assertEq(alice.balance, aliceInitBalance + pointSaleValue, "Player should have gained balance");
    assertEq(
      Balances.get(EMPIRES_NAMESPACE_ID),
      gameInitBalance - pointSaleValue,
      "Namespace should have lost balance"
    );
    assertEq(
      LibPrice.getPointSaleValue(empire, 1 * pointUnit),
      pointSaleValue - P_PointConfig.getPointCostIncrease(),
      "Point Sale Value should have decreased"
    );
    assertEq(actionCost, ActionCost.get(empire, EPlayerAction.CreateShip), "Action Cost should not have changed");
    assertEq(
      Empire.getPointsIssued(empire),
      empirePointsIssued - (1 * pointUnit),
      "Empire should have reduced points issued"
    );

    console.log("alice points after sellPoints", PointsMap.get(empire, aliceId));
    console.log("alice balance after sellPoints", alice.balance);
  }

  function testSellPointsFailNoPointsOwned() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    vm.startPrank(alice);
    vm.expectRevert("[ActionSystem] Player does not have enough points to remove");
    world.Empires__sellPoints(empire, 1);
  }

  function testSellPointsFailNotEnoughPoints() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EPlayerAction.CreateShip, empire, true);

    vm.startPrank(alice);
    world.Empires__createShip{ value: totalCost }(planetId);

    vm.expectRevert("[ActionSystem] Player does not have enough points to remove");
    world.Empires__sellPoints(empire, EMPIRE_COUNT * pointUnit);
  }

  function testSellPointsFailNotEnoughPointsWrongEmpire() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EPlayerAction.CreateShip, empire, true);

    vm.startPrank(alice);
    world.Empires__createShip{ value: totalCost }(planetId);
    vm.expectRevert("[ActionSystem] Player does not have enough points to remove");
    world.Empires__sellPoints(EEmpire.Green, 1 * pointUnit);
  }

  function testSellPointsFailGameBalanceInsufficient() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EPlayerAction.CreateShip, empire, true);

    vm.startPrank(alice);
    world.Empires__createShip{ value: totalCost }(planetId);

    uint256 pointSaleValue = LibPrice.getPointSaleValue(empire, (EMPIRE_COUNT - 1) * pointUnit);

    vm.startPrank(creator);
    uint256 gameBalance = Balances.get(EMPIRES_NAMESPACE_ID);
    uint256 transferUnderSale = gameBalance - pointSaleValue + 1;
    world.transferBalanceToNamespace(EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID, transferUnderSale);

    vm.startPrank(alice);
    vm.expectRevert("[ActionSystem] Insufficient funds for point sale");
    world.Empires__sellPoints(empire, (EMPIRE_COUNT - 1) * pointUnit);
  }
}
