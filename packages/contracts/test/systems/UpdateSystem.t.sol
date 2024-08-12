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
import { ERoutine, EOverride } from "codegen/common.sol";
import { RoutineThresholds } from "src/Types.sol";

contract UpdateSystemTest is PrimodiumTest {
  bytes32 planetId;
  bytes32 emptyPlanetId;
  bytes32 targetPlanetId;
  uint256 turnLength = 100;
  uint256 pointUnit;
  uint8 EMPIRE_COUNT;

  bytes32 aliceId;
  bytes32 bobId;

  RoutineThresholds[] allRoutineThresholds;
  RoutineThresholds routineThresholds;

  function setUp() public override {
    super.setUp();

    aliceId = addressToId(alice);
    bobId = addressToId(bob);
    pointUnit = P_PointConfig.getPointUnit();
    EMPIRE_COUNT = P_GameConfig.getEmpireCount();
    vm.startPrank(creator);
    P_GameConfig.setTurnLengthBlocks(turnLength);
    P_GameConfig.setGameOverBlock(block.number + 100000);
    uint256 i = 0;
    do {
      planetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getEmpireId(planetId) == 0);

    i = 0;
    do {
      emptyPlanetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getEmpireId(emptyPlanetId) != 0);

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
    Empire.setPointCost(1, beginPointCost);
    Empire.setPointCost(2, beginPointCost);
    Empire.setPointCost(3, beginPointCost);

    P_OverrideConfigData memory createShipCfg = P_OverrideConfig.get(EOverride.CreateShip);
    uint256 beginCreateShipCost = createShipCfg.minOverrideCost + createShipCfg.overrideGenRate;
    P_OverrideConfigData memory killShipCfg = P_OverrideConfig.get(EOverride.KillShip);
    uint256 beginKillShipCost = killShipCfg.minOverrideCost + killShipCfg.overrideGenRate;
    OverrideCost.set(1, EOverride.CreateShip, beginCreateShipCost);
    OverrideCost.set(1, EOverride.KillShip, beginKillShipCost);
    OverrideCost.set(2, EOverride.CreateShip, beginCreateShipCost);
    OverrideCost.set(2, EOverride.KillShip, beginKillShipCost);
    OverrideCost.set(3, EOverride.CreateShip, beginCreateShipCost);
    OverrideCost.set(3, EOverride.KillShip, beginKillShipCost);

    vm.roll(block.number + turnLength);
    world.Empires__updateWorld(allRoutineThresholds);

    assertEq(Empire.getPointCost(1), beginPointCost - pointCfg.pointGenRate);
    assertEq(Empire.getPointCost(2), beginPointCost - pointCfg.pointGenRate);
    assertEq(Empire.getPointCost(3), beginPointCost - pointCfg.pointGenRate);

    assertEq(OverrideCost.get(1, EOverride.CreateShip), beginCreateShipCost - createShipCfg.overrideGenRate);
    assertEq(OverrideCost.get(1, EOverride.KillShip), beginKillShipCost - killShipCfg.overrideGenRate);
    assertEq(OverrideCost.get(2, EOverride.CreateShip), beginCreateShipCost - createShipCfg.overrideGenRate);
    assertEq(OverrideCost.get(2, EOverride.KillShip), beginKillShipCost - killShipCfg.overrideGenRate);
    assertEq(OverrideCost.get(3, EOverride.CreateShip), beginCreateShipCost - createShipCfg.overrideGenRate);
    assertEq(OverrideCost.get(3, EOverride.KillShip), beginKillShipCost - killShipCfg.overrideGenRate);
  }

  function _getEndTurn(uint256 turnDuration) internal view returns (uint256) {
    return block.number + (turnDuration * 3) * P_GameConfig.getTurnLengthBlocks();
  }

  function testMagnetRemoval() public {
    // Add a magnet to a planet
    uint8 empire = Turn.getEmpire();
    uint256 turnDuration = 1;
    uint256 endTurn = _getEndTurn(turnDuration);
    Empire.setPointsIssued(empire, 100 * pointUnit);
    PointsMap.setValue(empire, aliceId, 100 * pointUnit);
    LibMagnet.addMagnet(empire, planetId, addressToId(alice), turnDuration);

    // Simulate the end of the turn
    while (block.number < endTurn) {
      vm.roll(block.number + P_GameConfig.getTurnLengthBlocks());
      assertTrue(Magnet.get(empire, planetId).isMagnet, "Magnet should be present");
      world.Empires__updateWorld(allRoutineThresholds);
    }

    // Verify magnet is removed
    assertFalse(Magnet.get(empire, planetId).isMagnet, "Magnet should be removed");
    assertEq(PointsMap.getLockedPoints(empire, addressToId(alice)), 0, "Locked points should be returned");
  }

  function testMagnetRemovalMultipleTurns() public {
    // Add a magnet to a planet
    uint8 empire = Turn.getEmpire();
    uint256 turnDuration = 30;
    uint256 endTurn = _getEndTurn(turnDuration);
    Empire.setPointsIssued(empire, 100 * pointUnit);
    PointsMap.setValue(empire, aliceId, 100 * pointUnit);
    LibMagnet.addMagnet(empire, planetId, addressToId(alice), turnDuration);

    // Simulate the end of the turn
    while (block.number < endTurn) {
      vm.roll(block.number + P_GameConfig.getTurnLengthBlocks());
      assertTrue(Magnet.get(empire, planetId).isMagnet, "Magnet should be present");
      world.Empires__updateWorld(allRoutineThresholds);
    }

    // Verify magnet is removed
    assertFalse(Magnet.get(empire, planetId).isMagnet, "Magnet should be removed");
    assertEq(PointsMap.getLockedPoints(empire, addressToId(alice)), 0, "Locked points should be returned");
  }

  function testMultipleMagnetRemoval() public {
    uint8 empire = Turn.getEmpire();
    uint256 turnDuration = 1;
    uint256 endTurn = _getEndTurn(turnDuration);
    Empire.setPointsIssued(empire, 100 * pointUnit);
    PointsMap.setValue(empire, aliceId, 50 * pointUnit);
    PointsMap.setValue(empire, bobId, 50 * pointUnit);

    // Add multiple magnets
    LibMagnet.addMagnet(empire, planetId, addressToId(alice), turnDuration);
    LibMagnet.addMagnet(empire, emptyPlanetId, addressToId(bob), turnDuration);

    // Simulate the end of the turn
    while (block.number < endTurn) {
      vm.roll(block.number + P_GameConfig.getTurnLengthBlocks());
      assertTrue(Magnet.get(empire, planetId).isMagnet, "Magnet should be present");
      world.Empires__updateWorld(allRoutineThresholds);
    }

    // Verify all magnets are removed
    assertFalse(Magnet.get(empire, planetId).isMagnet, "Magnet 1 should be removed");
    assertFalse(Magnet.get(empire, emptyPlanetId).isMagnet, "Magnet 2 should be removed");
    assertEq(PointsMap.getLockedPoints(empire, addressToId(alice)), 0, "Alice's locked points should be returned");
    assertEq(PointsMap.getLockedPoints(empire, addressToId(bob)), 0, "Bob's locked points should be returned");
  }

  function testMagnetRemovalEffectOnPlayerPoints() public {
    uint8 empire = Turn.getEmpire();
    uint256 turnDuration = 1;
    uint256 endTurn = _getEndTurn(turnDuration);
    Empire.setPointsIssued(empire, 100 * pointUnit);
    PointsMap.setValue(empire, aliceId, 100 * pointUnit);

    LibMagnet.addMagnet(empire, planetId, addressToId(alice), turnDuration);

    // Simulate the end of the turn
    while (block.number < endTurn) {
      vm.roll(block.number + P_GameConfig.getTurnLengthBlocks());
      assertTrue(Magnet.get(empire, planetId).isMagnet, "Magnet should be present");
      world.Empires__updateWorld(allRoutineThresholds);
    }

    // Verify points
    assertFalse(Magnet.get(empire, planetId).isMagnet, "Magnet should not be present");
    assertEq(PointsMap.getValue(empire, addressToId(alice)), 100 * pointUnit, "Total points should remain the same");
    assertEq(PointsMap.getLockedPoints(empire, addressToId(alice)), 0, "Locked points should be zero");
  }

  function testMagnetRemovalNotPlacedOnCurrTurn() public {
    uint8 empire = ((uint8(Turn.getEmpire()) - 1) % EMPIRE_COUNT) + 1;
    uint256 turnDuration = 1;
    uint256 endTurn = _getEndTurn(turnDuration);
    Empire.setPointsIssued(empire, 100 * pointUnit);
    PointsMap.setValue(empire, aliceId, 100 * pointUnit);

    LibMagnet.addMagnet(empire, planetId, addressToId(alice), turnDuration);

    // Simulate the end of the turn
    while (block.number < endTurn) {
      vm.roll(block.number + P_GameConfig.getTurnLengthBlocks());
      assertTrue(Magnet.get(empire, planetId).isMagnet, "Magnet should be present");
      world.Empires__updateWorld(allRoutineThresholds);
    }

    // Verify points
    assertFalse(Magnet.get(empire, planetId).isMagnet, "Magnet should not be present");
    assertEq(PointsMap.getValue(empire, addressToId(alice)), 100 * pointUnit, "Total points should remain the same");
    assertEq(PointsMap.getLockedPoints(empire, addressToId(alice)), 0, "Locked points should be zero");
  }

  function testMagnetRemovalInteractionWithMagnetTurnPlanets() public {
    uint8 empire = Turn.getEmpire();
    uint256 turnDuration = 2;
    uint256 endTurn = _getEndTurn(turnDuration);
    Empire.setPointsIssued(empire, 100 * pointUnit);
    PointsMap.setValue(empire, aliceId, 100 * pointUnit);
    PointsMap.setValue(empire, bobId, 100 * pointUnit);

    LibMagnet.addMagnet(empire, planetId, addressToId(alice), turnDuration);
    LibMagnet.addMagnet(empire, emptyPlanetId, addressToId(bob), turnDuration + 1);

    // Simulate two turns passing
    while (block.number < endTurn) {
      vm.roll(block.number + P_GameConfig.getTurnLengthBlocks());
      world.Empires__updateWorld(allRoutineThresholds);
    }

    // Verify first magnet is removed, second is not
    assertFalse(Magnet.get(empire, planetId).isMagnet, "First magnet should be removed");
    assertTrue(Magnet.get(empire, emptyPlanetId).isMagnet, "Second magnet should not be removed yet");
  }
}
