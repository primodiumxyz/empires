// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { P_AcidConfig, Planet, P_PointConfig, P_GameConfig, Empire, P_OverrideConfig } from "codegen/index.sol";
import { EEmpire, EOverride } from "codegen/common.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { AcidPlanetsSet } from "adts/AcidPlanetsSet.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { addressToId } from "src/utils.sol";

contract OverrideAcidSystemTest is PrimodiumTest {
  bytes32 aliceId;
  bytes32 bobId;
  uint256 pointUnit;
  bytes32[] planetIds;

  function setUp() public override {
    super.setUp();
    aliceId = addressToId(alice);
    bobId = addressToId(bob);
    pointUnit = P_PointConfig.getPointUnit();
    planetIds = PlanetsSet.getPlanetIds();
  }

  function testPlaceAcidFailPlanetNotOwned() public {
    uint256 cost = LibPrice.getTotalCost(EOverride.PlaceAcid, EEmpire.Red, 1);
    vm.expectRevert("[OverrideSystem] Planet is not owned");
    world.Empires__placeAcid{ value: cost }(planetIds[0], EEmpire.Red);
  }

  function testPlaceAcidFailAlreadyAcid() public {
    assignPlanetToEmpire(planetIds[0], EEmpire.Red);
    vm.startPrank(creator);
    AcidPlanetsSet.add(EEmpire.Red, planetIds[0], 1);

    uint256 cost = LibPrice.getTotalCost(EOverride.PlaceAcid, EEmpire.Red, 1);
    vm.expectRevert("[OverrideSystem] Planet already has acid");
    world.Empires__placeAcid{ value: cost }(planetIds[0], EEmpire.Red);
  }

  function testPlaceAcidFailIncorrectPayment() public {
    assignPlanetToEmpire(planetIds[0], EEmpire.Red);
    uint256 cost = LibPrice.getTotalCost(EOverride.PlaceAcid, EEmpire.Red, 1);
    vm.expectRevert("[OverrideSystem] Insufficient payment");
    world.Empires__placeAcid{ value: cost - 1 }(planetIds[0], EEmpire.Red);
  }

  function testPlaceAcid() public {
    assignPlanetToEmpire(planetIds[0], EEmpire.Red);
    vm.startPrank(creator);
    uint256 initShips = 100;
    Planet.setShipCount(planetIds[0], initShips);

    assertFalse(AcidPlanetsSet.has(EEmpire.Red, planetIds[0]), "Planet should not have acid");
    uint256 cost = LibPrice.getTotalCost(EOverride.PlaceAcid, EEmpire.Red, 1);
    vm.startPrank(alice);
    world.Empires__placeAcid{ value: cost }(planetIds[0], EEmpire.Red);
    assertTrue(AcidPlanetsSet.has(EEmpire.Red, planetIds[0]), "Planet should have acid");
    uint256 shipsToRemove = (initShips * P_AcidConfig.getAcidDamagePercent()) / 10000;
    assertEq(
      Planet.getShipCount(planetIds[0]),
      initShips - shipsToRemove,
      "Ships should be removed after acid purchase"
    );
  }

  function testApplyAcidDamageRoundsDown() public {
    assignPlanetToEmpire(planetIds[0], EEmpire.Red);
    vm.startPrank(creator);
    uint256 initShips = 1;
    Planet.setShipCount(planetIds[0], initShips);

    assertFalse(AcidPlanetsSet.has(EEmpire.Red, planetIds[0]), "Planet should not have acid");
    uint256 cost = LibPrice.getTotalCost(EOverride.PlaceAcid, EEmpire.Red, 1);
    vm.startPrank(alice);
    world.Empires__placeAcid{ value: cost }(planetIds[0], EEmpire.Red);
    assertTrue(AcidPlanetsSet.has(EEmpire.Red, planetIds[0]), "Planet should have acid");
    uint256 shipsToRemove = 1;
    assertEq(
      Planet.getShipCount(planetIds[0]),
      initShips - shipsToRemove,
      "Ships should be removed after acid purchase"
    );
  }

  function testPlaceAcidSuccessWhenZeroShips() public {
    assignPlanetToEmpire(planetIds[0], EEmpire.Red);
    vm.startPrank(creator);
    uint256 initShips = 0;
    Planet.setShipCount(planetIds[0], initShips);

    assertFalse(AcidPlanetsSet.has(EEmpire.Red, planetIds[0]), "Planet should not have acid");
    uint256 cost = LibPrice.getTotalCost(EOverride.PlaceAcid, EEmpire.Red, 1);
    vm.startPrank(alice);
    world.Empires__placeAcid{ value: cost }(planetIds[0], EEmpire.Red);
    assertTrue(AcidPlanetsSet.has(EEmpire.Red, planetIds[0]), "Planet should have acid");
    assertEq(Planet.getShipCount(planetIds[0]), 0, "Ships should be 0");
  }

  function testPlaceAcidSkipDefeatedEmpirePoints() public {
    assignPlanetToEmpire(planetIds[0], EEmpire.Red);
    vm.startPrank(creator);
    uint256 empireCount = P_GameConfig.getEmpireCount();
    uint256 initCost = LibPrice.getRegressPointCost(EOverride.PlaceAcid, EEmpire.Red, 1);
    Empire.setIsDefeated(EEmpire.Blue, true);
    uint256 defeatedCost = LibPrice.getRegressPointCost(EOverride.PlaceAcid, EEmpire.Red, 1);
    assertEq(
      initCost / (empireCount - 1),
      defeatedCost / (empireCount - 2),
      "Defeated empire should not contribute to point cost"
    );
    uint256 totalCost = LibPrice.getTotalCost(EOverride.PlaceAcid, EEmpire.Red, 1);
    vm.startPrank(alice);
    world.Empires__placeAcid{ value: totalCost }(planetIds[0], EEmpire.Red);
    assertTrue(AcidPlanetsSet.has(EEmpire.Red, planetIds[0]), "Planet should have acid");

    uint256[] memory allPoints = new uint256[](empireCount + 1);
    for (uint256 i = 1; i <= empireCount; i++) {
      allPoints[i] = PointsMap.getValue(EEmpire(i), aliceId);
    }
    assertEq(allPoints[uint256(EEmpire.Red)], 0, "Red was impacted, so alice points should be 0");
    assertEq(allPoints[uint256(EEmpire.Blue)], 0, "Blue was defeated, so alice points should be 0");
    for (uint256 i = 1; i <= empireCount; i++) {
      if (i != uint256(EEmpire.Red) && i != uint256(EEmpire.Blue)) {
        assertEq(
          allPoints[i],
          P_OverrideConfig.getPointMultiplier(EOverride.PlaceAcid) * pointUnit,
          "Alice should have points for all other empires"
        );
      }
    }
  }
}
