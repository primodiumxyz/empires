// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { addressToId } from "src/utils.sol";
import { MagnetTurnPlanets, Magnet, P_MagnetConfig, Turn, P_RoutineCosts, Turn, P_GameConfig, Planet, P_GameConfig, P_PointConfig, P_PointConfigData, P_OverrideConfig, P_OverrideConfigData, OverrideCost, Empire } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";
import { LibRoutine } from "libraries/LibRoutine.sol";
import { LibMagnet } from "libraries/LibMagnet.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { EEmpire, ERoutine, EOverride } from "codegen/common.sol";
import { RoutineThresholds } from "src/Types.sol";
import { EMPIRE_COUNT } from "src/constants.sol";

contract UpdateSystemTest is PrimodiumTest {
  bytes32 planetId;
  bytes32 emptyPlanetId;
  bytes32 targetPlanetId;
  uint256 turnLength = 100;
  uint256 pointUnit;

  bytes32 aliceId;
  bytes32 bobId;

  RoutineThresholds[] allRoutineThresholds;
  RoutineThresholds routineThresholds;

  function setUp() public override {
    super.setUp();

    aliceId = addressToId(alice);
    bobId = addressToId(bob);
    pointUnit = P_PointConfig.getPointUnit();
    vm.startPrank(creator);
    P_GameConfig.setTurnLengthBlocks(turnLength);
    P_GameConfig.setGameOverBlock(block.number + 100000);
    uint256 i = 0;
    do {
      planetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getEmpireId(planetId) == EEmpire.NULL);

    i = 0;
    do {
      emptyPlanetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getEmpireId(emptyPlanetId) != EEmpire.NULL);

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
    EEmpire turn = Turn.getEmpire();

    routineThresholds = RoutineThresholds({
      planetId: planetId,
      accumulateGold: 0,
      buyShields: 0,
      buyShips: 10000,
      supportAlly: 10000,
      attackEnemy: 10000,
      attackTargetId: targetPlanetId,
      supportTargetId: targetPlanetId
    });
    allRoutineThresholds[0] = routineThresholds;
    world.Empires__updateWorld(allRoutineThresholds);
    uint256 goldIncrease = P_GameConfig.getGoldGenRate();

    bytes32[] memory planets = EmpirePlanetsSet.getEmpirePlanetIds(turn);
    for (uint i = 0; i < planets.length; i++) {
      bytes32 _planetId = planets[i];
      assertEq(Planet.getGoldCount(_planetId), goldIncrease * EMPIRE_COUNT);
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
    assertEq(
      OverrideCost.get(EEmpire.Green, EOverride.CreateShip),
      beginCreateShipCost - createShipCfg.overrideGenRate
    );
    assertEq(OverrideCost.get(EEmpire.Green, EOverride.KillShip), beginKillShipCost - killShipCfg.overrideGenRate);
  }

  function testMagnetRemoval() public {
    // Add a magnet to a planet
    EEmpire empire = Turn.getEmpire();
    uint256 turnDuration = 1;
    Empire.setPointsIssued(empire, 100 * pointUnit);
    PointsMap.setValue(empire, aliceId, 100 * pointUnit);
    LibMagnet.addMagnet(empire, planetId, addressToId(alice), turnDuration);

    // Simulate the end of the turn
    while (Turn.getEmpire() != empire) {
      vm.roll(block.number + P_GameConfig.getTurnLengthBlocks());
      assertTrue(Magnet.get(empire, planetId).isMagnet, "Magnet should be present");
      world.Empires__updateWorld(allRoutineThresholds);
    }

    world.Empires__updateWorld(allRoutineThresholds);
    // Verify magnet is removed
    assertFalse(Magnet.get(empire, planetId).isMagnet, "Magnet should be removed");
    assertEq(PointsMap.getLockedPoints(empire, addressToId(alice)), 0, "Locked points should be returned");
  }

  function testMagnetRemovalMultipleTurns() public {
    // Add a magnet to a planet
    EEmpire empire = Turn.getEmpire();
    uint256 turnDuration = 30;
    Empire.setPointsIssued(empire, 100 * pointUnit);
    PointsMap.setValue(empire, aliceId, 100 * pointUnit);
    LibMagnet.addMagnet(empire, planetId, addressToId(alice), turnDuration);

    uint256 turn = 0;
    // Simulate the end of the turn
    while (turn < turnDuration - 1) {
      vm.roll(block.number + P_GameConfig.getTurnLengthBlocks());
      assertTrue(Magnet.get(empire, planetId).isMagnet, "Magnet should be present");
      world.Empires__updateWorld(allRoutineThresholds);
      if (Turn.getEmpire() == empire) {
        turn++;
      }
    }

    vm.roll(block.number + P_GameConfig.getTurnLengthBlocks());
    world.Empires__updateWorld(allRoutineThresholds);
    // Verify magnet is removed
    assertFalse(Magnet.get(empire, planetId).isMagnet, "Magnet should be removed");
    assertEq(PointsMap.getLockedPoints(empire, addressToId(alice)), 0, "Locked points should be returned");
  }

  function testMultipleMagnetRemoval() public {
    EEmpire empire = Turn.getEmpire();
    uint256 turnDuration = 1;
    Empire.setPointsIssued(empire, 100 * pointUnit);
    PointsMap.setValue(empire, aliceId, 50 * pointUnit);
    PointsMap.setValue(empire, bobId, 50 * pointUnit);

    // Add multiple magnets
    LibMagnet.addMagnet(empire, planetId, addressToId(alice), turnDuration);
    LibMagnet.addMagnet(empire, emptyPlanetId, addressToId(bob), turnDuration);

    // Simulate the end of the turn
    while (Turn.getEmpire() != empire) {
      vm.roll(block.number + P_GameConfig.getTurnLengthBlocks());
      assertTrue(Magnet.get(empire, planetId).isMagnet, "Magnet should be present");
      world.Empires__updateWorld(allRoutineThresholds);
    }

    world.Empires__updateWorld(allRoutineThresholds);
    // Verify all magnets are removed
    assertFalse(Magnet.get(empire, planetId).isMagnet, "Magnet 1 should be removed");
    assertFalse(Magnet.get(empire, emptyPlanetId).isMagnet, "Magnet 2 should be removed");
    assertEq(PointsMap.getLockedPoints(empire, addressToId(alice)), 0, "Alice's locked points should be returned");
    assertEq(PointsMap.getLockedPoints(empire, addressToId(bob)), 0, "Bob's locked points should be returned");
  }

  function testMagnetRemovalEffectOnPlayerPoints() public {
    EEmpire empire = Turn.getEmpire();
    uint256 turnDuration = 1;
    Empire.setPointsIssued(empire, 100 * pointUnit);
    PointsMap.setValue(empire, aliceId, 100 * pointUnit);

    LibMagnet.addMagnet(empire, planetId, addressToId(alice), turnDuration);

    // Simulate the end of the turn
    while (Turn.getEmpire() != empire) {
      vm.roll(block.number + P_GameConfig.getTurnLengthBlocks());
      assertTrue(Magnet.get(empire, planetId).isMagnet, "Magnet should be present");
      world.Empires__updateWorld(allRoutineThresholds);
    }

    world.Empires__updateWorld(allRoutineThresholds);

    // Verify points
    assertFalse(Magnet.get(empire, planetId).isMagnet, "Magnet should not be present");
    assertEq(PointsMap.getValue(empire, addressToId(alice)), 100 * pointUnit, "Total points should remain the same");
    assertEq(PointsMap.getLockedPoints(empire, addressToId(alice)), 0, "Locked points should be zero");
  }

  function testMagnetRemovalNotPlacedOnCurrTurn() public {
    EEmpire empire = EEmpire(((uint8(Turn.getEmpire()) - 1) % EMPIRE_COUNT) + 1);
    uint256 turnDuration = 1;
    Empire.setPointsIssued(empire, 100 * pointUnit);
    PointsMap.setValue(empire, aliceId, 100 * pointUnit);

    LibMagnet.addMagnet(empire, planetId, addressToId(alice), turnDuration);

    // Simulate the end of the turn
    while (Turn.getEmpire() != empire) {
      vm.roll(block.number + P_GameConfig.getTurnLengthBlocks());
      assertTrue(Magnet.get(empire, planetId).isMagnet, "Magnet should be present");
      world.Empires__updateWorld(allRoutineThresholds);
    }

    world.Empires__updateWorld(allRoutineThresholds);

    // Verify points
    assertFalse(Magnet.get(empire, planetId).isMagnet, "Magnet should not be present");
    assertEq(PointsMap.getValue(empire, addressToId(alice)), 100 * pointUnit, "Total points should remain the same");
    assertEq(PointsMap.getLockedPoints(empire, addressToId(alice)), 0, "Locked points should be zero");
  }

  function testMagnetRemovalInteractionWithMagnetTurnPlanets() public {
    EEmpire empire = Turn.getEmpire();
    uint256 turnDuration = 2;
    Empire.setPointsIssued(empire, 100 * pointUnit);
    PointsMap.setValue(empire, aliceId, 100 * pointUnit);
    PointsMap.setValue(empire, bobId, 100 * pointUnit);

    LibMagnet.addMagnet(empire, planetId, addressToId(alice), turnDuration);
    LibMagnet.addMagnet(empire, emptyPlanetId, addressToId(bob), turnDuration + 1);

    // Simulate two turns passing
    for (uint i = 0; i <= EMPIRE_COUNT; i++) {
      vm.roll(block.number + P_GameConfig.getTurnLengthBlocks());
      world.Empires__updateWorld(allRoutineThresholds);
    }

    // Verify first magnet is removed, second is not
    assertFalse(Magnet.get(empire, planetId).isMagnet, "First magnet should be removed");
    assertTrue(Magnet.get(empire, emptyPlanetId).isMagnet, "Second magnet should not be removed yet");
  }
}
