// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { P_OverrideConfig, Planet, OverrideCost, Player, P_PointConfig, Empire } from "codegen/index.sol";
import { Balances } from "@latticexyz/world/src/codegen/tables/Balances.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { EEmpire, EOverride } from "codegen/common.sol";
import { addressToId } from "src/utils.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID, EMPIRE_COUNT } from "src/constants.sol";

contract OverrideSystemTest is PrimodiumTest {
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

  function testCreateShipSingle() public {
    uint256 cost = LibPrice.getTotalCost(EOverride.CreateShip, Planet.getEmpireId(planetId), true, 1);
    world.Empires__createShip{ value: cost }(planetId, 1);
    assertEq(Planet.get(planetId).shipCount, 1);
  }

  function testCreateShipMultiple() public {
    uint256 cost = LibPrice.getTotalCost(EOverride.CreateShip, Planet.getEmpireId(planetId), true, 10);
    world.Empires__createShip{ value: cost }(planetId, 10);
    assertEq(Planet.get(planetId).shipCount, 10);
  }

  function testKillShipSingle() public {
    vm.startPrank(creator);
    Planet.setShipCount(planetId, 1);

    uint256 cost = LibPrice.getTotalCost(EOverride.KillShip, Planet.getEmpireId(planetId), false, 1);
    world.Empires__killShip{ value: cost }(planetId, 1);
    assertEq(Planet.get(planetId).shipCount, 0);
  }

  function testKillShipMultiple() public {
    testCreateShipMultiple();
    uint256 currentShips = Planet.get(planetId).shipCount;

    uint256 cost = LibPrice.getTotalCost(EOverride.KillShip, Planet.getEmpireId(planetId), false, 6);
    world.Empires__killShip{ value: cost }(planetId, 6);
    assertEq(Planet.get(planetId).shipCount, currentShips - 6);
  }

  function testChargeShieldSingle() public {
    uint256 currentShields = Planet.get(planetId).shieldCount;
    uint256 cost = LibPrice.getTotalCost(EOverride.ChargeShield, Planet.getEmpireId(planetId), true, 1);
    world.Empires__chargeShield{ value: cost }(planetId, 1);
    assertEq(Planet.get(planetId).shieldCount, currentShields + 1);
  }

  function testChargeShieldMultiple() public {
    uint256 currentShields = Planet.get(planetId).shieldCount;
    uint256 cost = LibPrice.getTotalCost(EOverride.ChargeShield, Planet.getEmpireId(planetId), true, 10);
    world.Empires__chargeShield{ value: cost }(planetId, 10);
    assertEq(Planet.get(planetId).shieldCount, currentShields + 10);
  }

  function testDrainShieldSingle() public {
    vm.startPrank(creator);
    uint256 currentShields = 10;
    Planet.setShieldCount(planetId, currentShields);

    uint256 cost = LibPrice.getTotalCost(EOverride.DrainShield, Planet.getEmpireId(planetId), false, 1);
    world.Empires__drainShield{ value: cost }(planetId, 1);
    assertEq(Planet.get(planetId).shieldCount, currentShields - 1);
  }

  function testDrainShieldMultiple() public {
    testChargeShieldMultiple();

    uint256 currentShields = Planet.get(planetId).shieldCount;
    uint256 cost = LibPrice.getTotalCost(EOverride.DrainShield, Planet.getEmpireId(planetId), false, 6);
    world.Empires__drainShield{ value: cost }(planetId, 6);
    assertEq(Planet.get(planetId).shieldCount, currentShields - 6);
  }

  function testKillShipFailNoShips() public {
    vm.expectRevert("[OverrideSystem] Not enough ships to kill");
    world.Empires__killShip(planetId, 1);
  }

  function testKillShipFailNotEnoughShips() public {
    testCreateShipSingle();
    vm.expectRevert("[OverrideSystem] Not enough ships to kill");
    world.Empires__killShip(planetId, 2);
  }

  function testDrainShieldFailNoShield() public {
    vm.expectRevert("[OverrideSystem] Not enough shields to drain");
    world.Empires__drainShield(planetId, 1);
  }

  function testDrainShieldFailNotEnoughShields() public {
    testChargeShieldSingle();
    vm.expectRevert("[OverrideSystem] Not enough shields to drain");
    world.Empires__drainShield(planetId, 2);
  }

  function testCreateFailNotOwned() public {
    bytes32 nonOwnedPlanetId;
    uint256 i = 0;
    do {
      nonOwnedPlanetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getEmpireId(nonOwnedPlanetId) != EEmpire.NULL);

    vm.expectRevert("[OverrideSystem] Planet is not owned");
    world.Empires__createShip(nonOwnedPlanetId, 1);
  }

  function testPurchaseOverrideProgressSingle() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.CreateShip, empire, true, 1);
    uint256 overrideCost = OverrideCost.get(empire, EOverride.CreateShip);

    vm.startPrank(alice);
    world.Empires__createShip{ value: totalCost }(planetId, 1);
    assertGt(
      LibPrice.getTotalCost(EOverride.CreateShip, empire, true, 1),
      totalCost,
      "Total Cost should have increased"
    );
    assertGt(OverrideCost.get(empire, EOverride.CreateShip), overrideCost, "Override Cost should have increased");
    assertEq(Player.getSpent(aliceId), totalCost, "Player should have spent total cost");
    assertEq(Balances.get(EMPIRES_NAMESPACE_ID), totalCost, "Namespace should have received the balance");
    assertEq(PointsMap.get(EEmpire.Red, aliceId), (EMPIRE_COUNT - 1) * pointUnit, "Player should have received points");
  }

  function testPurchaseOverrideProgressMultiple() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 overrideCount = 5;
    uint256 totalCost = LibPrice.getTotalCost(EOverride.CreateShip, empire, true, overrideCount);
    uint256 overrideCost = OverrideCost.get(empire, EOverride.CreateShip);

    vm.startPrank(alice);
    world.Empires__createShip{ value: totalCost }(planetId, overrideCount);
    assertGt(
      LibPrice.getTotalCost(EOverride.CreateShip, empire, true, overrideCount),
      totalCost,
      "Total Cost should have increased"
    );
    assertGt(OverrideCost.get(empire, EOverride.CreateShip), overrideCost, "Override Cost should have increased");
    assertEq(Player.getSpent(aliceId), totalCost, "Player should have spent total cost");
    assertEq(Balances.get(EMPIRES_NAMESPACE_ID), totalCost, "Namespace should have received the balance");
    assertEq(
      PointsMap.get(EEmpire.Red, aliceId),
      overrideCount * (EMPIRE_COUNT - 1) * pointUnit,
      "Player should have received points"
    );
  }

  function testPurchaseOverrideRegressSingle() public {
    testPurchaseOverrideProgressSingle();

    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.KillShip, empire, false, 1);
    uint256 overrideCost = OverrideCost.get(empire, EOverride.KillShip);
    uint256 initBalance = Balances.get(EMPIRES_NAMESPACE_ID);

    vm.startPrank(bob);
    world.Empires__killShip{ value: totalCost }(planetId, 1);
    assertGt(
      LibPrice.getTotalCost(EOverride.KillShip, empire, false, 1),
      totalCost,
      "Total Cost should have increased"
    );
    assertGt(OverrideCost.get(empire, EOverride.KillShip), overrideCost, "Override Cost should have increased");
    assertEq(Player.getSpent(bobId), totalCost, "Player should have spent total cost");
    assertEq(Balances.get(EMPIRES_NAMESPACE_ID), initBalance + totalCost, "Namespace should have received the balance");
    assertEq(PointsMap.get(EEmpire.Blue, bobId), pointUnit, "Player should have received blue points");
    assertEq(PointsMap.get(EEmpire.Green, bobId), pointUnit, "Player should have received green points");
  }

  function testPurchaseOverrideRegressMultiple() public {
    testPurchaseOverrideProgressMultiple();

    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 overrideCount = 5;
    uint256 totalCost = LibPrice.getTotalCost(EOverride.KillShip, empire, false, overrideCount);
    uint256 overrideCost = OverrideCost.get(empire, EOverride.KillShip);
    uint256 initBalance = Balances.get(EMPIRES_NAMESPACE_ID);

    vm.startPrank(bob);
    world.Empires__killShip{ value: totalCost }(planetId, overrideCount);
    assertGt(
      LibPrice.getTotalCost(EOverride.KillShip, empire, false, overrideCount),
      totalCost,
      "Total Cost should have increased"
    );
    assertGt(OverrideCost.get(empire, EOverride.KillShip), overrideCost, "Override Cost should have increased");
    assertEq(Player.getSpent(bobId), totalCost, "Player should have spent total cost");
    assertEq(Balances.get(EMPIRES_NAMESPACE_ID), initBalance + totalCost, "Namespace should have received the balance");
    assertEq(PointsMap.get(EEmpire.Blue, bobId), overrideCount * pointUnit, "Player should have received blue points");
    assertEq(
      PointsMap.get(EEmpire.Green, bobId),
      overrideCount * pointUnit,
      "Player should have received green points"
    );
  }

  /* ------------------------------- Sell Points ------------------------------ */
  function testSellPoints() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.CreateShip, empire, true, 1);

    console.log("alice balance before createShip", alice.balance);
    console.log("marginal cost before createShip", OverrideCost.get(empire, EOverride.CreateShip));
    vm.startPrank(alice);
    world.Empires__createShip{ value: totalCost }(planetId, 1);
    console.log("alice points after createShip", PointsMap.get(empire, aliceId));
    console.log("alice balance after createShip", alice.balance);

    uint256 aliceInitPoints = PointsMap.get(empire, aliceId);
    uint256 aliceInitBalance = alice.balance;
    uint256 gameInitBalance = Balances.get(EMPIRES_NAMESPACE_ID);
    uint256 pointSaleValue = LibPrice.getPointSaleValue(empire, 1 * pointUnit);
    uint256 overrideCost = OverrideCost.get(empire, EOverride.CreateShip);
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
    assertEq(overrideCost, OverrideCost.get(empire, EOverride.CreateShip), "Override Cost should not have changed");
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
    vm.expectRevert("[OverrideSystem] Player does not have enough points to remove");
    world.Empires__sellPoints(empire, 1);
  }

  function testSellPointsFailNotEnoughPoints() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.CreateShip, empire, true, 1);

    vm.startPrank(alice);
    world.Empires__createShip{ value: totalCost }(planetId, 1);

    vm.expectRevert("[OverrideSystem] Player does not have enough points to remove");
    world.Empires__sellPoints(empire, EMPIRE_COUNT * pointUnit);
  }

  function testSellPointsFailNotEnoughPointsWrongEmpire() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.CreateShip, empire, true, 1);

    vm.startPrank(alice);
    world.Empires__createShip{ value: totalCost }(planetId, 1);
    vm.expectRevert("[OverrideSystem] Player does not have enough points to remove");
    world.Empires__sellPoints(EEmpire.Green, 1 * pointUnit);
  }

  function testSellPointsFailGameBalanceInsufficient() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.CreateShip, empire, true, 1);

    vm.startPrank(alice);
    world.Empires__createShip{ value: totalCost }(planetId, 1);

    uint256 pointSaleValue = LibPrice.getPointSaleValue(empire, (EMPIRE_COUNT - 1) * pointUnit);

    vm.startPrank(creator);
    uint256 gameBalance = Balances.get(EMPIRES_NAMESPACE_ID);
    uint256 transferUnderSale = gameBalance - pointSaleValue + 1;
    world.transferBalanceToNamespace(EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID, transferUnderSale);

    vm.startPrank(alice);
    vm.expectRevert("[OverrideSystem] Insufficient funds for point sale");
    world.Empires__sellPoints(empire, (EMPIRE_COUNT - 1) * pointUnit);
  }

  function testTacticalStrikeFailTooEarly() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.CreateShip, empire, true, 1);

    vm.startPrank(alice);
    world.Empires__createShip{ value: totalCost }(planetId, 1);

    vm.roll(Planet.getCountdownEnd(planetId) - 1);

    vm.expectRevert("[OverrideSystem] Planet is not ready for a tactical strike");
    world.Empires__tacticalStrike(planetId);
  }

  function testTacticalStrike() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.CreateShip, empire, true, 1);

    vm.startPrank(alice);
    world.Empires__createShip{ value: totalCost }(planetId, 1);

    vm.roll(Planet.getCountdownEnd(planetId));
    world.Empires__tacticalStrike(planetId);
    assertEq(Planet.get(planetId).shipCount, 0);
  }
}
