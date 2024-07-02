// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { Turn, P_NPCActionThresholds, P_NPCActionCosts, Turn, P_GameConfig, Planet, P_GameConfig } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { LibGold } from "libraries/LibGold.sol";
import { EEmpire, ENPCAction } from "codegen/common.sol";

contract UpdateSystemTest is PrimodiumTest {
  bytes32 planetId;
  uint256 turnLength = 100;
  function setUp() public override {
    super.setUp();

    vm.startPrank(creator);
    P_GameConfig.setTurnLengthBlocks(turnLength);
    uint256 i = 0;
    do {
      planetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getFactionId(planetId) == EEmpire.NULL);
  }

  function testUpdateExecuted() public {
    world.Empires__updateWorld();

    vm.roll(block.number + turnLength - 1);

    vm.expectRevert("[UpdateSystem] Cannot update yet");
    world.Empires__updateWorld();

    vm.roll(block.number + 1);

    world.Empires__updateWorld();
  }

  function testUpdateNextTurnBlock() public {
    world.Empires__updateWorld();
    assertEq(Turn.getNextTurnBlock(), block.number + turnLength);
  }

  /* ---------------------------------- Gold ---------------------------------- */

  function testAddGoldToEveryPlanet() public {
    world.Empires__updateWorld();
    uint256 goldIncrease = P_GameConfig.getGoldGenRate();

    bytes32[] memory planets = PlanetsSet.getPlanetIds();
    for (uint i = 0; i < planets.length; i++) {
      bytes32 _planetId = planets[i];
      assertEq(Planet.getGoldCount(_planetId), goldIncrease);
    }
  }

  function testAddGoldToPlanetSecondRound() public {
    uint256 goldIncrease = P_GameConfig.getGoldGenRate();

    bytes32[] memory planets = PlanetsSet.getPlanetIds();
    bytes32 planetNotMovingUntilThirdRound;
    EEmpire firstRoundEmpire = EEmpire(((uint256(Turn.getEmpire()) + 1) % 3) + 1);
    EEmpire secondRoundEmpire = EEmpire(((uint256(firstRoundEmpire) + 1) % 3) + 1);

    for (uint i = 0; i < planets.length; i++) {
      EEmpire empire = Planet.getFactionId(planets[i]);
      if (empire != firstRoundEmpire && empire != secondRoundEmpire) {
        planetNotMovingUntilThirdRound = planets[i];
        break;
      }
    }
    world.Empires__updateWorld();
    vm.roll(block.number + turnLength + 1);

    world.Empires__updateWorld();

    assertEq(Planet.getGoldCount(planetNotMovingUntilThirdRound), goldIncrease * 2);
  }
  function testSpendGoldNonEPlayerAction() public {
    uint256 nonEPlayerAction = P_NPCActionThresholds.getNone() - 1;
    Planet.setGoldCount(planetId, 100);
    LibGold._spendGold(planetId, nonEPlayerAction);

    assertEq(Planet.getGoldCount(planetId), 100);
  }

  function testSpendGoldBuyDestroyersAction() public {
    uint256 destroyersAction = P_NPCActionThresholds.getBuyDestroyers() - 1;
    uint256 gold = 9;

    Planet.setGoldCount(planetId, gold);

    uint256 destroyerPrice = 2;
    P_NPCActionCosts.set(ENPCAction.BuyDestroyers, destroyerPrice);

    uint256 expectedDestroyers = gold / destroyerPrice;
    uint256 expectedRemainder = gold % destroyerPrice;

    LibGold._spendGold(planetId, destroyersAction);

    assertEq(Planet.getGoldCount(planetId), expectedRemainder, "gold count wrong");
    assertEq(Planet.getDestroyerCount(planetId), expectedDestroyers, "destroyers wrong");
  }
}
