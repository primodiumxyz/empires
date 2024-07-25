// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { Turn, P_NPCActionCosts, Turn, P_GameConfig, Planet, P_GameConfig, P_PointConfig, P_PointConfigData, P_ActionConfig, P_ActionConfigData, ActionCost, Empire } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { LibNPCAction } from "libraries/LibNPCAction.sol";
import { EEmpire, ENPCAction, EPlayerAction } from "codegen/common.sol";
import { Likelihoods } from "src/Types.sol";

contract UpdateSystemTest is PrimodiumTest {
  bytes32 planetId;
  uint256 turnLength = 100;

  Likelihoods[] allLikelihoods;
  Likelihoods likelihoods;

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

    Likelihoods memory _likelihoods = Likelihoods({
      planetId: planetId,
      buyShields: 1,
      attackEnemy: 1,
      accumulateGold: 1,
      buyShips: 1,
      supportAlly: 1,
      attackTargetId: bytes32(""),
      supportTargetId: bytes32("")
    });
    likelihoods = _likelihoods;
    allLikelihoods.push(_likelihoods);
  }

  function testUpdateExecuted() public {
    world.Empires__updateWorld(allLikelihoods);

    vm.roll(block.number + turnLength - 1);

    vm.expectRevert("[UpdateSystem] Cannot update yet");
    world.Empires__updateWorld(allLikelihoods);

    vm.roll(block.number + 1);

    world.Empires__updateWorld(allLikelihoods);
  }

  function testUpdateNextTurnBlock() public {
    world.Empires__updateWorld(allLikelihoods);
    assertEq(Turn.getNextTurnBlock(), block.number + turnLength);
  }

  /* ---------------------------------- Gold ---------------------------------- */

  function testAddGoldToEveryPlanet() public {
    world.Empires__updateWorld(allLikelihoods);
    uint256 goldIncrease = P_GameConfig.getGoldGenRate();

    bytes32[] memory planets = PlanetsSet.getPlanetIds();
    for (uint i = 0; i < planets.length; i++) {
      bytes32 _planetId = planets[i];
      assertEq(Planet.getGoldCount(_planetId), goldIncrease);
    }
  }

  function testSpendGoldBuyShipsAction() public {
    uint256 shipsAction = likelihoods.buyShips - 1;
    uint256 gold = 9;

    Planet.setGoldCount(planetId, gold);

    uint256 shipPrice = 2;
    P_NPCActionCosts.set(ENPCAction.BuyShips, shipPrice);

    uint256 expectedShips = gold / shipPrice;
    uint256 expectedRemainder = gold % shipPrice;

    LibNPCAction._executeAction(planetId, shipsAction, likelihoods);

    assertEq(Planet.getGoldCount(planetId), expectedRemainder, "gold count wrong");
    assertEq(Planet.getShipCount(planetId), expectedShips, "ships wrong");
  }

  function testGeneratePointsAndPlayerActions() public {
    P_PointConfigData memory pointCfg = P_PointConfig.get();
    uint256 beginPointCost = pointCfg.minPointCost + pointCfg.pointGenRate;
    Empire.setPointCost(EEmpire.Red, beginPointCost);
    Empire.setPointCost(EEmpire.Blue, beginPointCost);
    Empire.setPointCost(EEmpire.Green, beginPointCost);

    P_ActionConfigData memory actionCfg = P_ActionConfig.get();
    uint256 beginActionCost = actionCfg.minActionCost + actionCfg.actionGenRate;
    ActionCost.set(EEmpire.Red, EPlayerAction.CreateShip, beginActionCost);
    ActionCost.set(EEmpire.Red, EPlayerAction.KillShip, beginActionCost);
    ActionCost.set(EEmpire.Blue, EPlayerAction.CreateShip, beginActionCost);
    ActionCost.set(EEmpire.Blue, EPlayerAction.KillShip, beginActionCost);
    ActionCost.set(EEmpire.Green, EPlayerAction.CreateShip, beginActionCost);
    ActionCost.set(EEmpire.Green, EPlayerAction.KillShip, beginActionCost);

    vm.roll(block.number + turnLength);
    world.Empires__updateWorld(allLikelihoods);

    assertEq(Empire.getPointCost(EEmpire.Red), beginPointCost - pointCfg.pointGenRate);
    assertEq(Empire.getPointCost(EEmpire.Blue), beginPointCost - pointCfg.pointGenRate);
    assertEq(Empire.getPointCost(EEmpire.Green), beginPointCost - pointCfg.pointGenRate);

    assertEq(ActionCost.get(EEmpire.Red, EPlayerAction.CreateShip), beginActionCost - actionCfg.actionGenRate);
    assertEq(ActionCost.get(EEmpire.Red, EPlayerAction.KillShip), beginActionCost - actionCfg.actionGenRate);
    assertEq(ActionCost.get(EEmpire.Blue, EPlayerAction.CreateShip), beginActionCost - actionCfg.actionGenRate);
    assertEq(ActionCost.get(EEmpire.Blue, EPlayerAction.KillShip), beginActionCost - actionCfg.actionGenRate);
    assertEq(ActionCost.get(EEmpire.Green, EPlayerAction.CreateShip), beginActionCost - actionCfg.actionGenRate);
    assertEq(ActionCost.get(EEmpire.Green, EPlayerAction.KillShip), beginActionCost - actionCfg.actionGenRate);
  }
}
