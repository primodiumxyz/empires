// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { P_GameConfig, Planet, P_PointConfig, Empire } from "codegen/index.sol";
import { EEmpire, EOverride } from "codegen/common.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { OverrideAirdropSystem } from "systems/OverrideAirdropSystem.sol";
import { addressToId } from "src/utils.sol";


contract OverrideAirdropSystemTest is PrimodiumTest, OverrideAirdropSystem {
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

  // Helper function to assign planetIds to empires, where the count of each empire is specified by the assignedCount array
  function assignPlanetIdsToEmpires(uint256[] memory assignedCount) public {
    clearAllEmpirePlanets();
    uint256 assignedIndex = 0;
    for (uint256 i = 0; i < assignedCount.length; i++) {
      for (uint256 j = 0; j < assignedCount[i]; j++) {
        assertTrue(assignedIndex < planetIds.length, "Assigned index is out of bounds, too many assigned by test");
        assignPlanetToEmpire(planetIds[assignedIndex], EEmpire(i));
        assignedIndex++;
      }
    }
  }

  function testGetAveragePlanetsPerOpposingEmpireIgnoreSelf() public {
    uint256[] memory assignedCount = new uint256[](uint256(EEmpire.LENGTH));
    assignedCount[uint256(EEmpire.Red)] = 10;
    assignedCount[uint256(EEmpire.Blue)] = 1;
    assignedCount[uint256(EEmpire.Green)] = 1;
    assignPlanetIdsToEmpires(assignedCount);

    uint256 average = OverrideAirdropSystem.getAveragePlanetsPerOpposingEmpire(EEmpire.Red);
    assertEq(average, 1, "Average does not ignore self");
  }

  function testGetAveragePlanetsPerOpposingEmpireIgnoreDeadEmpires() public {
    uint256[] memory assignedCount = new uint256[](uint256(EEmpire.LENGTH));
    assignedCount[uint256(EEmpire.Red)] = 1;
    assignedCount[uint256(EEmpire.Blue)] = 0;
    assignedCount[uint256(EEmpire.Green)] = 10;
    assignPlanetIdsToEmpires(assignedCount);

    uint256 average = OverrideAirdropSystem.getAveragePlanetsPerOpposingEmpire(EEmpire.Red);
    assertEq(average, 10, "Average does not ignore dead empires");
  }

  function testGetAveragePlanetsPerOpposingEmpireRoundUp() public {
    uint256[] memory assignedCount = new uint256[](uint256(EEmpire.LENGTH));
    assignedCount[uint256(EEmpire.Red)] = 1;
    assignedCount[uint256(EEmpire.Blue)] = 1;
    assignedCount[uint256(EEmpire.Green)] = 10;
    assignPlanetIdsToEmpires(assignedCount);

    uint256 average = OverrideAirdropSystem.getAveragePlanetsPerOpposingEmpire(EEmpire.Red);
    assertEq(average, 6, "Average does not round up");
  }

  function testAirdropGoldFail() public {
    uint256 cost = LibPrice.getTotalCost(EOverride.AirdropGold, EEmpire.Red, 1);
    vm.expectRevert("[OverrideSystem] Empire is not owned");
    world.Empires__airdropGold{ value: cost }(EEmpire.NULL, 1);
    vm.expectRevert("[OverrideSystem] Insufficient payment");
    world.Empires__airdropGold{ value: cost - 1 }(EEmpire.Red, 1);
  }

  function testAirdropGoldFailDefeatedEmpire() public {
    vm.startPrank(creator);
    Empire.setDefeated(EEmpire.Red, true);
    uint256 cost = LibPrice.getTotalCost(EOverride.AirdropGold, EEmpire.Red, 1);
    vm.expectRevert("[EmpiresSystem] Empire defeated");
    world.Empires__airdropGold{ value: cost }(EEmpire.Red, 1);
  }

  // this shouldn't happen in production because it should be flagged as defeated, but we'll test it just in case
  function testAirdropGoldFailDeadEmpire() public {
    // test an empire that shouldn't be playing - EEmpire.LENGTH
    uint256 cost = LibPrice.getTotalCost(EOverride.AirdropGold, EEmpire.LENGTH, 1);
    vm.expectRevert("[OverrideSystem] Empire has no planets");
    world.Empires__airdropGold{ value: cost }(EEmpire.LENGTH, 1);

    // Make Red empire dead and test again with Red empire
    vm.startPrank(creator);
    bytes32[] memory empirePlanetIds = EmpirePlanetsSet.getEmpirePlanetIds(EEmpire.Red);
    for (uint256 i = 0; i < empirePlanetIds.length; i++) {
      Planet.setEmpireId(empirePlanetIds[i], EEmpire.NULL);
    }
    EmpirePlanetsSet.clear(EEmpire.Red);

    cost = LibPrice.getTotalCost(EOverride.AirdropGold, EEmpire.Red, 1);
    vm.expectRevert("[OverrideSystem] Empire has no planets");
    world.Empires__airdropGold{ value: cost }(EEmpire.Red, 1);
  }

  function testAirdropGoldSingleOverrideEven() public {
    uint256[] memory assignedCount = new uint256[](uint256(EEmpire.LENGTH));
    assignedCount[uint256(EEmpire.Red)] = 2;
    assignedCount[uint256(EEmpire.Blue)] = 4;
    assignedCount[uint256(EEmpire.Green)] = 7;
    assignPlanetIdsToEmpires(assignedCount);

    uint256 totalDistributeGold = OverrideAirdropSystem.getAveragePlanetsPerOpposingEmpire(EEmpire.Red);
    assertEq(totalDistributeGold, 6, "Average does not round up");
    uint256 distributePerPlanet = totalDistributeGold / assignedCount[uint256(EEmpire.Red)];

    vm.startPrank(creator);
    uint256 initialGoldCount = 10;
    for (uint256 i = 0; i < planetIds.length; i++) {
      Planet.setGoldCount(planetIds[i], initialGoldCount);
    }

    uint256 cost = LibPrice.getTotalCost(EOverride.AirdropGold, EEmpire.Red, 1);
    world.Empires__airdropGold{ value: cost }(EEmpire.Red, 1);

    for (uint256 i = 0; i < planetIds.length; i++) {
      if (i < assignedCount[uint256(EEmpire.Red)]) {
        assertEq(Planet.getGoldCount(planetIds[i]), initialGoldCount + distributePerPlanet, "Gold count should be 13");
      } else {
        assertEq(Planet.getGoldCount(planetIds[i]), initialGoldCount, "Gold count should not change");
      }
    }
  }

  function testAirdropGoldSingleOverrideOdd() public {
    uint256[] memory assignedCount = new uint256[](uint256(EEmpire.LENGTH));
    assignedCount[uint256(EEmpire.Red)] = 2;
    assignedCount[uint256(EEmpire.Blue)] = 4;
    assignedCount[uint256(EEmpire.Green)] = 6;
    assignPlanetIdsToEmpires(assignedCount);

    uint256 totalDistributeGold = OverrideAirdropSystem.getAveragePlanetsPerOpposingEmpire(EEmpire.Red);
    assertEq(totalDistributeGold, 5, "Average is incorrect");
    uint256 distributePerPlanet = totalDistributeGold / assignedCount[uint256(EEmpire.Red)];

    vm.startPrank(creator);
    uint256 initialGoldCount = 10;
    for (uint256 i = 0; i < planetIds.length; i++) {
      Planet.setGoldCount(planetIds[i], initialGoldCount);
    }

    uint256 cost = LibPrice.getTotalCost(EOverride.AirdropGold, EEmpire.Red, 1);
    world.Empires__airdropGold{ value: cost }(EEmpire.Red, 1);

    for (uint256 i = 0; i < planetIds.length; i++) {
      if (i < assignedCount[uint256(EEmpire.Red)]) {
        assertTrue(Planet.getGoldCount(planetIds[i]) == initialGoldCount + distributePerPlanet || Planet.getGoldCount(planetIds[i]) == initialGoldCount + distributePerPlanet + 1, "Gold count should be 12 or 13");
      } else {
        assertEq(Planet.getGoldCount(planetIds[i]), initialGoldCount, "Gold count should not change");
      }
    }
    assertEq(Planet.getGoldCount(planetIds[0]) + Planet.getGoldCount(planetIds[1]), initialGoldCount * 2 + totalDistributeGold, "Gold should be fully distributed");
  }

  function testAirdropGoldMultipleOverrideEven() public {
    uint256 overrideCount = 5;
    uint256[] memory assignedCount = new uint256[](uint256(EEmpire.LENGTH));
    assignedCount[uint256(EEmpire.Red)] = 2;
    assignedCount[uint256(EEmpire.Blue)] = 4;
    assignedCount[uint256(EEmpire.Green)] = 7;
    assignPlanetIdsToEmpires(assignedCount);

    uint256 totalDistributeGold = overrideCount * OverrideAirdropSystem.getAveragePlanetsPerOpposingEmpire(EEmpire.Red);
    assertEq(totalDistributeGold, 6 * overrideCount, "Average does not round up");
    uint256 distributePerPlanet = totalDistributeGold / assignedCount[uint256(EEmpire.Red)];

    vm.startPrank(creator);
    uint256 initialGoldCount = 10;
    for (uint256 i = 0; i < planetIds.length; i++) {
      Planet.setGoldCount(planetIds[i], initialGoldCount);
    }

    uint256 cost = LibPrice.getTotalCost(EOverride.AirdropGold, EEmpire.Red, overrideCount);
    world.Empires__airdropGold{ value: cost }(EEmpire.Red, overrideCount);

    for (uint256 i = 0; i < planetIds.length; i++) {
      if (i < assignedCount[uint256(EEmpire.Red)]) {
        assertEq(Planet.getGoldCount(planetIds[i]), initialGoldCount + distributePerPlanet, "Gold count should be 25");
      } else {
        assertEq(Planet.getGoldCount(planetIds[i]), initialGoldCount, "Gold count should not change");
      }
    }
  }

  function testAirdropGoldMultipleOverrideOdd() public {
    uint256 overrideCount = 5;
    uint256[] memory assignedCount = new uint256[](uint256(EEmpire.LENGTH));
    assignedCount[uint256(EEmpire.Red)] = 2;
    assignedCount[uint256(EEmpire.Blue)] = 4;
    assignedCount[uint256(EEmpire.Green)] = 6;
    assignPlanetIdsToEmpires(assignedCount);

    uint256 totalDistributeGold = overrideCount * OverrideAirdropSystem.getAveragePlanetsPerOpposingEmpire(EEmpire.Red);
    assertEq(totalDistributeGold, 5 * overrideCount, "Average does not round up");
    uint256 distributePerPlanet = totalDistributeGold / assignedCount[uint256(EEmpire.Red)];

    vm.startPrank(creator);
    uint256 initialGoldCount = 10;
    for (uint256 i = 0; i < planetIds.length; i++) {
      Planet.setGoldCount(planetIds[i], initialGoldCount);
    }

    uint256 cost = LibPrice.getTotalCost(EOverride.AirdropGold, EEmpire.Red, overrideCount);
    world.Empires__airdropGold{ value: cost }(EEmpire.Red, overrideCount);

    for (uint256 i = 0; i < planetIds.length; i++) {
      if (i < assignedCount[uint256(EEmpire.Red)]) {
        assertTrue(Planet.getGoldCount(planetIds[i]) == initialGoldCount + distributePerPlanet || Planet.getGoldCount(planetIds[i]) == initialGoldCount + distributePerPlanet + 1, "Gold count should be 24 or 25");
      } else {
        assertEq(Planet.getGoldCount(planetIds[i]), initialGoldCount, "Gold count should not change");
      }
    }
    assertEq(Planet.getGoldCount(planetIds[0]) + Planet.getGoldCount(planetIds[1]), initialGoldCount * 2 + totalDistributeGold, "Gold should be fully distributed");
  }
  

}