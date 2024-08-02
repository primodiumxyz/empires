// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { Turn, P_RoutineCosts, Turn, P_GameConfig, Planet, P_GameConfig, P_PointConfig, P_PointConfigData, P_OverrideConfig, P_OverrideConfigData, OverrideCost, Empire } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { LibRoutine } from "libraries/LibRoutine.sol";
import { EEmpire, ERoutine, EOverride } from "codegen/common.sol";
import { RoutineThresholds } from "src/Types.sol";

contract UpdateSystemTest is PrimodiumTest {
  bytes32 planetId;
  bytes32 targetPlanetId;
  uint256 turnLength = 100;

  RoutineThresholds[] allRoutineThresholds;
  RoutineThresholds routineThresholds;

  function setUp() public override {
    super.setUp();

    vm.startPrank(creator);
    P_GameConfig.setTurnLengthBlocks(turnLength);
    P_GameConfig.setGameOverBlock(block.number + 100000);
    uint256 i = 0;
    do {
      planetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getEmpireId(planetId) == EEmpire.NULL);
    console.logBytes32(planetId);

    targetPlanetId = PlanetsSet.getPlanetIds()[1];

    routineThresholds = RoutineThresholds({
      planetId: planetId,
      accumulateGold: 2000,
      buyShields: 4000,
      buyShips: 6000,
      supportAlly: 8000,
      attackEnemy: 10000,
      attackTargetId: targetPlanetId,
      supportTargetId: targetPlanetId
    });
    allRoutineThresholds.push(routineThresholds);
  }

  function testUpdateExecuted() public {
    world.Empires__updateWorld(allRoutineThresholds);

    vm.roll(block.number + turnLength - 1);

    vm.expectRevert("[UpdateSystem] Cannot update yet");
    world.Empires__updateWorld(allRoutineThresholds);

    vm.roll(block.number + 1);

    world.Empires__updateWorld(allRoutineThresholds);
  }

  function testUpdateNextTurnBlock() public {
    world.Empires__updateWorld(allRoutineThresholds);
    assertEq(Turn.getNextTurnBlock(), block.number + turnLength);
  }

  /* ---------------------------------- Gold ---------------------------------- */

  function testAddGoldToEveryPlanet() public {
    RoutineThresholds memory _routineThresholds = RoutineThresholds({
      planetId: planetId,
      accumulateGold: 0,
      buyShields: 10000,
      buyShips: 10000,
      supportAlly: 10000,
      attackEnemy: 10000,
      attackTargetId: targetPlanetId,
      supportTargetId: targetPlanetId
    });
    allRoutineThresholds[0] = _routineThresholds;
    world.Empires__updateWorld(allRoutineThresholds);
    uint256 goldIncrease = P_GameConfig.getGoldGenRate();

    bytes32[] memory planets = PlanetsSet.getPlanetIds();
    for (uint i = 0; i < planets.length; i++) {
      bytes32 _planetId = planets[i];
      assertEq(Planet.getGoldCount(_planetId), goldIncrease);
    }
  }

  function testSpendGoldBuyShipsRoutine() public {
    uint256 shipsRoutine = routineThresholds.buyShips - 1;
    uint256 gold = 9;

    Planet.setGoldCount(planetId, gold);

    uint256 shipPrice = 2;
    P_RoutineCosts.set(ERoutine.BuyShips, shipPrice);

    uint256 expectedShips = gold / shipPrice;
    uint256 expectedRemainder = gold % shipPrice;

    LibRoutine._executeRoutine(routineThresholds, shipsRoutine);

    assertEq(Planet.getGoldCount(planetId), expectedRemainder, "gold count wrong");
    assertEq(Planet.getShipCount(planetId), expectedShips, "ships wrong");
  }

  function testGeneratePointsAndOverrides() public {
    P_PointConfigData memory pointCfg = P_PointConfig.get();
    uint256 beginPointCost = pointCfg.minPointCost + pointCfg.pointGenRate;
    Empire.setPointCost(EEmpire.Red, beginPointCost);
    Empire.setPointCost(EEmpire.Blue, beginPointCost);
    Empire.setPointCost(EEmpire.Green, beginPointCost);

    P_OverrideConfigData memory createShipCfg = P_OverrideConfig.get(EOverride.CreateShip);
    uint256 beginCreateShipCost = createShipCfg.minOverrideCost + createShipCfg.overrideGenRate;
    P_OverrideConfigData memory killShipCfg = P_OverrideConfig.get(EOverride.KillShip);
    uint256 beginKillShipCost = killShipCfg.minOverrideCost + killShipCfg.overrideGenRate;
    OverrideCost.set(EEmpire.Red, EOverride.CreateShip, beginCreateShipCost);
    OverrideCost.set(EEmpire.Red, EOverride.KillShip, beginKillShipCost);
    OverrideCost.set(EEmpire.Blue, EOverride.CreateShip, beginCreateShipCost);
    OverrideCost.set(EEmpire.Blue, EOverride.KillShip, beginKillShipCost);
    OverrideCost.set(EEmpire.Green, EOverride.CreateShip, beginCreateShipCost);
    OverrideCost.set(EEmpire.Green, EOverride.KillShip, beginKillShipCost);

    vm.roll(block.number + turnLength);
    world.Empires__updateWorld(allRoutineThresholds);

    assertEq(Empire.getPointCost(EEmpire.Red), beginPointCost - pointCfg.pointGenRate);
    assertEq(Empire.getPointCost(EEmpire.Blue), beginPointCost - pointCfg.pointGenRate);
    assertEq(Empire.getPointCost(EEmpire.Green), beginPointCost - pointCfg.pointGenRate);

    assertEq(OverrideCost.get(EEmpire.Red, EOverride.CreateShip), beginCreateShipCost - createShipCfg.overrideGenRate);
    assertEq(OverrideCost.get(EEmpire.Red, EOverride.KillShip), beginKillShipCost - killShipCfg.overrideGenRate);
    assertEq(OverrideCost.get(EEmpire.Blue, EOverride.CreateShip), beginCreateShipCost - createShipCfg.overrideGenRate);
    assertEq(OverrideCost.get(EEmpire.Blue, EOverride.KillShip), beginKillShipCost - killShipCfg.overrideGenRate);
    assertEq(OverrideCost.get(EEmpire.Green, EOverride.CreateShip), beginCreateShipCost - createShipCfg.overrideGenRate);
    assertEq(OverrideCost.get(EEmpire.Green, EOverride.KillShip), beginKillShipCost - killShipCfg.overrideGenRate);
  }
}
