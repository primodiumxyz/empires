// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { addressToId } from "src/utils.sol";
import { MagnetTurnPlanets, Magnet, P_MagnetConfig, Turn, P_RoutineCosts, Turn, P_GameConfig, Planet, P_GameConfig, P_PointConfig, P_PointConfigData, P_OverrideConfig, P_OverrideConfigData, P_AcidConfig, OverrideCost, Empire, PendingMove, PendingMoveData, Arrivals } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";
import { AcidPlanetsSet } from "adts/AcidPlanetsSet.sol";
import { LibRoutine } from "libraries/LibRoutine.sol";
import { LibMagnet } from "libraries/LibMagnet.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { EEmpire, ERoutine, EOverride } from "codegen/common.sol";
import { RoutineThresholds } from "src/Types.sol";

contract UpdateSystemTest is PrimodiumTest {
  uint8 EMPIRE_COUNT;
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
    EMPIRE_COUNT = P_GameConfig.getEmpireCount();
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
      moveShips: 10000,
      targetPlanetId: targetPlanetId
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
    uint256 startingShips = Planet.getShipCount(planetId);

    Planet.setGoldCount(planetId, gold);

    uint256 shipPrice = 2;
    P_RoutineCosts.set(ERoutine.BuyShips, shipPrice);

    uint256 expectedShips = gold / shipPrice;
    uint256 expectedRemainder = gold % shipPrice;

    LibRoutine._executeRoutine(routineThresholds, shipsRoutine);

    assertEq(Planet.getGoldCount(planetId), expectedRemainder, "gold count wrong");
    assertEq(Planet.getShipCount(planetId), expectedShips + startingShips, "ships wrong");
  }

  function testGeneratePointsAndOverrides() public {
    P_PointConfigData memory pointCfg = P_PointConfig.get();
    uint256 beginPointCost = pointCfg.minPointCost + pointCfg.pointGenRate;
    Empire.setPointCost(EEmpire.Red, beginPointCost);
    Empire.setPointCost(EEmpire.Blue, beginPointCost);
    Empire.setPointCost(EEmpire.Green, beginPointCost);

    P_OverrideConfigData memory createShipCfg = P_OverrideConfig.get(EOverride.CreateShip);
    uint256 beginCreateShipCost = createShipCfg.minOverrideCost + createShipCfg.overrideGenRate;
    OverrideCost.set(EEmpire.Red, EOverride.CreateShip, beginCreateShipCost);
    OverrideCost.set(EEmpire.Blue, EOverride.CreateShip, beginCreateShipCost);
    OverrideCost.set(EEmpire.Green, EOverride.CreateShip, beginCreateShipCost);

    vm.roll(block.number + turnLength);
    world.Empires__updateWorld(allRoutineThresholds);

    assertEq(Empire.getPointCost(EEmpire.Red), beginPointCost - pointCfg.pointGenRate);
    assertEq(Empire.getPointCost(EEmpire.Blue), beginPointCost - pointCfg.pointGenRate);
    assertEq(Empire.getPointCost(EEmpire.Green), beginPointCost - pointCfg.pointGenRate);

    assertEq(OverrideCost.get(EEmpire.Red, EOverride.CreateShip), beginCreateShipCost - createShipCfg.overrideGenRate);
    assertEq(OverrideCost.get(EEmpire.Blue, EOverride.CreateShip), beginCreateShipCost - createShipCfg.overrideGenRate);
    assertEq(
      OverrideCost.get(EEmpire.Green, EOverride.CreateShip),
      beginCreateShipCost - createShipCfg.overrideGenRate
    );
  }

  function _getEndTurn(uint256 turnDuration) internal view returns (uint256) {
    uint8 empireCount = P_GameConfig.getEmpireCount();
    return block.number + (turnDuration * empireCount) * P_GameConfig.getTurnLengthBlocks();
  }

  function testMagnetRemoval() public {
    // Add a magnet to a planet
    EEmpire empire = Turn.getEmpire();
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
    EEmpire empire = Turn.getEmpire();
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
    EEmpire empire = Turn.getEmpire();
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
    EEmpire empire = Turn.getEmpire();
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
    EEmpire empire = EEmpire(((uint8(Turn.getEmpire()) - 1) % EMPIRE_COUNT) + 1);
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
    EEmpire empire = Turn.getEmpire();
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

  function testAcidUpdate() public {
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    uint256 acidDuration = 3;
    vm.startPrank(creator);
    P_AcidConfig.setAcidDuration(acidDuration);
    P_AcidConfig.setAcidDamagePercent(1000); // out of 10000, 10%

    assignPlanetToEmpire(planetIds[0], EEmpire.Red);
    assignPlanetToEmpire(planetIds[1], EEmpire.Red);
    assignPlanetToEmpire(planetIds[5], EEmpire.Blue);
    vm.startPrank(creator);

    AcidPlanetsSet.add(EEmpire.Red, planetIds[0], acidDuration - 1); // two cycles left
    AcidPlanetsSet.add(EEmpire.Red, planetIds[1], 1); // one cycle left
    AcidPlanetsSet.add(EEmpire.Blue, planetIds[5], acidDuration - 1); // index is 5 just to add some space to prevent conquers

    Planet.setShipCount(planetIds[0], 10);
    Planet.setShipCount(planetIds[1], 10);
    Planet.setShipCount(planetIds[5], 10);

    Turn.setEmpire(EEmpire.Red);
    vm.roll(block.number + P_GameConfig.getTurnLengthBlocks());
    world.Empires__updateWorld(allRoutineThresholds);
    uint256 acidCyclesRedPlanetA = AcidPlanetsSet.getAcidCycles(EEmpire.Red, planetIds[0]);
    uint256 acidCyclesRedPlanetB = AcidPlanetsSet.getAcidCycles(EEmpire.Red, planetIds[1]);
    uint256 acidCyclesBlue = AcidPlanetsSet.getAcidCycles(EEmpire.Blue, planetIds[5]);
    assertEq(acidCyclesRedPlanetA, acidDuration - 2, "Red Empire Planet A Acid cycles should have decremented");
    assertEq(acidCyclesRedPlanetB, 0, "Red Empire Planet B Acid cycles should be removed");
    assertEq(acidCyclesBlue, acidDuration - 1, "Blue Empire Planet Acid cycles should not have changed");

    assertFalse(AcidPlanetsSet.has(EEmpire.Red, planetIds[1]), "Red Empire Planet B should not be in set anymore");

    assertEq(Planet.getShipCount(planetIds[0]), 9, "Red Empire Planet A should have lost 1 ship");
    assertEq(Planet.getShipCount(planetIds[1]), 9, "Red Empire Planet B should have lost 1 ship");
    assertEq(Planet.getShipCount(planetIds[5]), 10, "Blue Empire Planet should not have lost any ships");
  }

  function testUpdateAcidConquerChangeEmpire() public {
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    uint256 acidDuration = 3;
    vm.startPrank(creator);
    P_AcidConfig.setAcidDuration(acidDuration);
    P_AcidConfig.setAcidDamagePercent(1000); // out of 10000, 10%

    assignPlanetToEmpire(planetIds[0], EEmpire.Red);
    vm.startPrank(creator);
    AcidPlanetsSet.add(EEmpire.Red, planetIds[0], acidDuration - 1); // two cycles left

    uint256 initShips = 5;
    uint256 incomingShips = 7;
    Planet.setShipCount(planetIds[0], initShips);
    Planet.setShieldCount(planetIds[0], 0);
    Arrivals.set(planetIds[0], EEmpire.Blue, incomingShips);

    Turn.setEmpire(EEmpire.Blue);
    vm.roll(block.number + P_GameConfig.getTurnLengthBlocks());
    world.Empires__updateWorld(allRoutineThresholds);

    assertEq(
      Planet.getShipCount(planetIds[0]),
      incomingShips - initShips - 1,
      "Ship count should be 1 due to conquer and instant acid update"
    );
    assertEq(Planet.getEmpireId(planetIds[0]), EEmpire.Blue, "Planet should be conquered by blue");
    assertEq(
      AcidPlanetsSet.getAcidCycles(EEmpire.Red, planetIds[0]),
      0,
      "Planet not owned by red anymore, acid data should be removed"
    );
    assertFalse(
      AcidPlanetsSet.has(EEmpire.Red, planetIds[0]),
      "Planet not owned by red anymore, acid data should be removed"
    );
    assertEq(
      AcidPlanetsSet.getAcidCycles(EEmpire.Blue, planetIds[0]),
      acidDuration - 2,
      "Planet conquered by blue and experienced an acid cycle, should have 1 cycle left"
    );
    assertTrue(AcidPlanetsSet.has(EEmpire.Blue, planetIds[0]), "Planet conquered by blue, acid data should be added");
  }
}
