// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { Test } from "forge-std/Test.sol";
import { TestPlus } from "solady/TestPlus.sol";

import { P_GameConfig, Planet, Turn, TurnData } from "codegen/index.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { EEmpire, EOverride } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { RoutineThresholds } from "src/Types.sol";

/// @dev Base handler to be implemented by specific handlers
abstract contract HandlerBase is Test, TestPlus {
  /* -------------------------------------------------------------------------- */
  /*                                   STORAGE                                  */
  /* -------------------------------------------------------------------------- */
  /// @dev World contract
  IWorld public world;

  /// @dev Creator and admin of the contract
  address public creator;

  /// @dev players that interacted with the contract
  address[] internal _players;

  /* -------------------------------------------------------------------------- */
  /*                                  FUNCTIONS                                 */
  /* -------------------------------------------------------------------------- */

  constructor(address _world, address _creator) {
    world = IWorld(_world);
    creator = _creator;
    StoreSwitch.setStoreAddress(_world);

    vm.startPrank(creator);
    P_GameConfig.setTurnLengthBlocks(10);
    P_GameConfig.setGameOverBlock(block.number + 100_000);
    vm.stopPrank();
  }

  function updateWorld(uint256) public {
    TurnData memory turn = Turn.get();
    // we don't want it to update everytime the function is called, more like advance block and update if possible
    vm.roll(block.number + 1);
    if (block.number < turn.nextTurnBlock) {
      return;
    }

    // bytes32[] memory empirePlanets = _getEmpirePlanets(turn.empire);
    // RoutineThresholds[] memory routineThresholds = new RoutineThresholds[](empirePlanets.length);
    // for (uint256 i = 0; i < empirePlanets.length; i++) {
    //   bytes32 targetPlanet = _selectRandomPlanet(_random());
    //   do {
    //     targetPlanet = _selectRandomPlanet(_random());
    //   } while (targetPlanet == empirePlanets[i]);

    //   routineThresholds[i] = RoutineThresholds({
    //     planetId: empirePlanets[i],
    //     moveTargetId: targetPlanet,
    //     accumulateGold: 2000,
    //     buyShields: 4000,
    //     buyShips: 6000,
    //     moveShips: 10000
    //   });
    // }

    vm.prank(creator);
    // world.Empires__updateWorld(routineThresholds);
    world.Empires__updateWorld(new RoutineThresholds[](0));
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

  /* -------------------------------------------------------------------------- */
  /*                                   HELPERS                                  */
  /* -------------------------------------------------------------------------- */

  /* --------------------------------- PLAYERS -------------------------------- */
  /// @dev A. Return an existing player; meaning that they have already interacted with the contract (30%)
  /// @dev B. Create a new player, deal some ETH and add them to the array
  /// (70%)
  function _selectRandomOrCreatePlayer(uint256 seed) internal virtual returns (address player) {
    bool shouldSelectExistingPlayer = _randomChance(3); // 1/3

    if (shouldSelectExistingPlayer && _players.length > 0) {
      player = _players[seed % _players.length];
    } else {
      player = _randomUniqueAddress();

      // Add the player to the list and fund them
      _players.push(player);
      uint256 amount = _hem(seed, 1, uint256(type(uint96).max));
      vm.deal(player, amount);
    }
  }

  /* -------------------------------- OVERRIDES ------------------------------- */
  /// @dev Get a sensible count of overrides to purchase as well as its cost
  function _getSensibleOverrideCount(
    uint256 overrideCountSeed,
    EOverride overrideType,
    EEmpire empireId,
    address player
  ) internal view returns (uint256 overrideCount, uint256 overrideCost) {
    overrideCost = type(uint256).max;
    do {
      overrideCount = _hem(overrideCountSeed, 1, 100);
      overrideCost = LibPrice.getTotalCost(overrideType, empireId, overrideCount);
    } while (overrideCost > player.balance);
  }

  /* --------------------------------- PLANETS -------------------------------- */
  /// @dev Select a random planet
  function _selectRandomPlanet(uint256 seed) internal returns (bytes32 planet) {
    bytes32[] memory planets = PlanetsSet.getPlanetIds();
    planet = planets[seed % planets.length];
  }

  /// @dev Select a random planet owned by an empire
  function _selectRandomOwnedPlanet(uint256 seed) internal returns (bytes32 planet, EEmpire empire) {
    do {
      planet = _selectRandomPlanet(seed);
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
