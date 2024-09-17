// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { P_AcidConfig, Planet, P_PointConfig } from "codegen/index.sol";
import { EEmpire, EOverride } from "codegen/common.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { AcidPlanetsSet } from "adts/AcidPlanetsSet.sol";
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
    world.Empires__placeAcid{ value: cost }(planetIds[0]);
  }

  function testPlaceAcidFailAlreadyAcid() public {
    assignPlanetToEmpire(planetIds[0], EEmpire.Red);
    vm.startPrank(creator);
    AcidPlanetsSet.add(EEmpire.Red, planetIds[0], 1);
    
    uint256 cost = LibPrice.getTotalCost(EOverride.PlaceAcid, EEmpire.Red, 1);
    vm.expectRevert("[OverrideSystem] Planet already has acid");
    world.Empires__placeAcid{ value: cost }(planetIds[0]);
  }

  function testPlaceAcidFailIncorrectPayment() public {
    assignPlanetToEmpire(planetIds[0], EEmpire.Red);
    uint256 cost = LibPrice.getTotalCost(EOverride.PlaceAcid, EEmpire.Red, 1);
    vm.expectRevert("[OverrideSystem] Insufficient payment");
    world.Empires__placeAcid{ value: cost - 1 }(planetIds[0]);
  }

  function testPlaceAcid() public {
    assignPlanetToEmpire(planetIds[0], EEmpire.Red);
    vm.startPrank(creator);
    uint256 initShips = 100;
    Planet.setShipCount(planetIds[0], initShips);

    assertFalse(AcidPlanetsSet.has(EEmpire.Red, planetIds[0]), "Planet should not have acid");
    uint256 cost = LibPrice.getTotalCost(EOverride.PlaceAcid, EEmpire.Red, 1);
    vm.startPrank(alice);
    world.Empires__placeAcid{ value: cost }(planetIds[0]);
    assertTrue(AcidPlanetsSet.has(EEmpire.Red, planetIds[0]), "Planet should have acid");
    uint256 shipsToRemove = (initShips * P_AcidConfig.getAcidDamagePercent()) / 10000;
    assertEq(Planet.getShipCount(planetIds[0]), initShips - shipsToRemove, "Ships should be removed after acid purchase");
  }

  function testApplyAcidDamageRoundsDown() public {
    assignPlanetToEmpire(planetIds[0], EEmpire.Red);
    vm.startPrank(creator);
    uint256 initShips = 1;
    Planet.setShipCount(planetIds[0], initShips);

    assertFalse(AcidPlanetsSet.has(EEmpire.Red, planetIds[0]), "Planet should not have acid");
    uint256 cost = LibPrice.getTotalCost(EOverride.PlaceAcid, EEmpire.Red, 1);
    vm.startPrank(alice);
    world.Empires__placeAcid{ value: cost }(planetIds[0]);
    assertTrue(AcidPlanetsSet.has(EEmpire.Red, planetIds[0]), "Planet should have acid");
    uint256 shipsToRemove = 1;
    assertEq(Planet.getShipCount(planetIds[0]), initShips - shipsToRemove, "Ships should be removed after acid purchase");
  }

  function testPlaceAcidSuccessWhenZeroShips() public {
    assignPlanetToEmpire(planetIds[0], EEmpire.Red);
    vm.startPrank(creator);
    uint256 initShips = 0;
    Planet.setShipCount(planetIds[0], initShips);

    assertFalse(AcidPlanetsSet.has(EEmpire.Red, planetIds[0]), "Planet should not have acid");
    uint256 cost = LibPrice.getTotalCost(EOverride.PlaceAcid, EEmpire.Red, 1);
    vm.startPrank(alice);
    world.Empires__placeAcid{ value: cost }(planetIds[0]);
    assertTrue(AcidPlanetsSet.has(EEmpire.Red, planetIds[0]), "Planet should have acid");
    assertEq(Planet.getShipCount(planetIds[0]), 0, "Ships should be 0");
  }
}