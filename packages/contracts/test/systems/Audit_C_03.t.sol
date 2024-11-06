// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { P_GameConfig, Planet, Turn, Magnet, MagnetData, TurnData, MagnetTurnPlanets } from "codegen/index.sol";
import { EEmpire, EOverride } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { RoutineThresholds } from "src/Types.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { CitadelPlanetsSet } from "adts/CitadelPlanetsSet.sol";

contract AuditTest is PrimodiumTest {
  uint256 constant ROUND_TURNS = 500;
  uint256 constant TURN_LENGTH_BLOCKS = 3;
  uint256 internal EMPIRE_COUNT;
  uint256 internal GAME_OVER_BLOCK;
  bytes32 internal planetId;

  function setUp() public override {
    super.setUp();

    EMPIRE_COUNT = P_GameConfig.getEmpireCount();
    GAME_OVER_BLOCK = block.number + ROUND_TURNS * TURN_LENGTH_BLOCKS;
    planetId = _getFirstPlanet(EEmpire(1));

    vm.startPrank(creator);
    P_GameConfig.setTurnLengthBlocks(TURN_LENGTH_BLOCKS);
    P_GameConfig.setGameOverBlock(GAME_OVER_BLOCK);
    Turn.setNextTurnBlock(block.number + TURN_LENGTH_BLOCKS);
    vm.stopPrank();
  }

  function test_magnetTurnPlanetsNotCleared() public {
    // EEmpire.RED conquers all citadels
    createShips(95);
    skipTurns(EMPIRE_COUNT);
    for (uint256 i = 0; i < EMPIRE_COUNT; i++) {
      vm.roll(block.number + TURN_LENGTH_BLOCKS);
      createPendingMove();
      skipTurns(2 * EMPIRE_COUNT - 1);
      createShips(95);
    }

    // Alice places a magnet that is meant to be removed after 1 full turn
    placeMagnet(1, alice);
    uint256 aliceMagnetDeletionTurn = Turn.getValue() + 1 * EMPIRE_COUNT;
    bytes32[] memory magnetEmpireTurnPlanets = MagnetTurnPlanets.get(EEmpire(1), aliceMagnetDeletionTurn);
    assert(magnetEmpireTurnPlanets.length == 1);

    // Game ends by domination
    vm.prank(alice);
    world.Empires__withdrawEarnings();

    // Game is reset, but MagnetTurnPlanets is not cleared
    world.Empires__resetGame();
    magnetEmpireTurnPlanets = MagnetTurnPlanets.get(EEmpire(1), aliceMagnetDeletionTurn);
    assert(magnetEmpireTurnPlanets.length == 1);

    // Game advances until aliceMagnetDeletionTurn - 1
    skipTurns(aliceMagnetDeletionTurn - 2);

    // Bob places a magnet for 10 full turns (10 * EMPIRE_COUNT)
    placeMagnet(10, bob);
    MagnetData memory magnetData = Magnet.get(EEmpire(1), planetId);
    uint256 bobMagnetDeletionTurn = Turn.getValue() + 10 * EMPIRE_COUNT;
    assert(magnetData.endTurn == bobMagnetDeletionTurn);

    // One turn passes, reaching aliceMagnetDeletionTurn, and the magnet Bob placed for 10 turns is removed
    skipTurns(1);
    magnetData = Magnet.get(EEmpire(1), planetId);
    assert(!magnetData.isMagnet);

    // The data for Bob's magnet deletion is still present, so if Charlie places a magnet,
    // the same issue will occur, and so on
    magnetEmpireTurnPlanets = MagnetTurnPlanets.get(EEmpire(1), bobMagnetDeletionTurn);
    assert(magnetEmpireTurnPlanets.length == 1);
  }

  function test_magnetTurnPlanetsNotCleared_fixed() public {
    // EEmpire.RED conquers all citadels
    createShips(95);
    skipTurns(EMPIRE_COUNT);
    for (uint256 i = 0; i < EMPIRE_COUNT; i++) {
      vm.roll(block.number + TURN_LENGTH_BLOCKS);
      createPendingMove();
      skipTurns(2 * EMPIRE_COUNT - 1);
      createShips(95);
    }

    // Alice places a magnet that is meant to be removed after 1 full turn
    placeMagnet(1, alice);
    uint256 aliceMagnetDeletionTurn = Turn.getValue() + 1 * EMPIRE_COUNT;
    bytes32[] memory magnetEmpireTurnPlanets = MagnetTurnPlanets.get(EEmpire(1), aliceMagnetDeletionTurn);
    assert(magnetEmpireTurnPlanets.length == 1);

    // Game ends by domination
    vm.prank(alice);
    world.Empires__withdrawEarnings();

    // Game is reset, but MagnetTurnPlanets is not cleared
    world.Empires__resetGame();
    magnetEmpireTurnPlanets = MagnetTurnPlanets.get(EEmpire(1), aliceMagnetDeletionTurn);
    assert(magnetEmpireTurnPlanets.length == 0);
  }

  function skipTurns(uint256 turns) public {
    for (uint256 i = 0; i < turns; i++) {
      vm.roll(block.number + TURN_LENGTH_BLOCKS);
      if (block.number < GAME_OVER_BLOCK) {
        executePendingMove();
      }
    }
  }

  function createShips(uint256 numShips) public {
    uint256 cost = LibPrice.getTotalCost(EOverride.CreateShip, EEmpire(1), numShips);
    vm.prank(alice);
    world.Empires__createShip{ value: cost }(planetId, EEmpire(1), numShips);
  }

  function placeMagnet(uint256 fullTurnDuration, address player) public {
    uint256 cost = LibPrice.getTotalCost(EOverride.PlaceMagnet, EEmpire(1), fullTurnDuration);
    vm.prank(player);
    world.Empires__placeMagnet{ value: cost }(EEmpire(1), planetId, fullTurnDuration);
  }

  function createPendingMove() public {
    RoutineThresholds[] memory routineThresholds = new RoutineThresholds[](1);
    routineThresholds[0] = RoutineThresholds({
      planetId: planetId,
      moveTargetId: _getNotOwnedCitadel(Turn.get().empire),
      accumulateGold: 0,
      buyShields: 0,
      buyShips: 0,
      moveShips: 10000
    });

    vm.prank(creator);
    world.Empires__updateWorld(routineThresholds);
  }

  function executePendingMove() public {
    RoutineThresholds[] memory routineThresholds = new RoutineThresholds[](1);
    routineThresholds[0] = RoutineThresholds({
      planetId: planetId,
      moveTargetId: bytes32(0),
      accumulateGold: 10000,
      buyShields: 0,
      buyShips: 0,
      moveShips: 0
    });

    vm.prank(creator);
    world.Empires__updateWorld(routineThresholds);
  }

  function _getNotOwnedCitadel(EEmpire empire) public view returns (bytes32 planetId_) {
    bytes32[] memory citadelPlanets = CitadelPlanetsSet.getCitadelPlanetIds();
    for (uint256 i = 0; i < citadelPlanets.length; i++) {
      if (empire != Planet.getEmpireId(citadelPlanets[i])) {
        return citadelPlanets[i];
      }
    }
  }

  function _getFirstPlanet(EEmpire empire) internal view returns (bytes32 planetId_) {
    bytes32[] memory allPlanets = PlanetsSet.getPlanetIds();
    for (uint256 i = 0; i < allPlanets.length; i++) {
      if (Planet.getEmpireId(allPlanets[i]) == empire) {
        return allPlanets[i];
      }
    }
  }
}
