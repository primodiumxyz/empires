// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { Test } from "forge-std/Test.sol";
import { TestPlus } from "solady/TestPlus.sol";

import { P_GameConfig, Planet, Ready, Turn, TurnData, WinningEmpire } from "codegen/index.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { EEmpire, EOverride } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { RoutineThresholds } from "src/Types.sol";

/// @dev Base handler to be implemented by specific handlers
abstract contract HandlerBase is Test, TestPlus {
  /* -------------------------------------------------------------------------- */
  /*                                   CONFIG                                   */
  /* -------------------------------------------------------------------------- */

  /// @dev Allow calls that are supposed to fail (e.g. sell points when the player doesn't have enough)
  /// When set to true, it will still allow the call, even if it's supposed to not succeed, which helps
  /// for testing unexpected cases
  /// When set to false, it will return before the call is made if the requirements for a successful case are not met
  /// Note: set to false if you want to set `fail_on_revert = true` in `foundry.toml`
  bool constant ALLOW_UNEXPECTED_INPUTS = true;

  /// @dev The number of turns it takes for the game to end (provided that each run has enough depth to reach it)
  /// e.g. 400 turns, 3 blocks per turn, ~10 handler public functions: we need ~12,000 depth to reach the end of the game
  /// and be able to make a decent amount of calls to withdraw (`updateWorld` will advance 1 block per call so 400 * 3 * 10 = 12,000)
  uint256 constant ROUND_TURNS = 400;
  /// @dev The number of blocks for each turn
  uint256 constant TURN_LENGTH_BLOCKS = 3;

  /* -------------------------------------------------------------------------- */
  /*                                   STORAGE                                  */
  /* -------------------------------------------------------------------------- */
  /// @dev World contract
  IWorld internal world;

  /// @dev Deployer and admin of the contract
  address internal immutable CREATOR;

  /// @dev Amount of empires set during initialization
  uint256 internal immutable EMPIRE_COUNT;

  /// @dev Block at which the game ends
  uint256 internal immutable GAME_OVER_BLOCK;

  /// @dev Accounts that interacted with the contract (funded and participated at least once)
  address[] private _players;

  /* -------------------------------------------------------------------------- */
  /*                                  FUNCTIONS                                 */
  /* -------------------------------------------------------------------------- */

  constructor(address _world, address _creator) {
    world = IWorld(_world);
    StoreSwitch.setStoreAddress(_world);
    CREATOR = _creator;
    EMPIRE_COUNT = P_GameConfig.getEmpireCount();
    GAME_OVER_BLOCK = block.number + ROUND_TURNS * TURN_LENGTH_BLOCKS;

    vm.startPrank(_creator);
    P_GameConfig.setTurnLengthBlocks(TURN_LENGTH_BLOCKS);
    P_GameConfig.setGameOverBlock(GAME_OVER_BLOCK);
    Turn.setNextTurnBlock(block.number + TURN_LENGTH_BLOCKS);
    vm.stopPrank();
  }

  /// @dev Advance to the next turn block and update the world
  function updateWorld(uint256) public {
    TurnData memory turn = Turn.get();
    // we don't want it to update everytime the function is called, more like advance block and update if possible
    vm.roll(block.number + 1);
    if (block.number < turn.nextTurnBlock) return;
    if (block.number >= GAME_OVER_BLOCK) return;

    emit log_named_uint("Updating world, turn", turn.value);

    bytes32[] memory empirePlanets = _getEmpirePlanets(turn.empire);
    RoutineThresholds[] memory routineThresholds = new RoutineThresholds[](empirePlanets.length);
    for (uint256 i = 0; i < empirePlanets.length; i++) {
      bytes32 targetPlanet = _selectRandomPlanet(_random());
      do {
        targetPlanet = _selectRandomPlanet(_randomUnique());
      } while (targetPlanet == empirePlanets[i]);

      routineThresholds[i] = RoutineThresholds({
        planetId: empirePlanets[i],
        moveTargetId: targetPlanet,
        accumulateGold: 2000,
        buyShields: 4000,
        buyShips: 6000,
        moveShips: 10000
      });
    }

    vm.prank(CREATOR);
    world.Empires__updateWorld(routineThresholds);
  }

  /* -------------------------------------------------------------------------- */
  /*                                  UTILITIES                                 */
  /* -------------------------------------------------------------------------- */

  /// @dev Return a boolean indicating whether `a` implies `b`
  function implies(bool a, bool b) internal pure returns (bool) {
    return !a || b;
  }

  /// @dev Assert that `a` implies `b`
  function assert_implies(bool a, bool b) internal pure {
    assert(implies(a, b));
  }

  /// @dev Return true if this test should be skipped
  function shouldSkip(bool skipCondition) internal pure returns (bool) {
    return !ALLOW_UNEXPECTED_INPUTS && skipCondition;
  }

  /* -------------------------------------------------------------------------- */
  /*                                   HELPERS                                  */
  /* -------------------------------------------------------------------------- */

  /* --------------------------------- PLAYERS -------------------------------- */
  /// @dev A. Return an existing player; meaning that they have already interacted with the contract (30%)
  /// @dev B. Create a new player and add them to the array
  /// (70%)
  function _selectRandomOrCreatePlayer(uint256 seed) internal returns (address player) {
    bool shouldSelectExistingPlayer = _randomChance(3); // 1/3

    if (shouldSelectExistingPlayer && _players.length > 0) {
      player = _players[seed % _players.length];
    } else {
      player = _randomUniqueAddress();
      _players.push(player);
    }
  }

  /* -------------------------------- OVERRIDES ------------------------------- */
  /// @dev Get a sensible count of overrides to purchase as well as its cost
  function _getSensibleOverrideCount(
    uint256 overrideCountSeed,
    EOverride overrideType,
    EEmpire empireId,
    address player
  ) internal returns (uint256 overrideCount, uint256 overrideCost) {
    overrideCount = _hem(overrideCountSeed, 1, 100);
    overrideCost = LibPrice.getTotalCost(overrideType, empireId, overrideCount);
    vm.deal(player, overrideCost);
  }

  /* --------------------------------- EMPIRES -------------------------------- */
  /// @dev Select a random empire
  /// Note: this can return `EEmpire.NULL`
  function _selectRandomEmpire(uint256) internal returns (EEmpire empire) {
    empire = EEmpire(_randomUnique() % EMPIRE_COUNT);
  }

  /// @dev Select a random empire that exists
  function _selectRandomOwnedEmpire(uint256 seed) internal returns (EEmpire empire) {
    do {
      empire = _selectRandomEmpire(seed);
    } while (empire == EEmpire.NULL);
  }

  /* --------------------------------- PLANETS -------------------------------- */
  /// @dev Select a random planet
  function _selectRandomPlanet(uint256 seed) internal view returns (bytes32 planet) {
    bytes32[] memory planets = PlanetsSet.getPlanetIds();
    planet = planets[seed % planets.length];
  }

  /// @dev Select a random planet owned by an empire
  function _selectRandomOwnedPlanet(uint256) internal returns (bytes32 planet, EEmpire empire) {
    do {
      planet = _selectRandomPlanet(_randomUnique());
      empire = Planet.getEmpireId(planet);
    } while (empire == EEmpire.NULL);
  }

  /// @dev Get all planets owned by an empire
  function _getEmpirePlanets(EEmpire empire) internal view returns (bytes32[] memory) {
    bytes32[] memory allPlanets = PlanetsSet.getPlanetIds();
    bytes32[] memory empirePlanets = new bytes32[](allPlanets.length);

    uint256 count = 0;
    for (uint256 i = 0; i < allPlanets.length; i++) {
      if (Planet.getEmpireId(allPlanets[i]) == empire) {
        empirePlanets[count] = allPlanets[i];
        count++;
      }
    }

    assembly {
      mstore(empirePlanets, count)
    }

    return empirePlanets;
  }

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */

  /// @dev Return the list of players that interacted with the contract
  function players() external view returns (address[] memory) {
    return _players;
  }
}
