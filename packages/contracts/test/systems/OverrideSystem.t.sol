// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { Turn, P_GameConfig, Planet, PlanetData, OverrideCost, P_PointConfig, P_MagnetConfig, Magnet, Empire, ShieldEater, P_ShieldEaterConfig, P_OverrideConfig } from "codegen/index.sol";
import { Balances } from "@latticexyz/world/src/codegen/tables/Balances.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { PlayersMap } from "adts/PlayersMap.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibShieldEater } from "libraries/LibShieldEater.sol";
import { OverrideShipSystem } from "systems/OverrideShipSystem.sol";
import { EEmpire, EOverride, EDirection } from "codegen/common.sol";
import { addressToId } from "src/utils.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";
import { addressToId, coordToId } from "src/utils.sol";
import { CoordData } from "src/Types.sol";

contract OverrideSystemTest is PrimodiumTest {
  bytes32 planetId;
  bytes32 aliceId;
  bytes32 bobId;
  uint256 pointUnit;
  uint8 EMPIRE_COUNT;

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
    EMPIRE_COUNT = P_GameConfig.getEmpireCount();
  }

  function testOverspend() public {
    uint256 initBalance = alice.balance;
    vm.startPrank(alice);
    uint256 cost = LibPrice.getTotalCost(EOverride.CreateShip, Planet.getEmpireId(planetId), 1);
    world.Empires__createShip{ value: cost + 1 }(planetId, Planet.getEmpireId(planetId), 1);
    assertEq(alice.balance, initBalance - cost, "Alice should have been refunded the 1 wei");
  }

  function testUnderspend() public {
    vm.startPrank(alice);
    uint256 cost = LibPrice.getTotalCost(EOverride.CreateShip, Planet.getEmpireId(planetId), 1);
    vm.expectRevert("[OverrideSystem] Insufficient payment");
    world.Empires__createShip{ value: cost - 1 }(planetId, Planet.getEmpireId(planetId), 1);
  }

  function testExactSpend() public {
    uint256 initBalance = alice.balance;
    vm.startPrank(alice);
    uint256 cost = LibPrice.getTotalCost(EOverride.CreateShip, Planet.getEmpireId(planetId), 1);
    world.Empires__createShip{ value: cost }(planetId, Planet.getEmpireId(planetId), 1);
    assertEq(alice.balance, initBalance - cost, "Alice should have spent the exact amount");
  }

  function testCreateShipSingle() public {
    uint256 cost = LibPrice.getTotalCost(EOverride.CreateShip, Planet.getEmpireId(planetId), 1);
    uint256 startingShips = Planet.getShipCount(planetId);
    world.Empires__createShip{ value: cost }(planetId, Planet.getEmpireId(planetId), 1);
    assertEq(Planet.get(planetId).shipCount, 1 + startingShips);
  }

  function testCreateShipMultiple() public {
    uint256 cost = LibPrice.getTotalCost(EOverride.CreateShip, Planet.getEmpireId(planetId), 10);
    uint256 startingShips = Planet.getShipCount(planetId);
    world.Empires__createShip{ value: cost }(planetId, Planet.getEmpireId(planetId), 10);
    assertEq(Planet.get(planetId).shipCount, 10 + startingShips);
  }

  function testChargeShieldSingle() public {
    uint256 currentShields = Planet.get(planetId).shieldCount;
    uint256 cost = LibPrice.getTotalCost(EOverride.ChargeShield, Planet.getEmpireId(planetId), 1);
    world.Empires__chargeShield{ value: cost }(planetId, Planet.getEmpireId(planetId), 1);
    assertEq(Planet.getShieldCount(planetId), currentShields + 1);
  }

  function testChargeShieldMultiple() public {
    uint256 currentShields = Planet.getShieldCount(planetId);
    uint256 cost = LibPrice.getTotalCost(EOverride.ChargeShield, Planet.getEmpireId(planetId), 10);
    world.Empires__chargeShield{ value: cost }(planetId, Planet.getEmpireId(planetId), 10);
    assertEq(Planet.getShieldCount(planetId), currentShields + 10);
  }

  function testCreateFailNotOwned() public {
    bytes32 nonOwnedPlanetId;
    uint256 i = 0;
    do {
      nonOwnedPlanetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getEmpireId(nonOwnedPlanetId) != EEmpire.NULL);

    vm.expectRevert("[OverrideSystem] Planet is not owned");
    world.Empires__createShip(nonOwnedPlanetId, EEmpire.Red, 1);
  }

  function testPurchaseOverrideProgressSingle() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.CreateShip, empire, 1);
    uint256 overrideCost = OverrideCost.get(empire, EOverride.CreateShip);

    vm.startPrank(alice);
    world.Empires__createShip{ value: totalCost }(planetId, empire, 1);
    assertGt(LibPrice.getTotalCost(EOverride.CreateShip, empire, 1), totalCost, "Total Cost should have increased");
    assertGt(OverrideCost.get(empire, EOverride.CreateShip), overrideCost, "Override Cost should have increased");
    assertEq(PlayersMap.get(aliceId).loss, totalCost, "Player should have spent total cost");
    assertEq(Balances.get(EMPIRES_NAMESPACE_ID), totalCost, "Namespace should have received the balance");
    assertEq(
      PointsMap.getValue(EEmpire.Red, aliceId),
      (EMPIRE_COUNT - 1) * pointUnit,
      "Player should have received points"
    );
  }

  function testPurchaseOverrideProgressMultiple() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 overrideCount = 5;
    uint256 totalCost = LibPrice.getTotalCost(EOverride.CreateShip, empire, overrideCount);
    uint256 overrideCost = OverrideCost.get(empire, EOverride.CreateShip);

    vm.startPrank(alice);
    world.Empires__createShip{ value: totalCost }(planetId, empire, overrideCount);
    assertGt(
      LibPrice.getTotalCost(EOverride.CreateShip, empire, overrideCount),
      totalCost,
      "Total Cost should have increased"
    );
    assertGt(OverrideCost.get(empire, EOverride.CreateShip), overrideCost, "Override Cost should have increased");
    assertEq(PlayersMap.get(aliceId).loss, totalCost, "Player should have spent total cost");
    assertEq(Balances.get(EMPIRES_NAMESPACE_ID), totalCost, "Namespace should have received the balance");
    assertEq(
      PointsMap.getValue(EEmpire.Red, aliceId),
      overrideCount * (EMPIRE_COUNT - 1) * pointUnit,
      "Player should have received points"
    );
  }

  /* ------------------------------- Sell Points ------------------------------ */
  function testSellPoints() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.CreateShip, empire, 1);

    console.log("alice balance before createShip", alice.balance);
    console.log("marginal cost before createShip", OverrideCost.get(empire, EOverride.CreateShip));
    vm.startPrank(alice);
    world.Empires__createShip{ value: totalCost }(planetId, empire, 1);
    console.log("alice points after createShip", PointsMap.getValue(empire, aliceId));
    console.log("alice balance after createShip", alice.balance);

    uint256 aliceInitPoints = PointsMap.getValue(empire, aliceId);
    uint256 aliceInitBalance = alice.balance;
    uint256 gameInitBalance = Balances.get(EMPIRES_NAMESPACE_ID);
    uint256 pointSaleValue = LibPrice.getPointSaleValue(empire, 1 * pointUnit);
    uint256 overrideCost = OverrideCost.get(empire, EOverride.CreateShip);
    uint256 empirePointsIssued = Empire.getPointsIssued(empire);

    world.Empires__sellPoints(empire, 1 * pointUnit, ((pointSaleValue * 90) / 100));

    assertEq(PointsMap.getValue(empire, aliceId), aliceInitPoints - (1 * pointUnit), "Player should have lost points");
    assertEq(alice.balance, aliceInitBalance + pointSaleValue, "Player should have gained balance");
    assertEq(
      Balances.get(EMPIRES_NAMESPACE_ID),
      gameInitBalance - pointSaleValue,
      "Namespace should have lost balance"
    );
    assertEq(
      LibPrice.getPointSaleValue(empire, 1 * pointUnit),
      pointSaleValue - ((P_PointConfig.getPointPriceIncrease() * (10000 - P_PointConfig.getPointSellTax())) / 10000),
      "Point Sale Value should have decreased"
    );
    assertEq(overrideCost, OverrideCost.get(empire, EOverride.CreateShip), "Override Cost should not have changed");
    assertEq(
      Empire.getPointsIssued(empire),
      empirePointsIssued - (1 * pointUnit),
      "Empire should have reduced points issued"
    );

    console.log("alice points after sellPoints", PointsMap.getValue(empire, aliceId));
    console.log("alice balance after sellPoints", alice.balance);
  }

  function testSellPointsFailNoPointsOwned() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 pointSaleValue = LibPrice.getPointSaleValue(empire, 1 * pointUnit);
    vm.startPrank(alice);
    vm.expectRevert("[OverrideSystem] Player does not have enough points to remove");
    world.Empires__sellPoints(empire, 1, ((pointSaleValue * 90) / 100));
  }

  function testSellPointsFailNotEnoughPoints() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.CreateShip, empire, 1);
    uint256 pointSaleValue = LibPrice.getPointSaleValue(empire, 1 * pointUnit);

    vm.startPrank(alice);
    world.Empires__createShip{ value: totalCost }(planetId, empire, 1);

    vm.expectRevert("[OverrideSystem] Player does not have enough points to remove");
    world.Empires__sellPoints(empire, EMPIRE_COUNT * pointUnit, ((pointSaleValue * 90) / 100));
  }

  function testSellPointsFailNotEnoughPointsWrongEmpire() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.CreateShip, empire, 1);
    uint256 pointSaleValue = LibPrice.getPointSaleValue(empire, 1 * pointUnit);

    vm.startPrank(alice);
    world.Empires__createShip{ value: totalCost }(planetId, empire, 1);
    vm.expectRevert("[OverrideSystem] Player does not have enough points to remove");
    world.Empires__sellPoints(EEmpire.Green, 1 * pointUnit, ((pointSaleValue * 90) / 100));
  }

  function testSellPointsFailGameBalanceInsufficient() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.CreateShip, empire, 1);

    vm.startPrank(alice);
    world.Empires__createShip{ value: totalCost }(planetId, empire, 1);

    uint256 pointSaleValue = LibPrice.getPointSaleValue(empire, (EMPIRE_COUNT - 1) * pointUnit);

    vm.startPrank(creator);
    uint256 gameBalance = Balances.get(EMPIRES_NAMESPACE_ID);
    uint256 transferUnderSale = gameBalance - pointSaleValue + 1;
    world.transferBalanceToNamespace(EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID, transferUnderSale);

    vm.startPrank(alice);
    vm.expectRevert("[OverrideSystem] Insufficient funds for point sale");
    world.Empires__sellPoints(empire, (EMPIRE_COUNT - 1) * pointUnit, ((pointSaleValue * 90) / 100));
  }

  function testSellPointsFailLockedPoints() public {
    EEmpire empire = Planet.getEmpireId(planetId);

    vm.startPrank(creator);
    PointsMap.setValue(empire, aliceId, 100 * pointUnit);
    PointsMap.setLockedPoints(empire, aliceId, 50 * pointUnit);
    uint256 pointSaleValue = LibPrice.getPointSaleValue(empire, 1 * pointUnit);

    switchPrank(alice);
    vm.expectRevert("[OverrideSystem] Player does not have enough points to remove");
    world.Empires__sellPoints(empire, 100 * pointUnit, ((pointSaleValue * 90) / 100));
  }

  function testSellPointsLockedPoints() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    vm.prank(creator);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.CreateShip, empire, 1);
    uint256 pointSaleValue = LibPrice.getPointSaleValue(empire, 1 * pointUnit);

    vm.startPrank(alice);
    world.Empires__createShip{ value: totalCost }(planetId, empire, 1);
    uint256 points = PointsMap.getValue(empire, aliceId);
    vm.startPrank(creator);
    PointsMap.setLockedPoints(empire, aliceId, pointUnit);

    switchPrank(alice);
    world.Empires__sellPoints(empire, pointUnit, ((pointSaleValue * 90) / 100));
    assertEq(PointsMap.getLockedPoints(empire, aliceId), pointUnit, "Locked Points should be 50");
    assertEq(PointsMap.getValue(empire, aliceId), points - (pointUnit), "Player Points should be 80");
  }

  function testPlaceMagnet() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.PlaceMagnet, empire, 1);
    uint256 pointsToStake = (P_MagnetConfig.getLockedPointsPercent() * Empire.getPointsIssued(empire)) / 10000;

    vm.prank(creator);
    Turn.setValue(32);
    vm.prank(alice);
    world.Empires__placeMagnet{ value: totalCost }(empire, planetId, 1);
    assertEq(Magnet.getIsMagnet(empire, planetId), true, "Magnet should be placed");
    assertEq(Magnet.getLockedPoints(empire, planetId), pointsToStake, "Magnet should have locked points");
    assertEq(Magnet.getPlayerId(empire, planetId), aliceId, "Magnet should have player id");
    assertEq(Magnet.getEndTurn(empire, planetId), Turn.getValue() + EMPIRE_COUNT, "Magnet should have end turn");
    assertEq(PointsMap.getLockedPoints(empire, aliceId), pointsToStake, "Player Points should be 80");
  }

  function testPlaceMagnetMultipleTurns() public {
    uint256 turns = 3;
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.PlaceMagnet, empire, turns);
    uint256 pointsToStake = (P_MagnetConfig.getLockedPointsPercent() * Empire.getPointsIssued(empire)) / 10000;
    vm.prank(alice);
    world.Empires__placeMagnet{ value: totalCost }(empire, planetId, turns);
    uint256 currTurn = Turn.getValue();

    assertEq(Magnet.getIsMagnet(empire, planetId), true, "Magnet should be placed");
    assertEq(Magnet.getLockedPoints(empire, planetId), pointsToStake, "Magnet should have locked points");
    assertEq(Magnet.getPlayerId(empire, planetId), aliceId, "Magnet should have player id");
    assertEq(Magnet.getEndTurn(empire, planetId), currTurn + EMPIRE_COUNT * turns, "Magnet should have end turn");
    assertEq(PointsMap.getLockedPoints(empire, aliceId), pointsToStake, "Player Points should be 80");
  }

  function testPlaceMagnetMultipleTurnsGas() public {
    vm.startPrank(creator);
    P_MagnetConfig.setLockedPointsPercent(1000);

    uint256 turns = 3;
    EEmpire empire = EEmpire.Blue;
    uint256 initGas;
    uint256 gasUsed;
    uint256 maxGasUsed = 0;
    for (uint256 i = 0; i < 10; i++) {
      planetId = PlanetsSet.getPlanetIds()[i];
      assignPlanetToEmpire(planetId, empire);
      uint256 totalCost = LibPrice.getTotalCost(EOverride.PlaceMagnet, empire, turns);

      vm.prank(alice);
      initGas = gasleft();
      world.Empires__placeMagnet{ value: totalCost }(empire, planetId, turns);
      gasUsed = initGas - gasleft();
      console.log("Gas used: ", gasUsed);
      if (gasUsed > maxGasUsed) {
        maxGasUsed = gasUsed;
      }
    }
    console.log("Max gas used: ", maxGasUsed);
  }

  function testPlaceMagnetFailExistingMagnet() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.PlaceMagnet, empire, 1);

    vm.prank(alice);
    world.Empires__placeMagnet{ value: totalCost }(empire, planetId, 1);

    vm.prank(bob);
    vm.expectRevert("[OverrideSystem] Planet already has a magnet");
    world.Empires__placeMagnet{ value: totalCost }(empire, planetId, 1);
  }

  function testPlaceMagnetFailInsufficientPayment() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.PlaceMagnet, empire, 1);

    vm.prank(alice);
    vm.expectRevert("[OverrideSystem] Insufficient payment");
    world.Empires__placeMagnet{ value: totalCost - 1 }(empire, planetId, 1);
  }

  function testPlaceMagnetFailInsufficientPoints() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.PlaceMagnet, empire, 1);

    // Set player points to 0
    vm.startPrank(creator);
    Empire.setPointsIssued(empire, 100 * pointUnit);
    PointsMap.setValue(empire, aliceId, 0);

    switchPrank(alice);
    vm.expectRevert("[OverrideSystem] Player does not have enough points to place magnet");
    world.Empires__placeMagnet{ value: totalCost }(empire, planetId, 1);
  }

  function testPlaceMagnetFailDefeatedEmpire() public {
    EEmpire empire = EEmpire.Blue;
    vm.prank(creator);
    Empire.setIsDefeated(empire, true);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.PlaceMagnet, empire, 1);

    vm.prank(alice);
    vm.expectRevert("[EmpiresSystem] Empire defeated");
    world.Empires__placeMagnet{ value: totalCost }(empire, planetId, 1);
  }

  function testPlaceMagnetCostDeduction() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.PlaceMagnet, empire, 1);
    uint256 initialBalance = alice.balance;

    vm.prank(alice);
    world.Empires__placeMagnet{ value: totalCost }(empire, planetId, 1);

    assertEq(alice.balance, initialBalance - totalCost, "Incorrect amount deducted from player's balance");
  }

  function testPlaceMagnetPointLocking() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 totalCost = LibPrice.getTotalCost(EOverride.PlaceMagnet, empire, 1);
    uint256 initialPoints = PointsMap.getValue(empire, aliceId);
    uint256 expectedLockedPoints = (P_MagnetConfig.getLockedPointsPercent() * Empire.getPointsIssued(empire)) / 10000;

    vm.prank(alice);
    world.Empires__placeMagnet{ value: totalCost }(empire, planetId, 1);

    assertEq(PointsMap.getLockedPoints(empire, aliceId), expectedLockedPoints, "Incorrect amount of points locked");
    assertEq(
      PointsMap.getValue(empire, aliceId),
      initialPoints + ((EMPIRE_COUNT - 1) * pointUnit) * P_OverrideConfig.getPointMultiplier(EOverride.PlaceMagnet),
      "Total points should not change"
    );
  }

  /**************************************************************************
   * Shield Eater
   *************************************************************************/

  function testDetonateShieldEaterCharged() public {
    uint256 chargeTime = P_ShieldEaterConfig.getDetonationThreshold() * 5;

    vm.startPrank(creator);
    LibShieldEater.initialize();

    for (uint256 i = 0; i < chargeTime; i++) {
      LibShieldEater.update();
    }

    planetId = ShieldEater.getCurrentPlanet();
    bytes32 neighborId;

    for (uint256 i = 2; i < uint256(EDirection.LENGTH); i++) {
      // get the neighbor
      neighborId = LibShieldEater.getNeighbor(planetId, EDirection(i));

      // if neighbor is a planet
      if (Planet.getIsPlanet(neighborId)) {
        break;
      }
    }

    uint256 planetShields = Planet.getShieldCount(planetId);
    uint256 neighborShields = Planet.getShieldCount(neighborId);

    uint256 planetDamage = P_ShieldEaterConfig.getDetonateCenterDamage();
    uint256 neighborDamage = P_ShieldEaterConfig.getDetonateAdjacentDamage();

    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 cost = LibPrice.getTotalCost(EOverride.DetonateShieldEater, empire, 1);
    world.Empires__detonateShieldEater{ value: cost }();

    uint256 expectedPlanetShields = planetShields - ((planetShields * planetDamage) / 10000);
    uint256 expectedNeighborShields = neighborShields - ((neighborShields * neighborDamage) / 10000);

    uint256 planetShieldsAfter = Planet.getShieldCount(planetId);
    uint256 neighborShieldsAfter = Planet.getShieldCount(neighborId);

    assertEq(expectedPlanetShields, planetShieldsAfter, "Center Planet should have correct shields");
    assertEq(expectedNeighborShields, neighborShieldsAfter, "Neighbor Planet should have correct shields");
  }

  function testDetonateShieldEaterNotCharged() public {
    vm.startPrank(creator);
    LibShieldEater.initialize();

    planetId = ShieldEater.getCurrentPlanet();
    EEmpire empire = Planet.getEmpireId(planetId);
    uint256 cost = LibPrice.getTotalCost(EOverride.DetonateShieldEater, empire, 1);
    vm.expectRevert("[OverrideSystem] ShieldEater not fully charged");
    world.Empires__detonateShieldEater{ value: cost }();
  }
}
