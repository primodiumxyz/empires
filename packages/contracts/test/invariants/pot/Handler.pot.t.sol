// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { HandlerBase } from "test/invariants/Handler.Base.t.sol";

import { Balances } from "@latticexyz/world/src/codegen/index.sol";
import { P_PointConfig } from "codegen/index.sol";
import { EEmpire, EOverride } from "codegen/common.sol";
import { ADMIN_NAMESPACE_ID, EMPIRES_NAMESPACE_ID } from "src/constants.sol";

import { LibPrice } from "libraries/LibPrice.sol";

contract HandlerPot is HandlerBase {
  /* -------------------------------------------------------------------------- */
  /*                                   STORAGE                                  */
  /* -------------------------------------------------------------------------- */

  /// @dev The expected pot (mirrored from each override purchase or sale)
  uint256 private _mirrorPot;
  /// @dev The rake taken from each override
  uint256 private _mirrorRake;


  /* -------------------------------------------------------------------------- */
  /*                                  FUNCTIONS                                 */
  /* -------------------------------------------------------------------------- */

  constructor(address _world, address _creator) HandlerBase(_world, _creator) {}

  /// @dev Airdrop gold to a random empire for points
  /// Note: see `OverrideAirdropSystem`
  /// - This function should increase the pot by the cost of the override purchase
  function airdropGold(uint256 playerSeed, uint256 empireSeed, uint256 overrideCountSeed) public payable _assumeNotGameOver {
    // Prepare "random" but credible inputs
    // address player = _selectRandomOrCreatePlayer(playerSeed);
    // EEmpire empire = _selectRandomEmpire(empireSeed);
    // (uint256 overrideCount, uint256 overrideCost) = _getSensibleOverrideCount(
    //   overrideCountSeed,
    //   EOverride.AirdropGold,
    //   empire,
    //   player
    // );

    // Purchase override
    // world.Empires__airdropGold{value: overrideCost}(empire, overrideCount);

    // Mirror (expected) pot and rake
    // _increaseMirrors(overrideCost);

    uint256 cost = LibPrice.getTotalCost(EOverride.AirdropGold, EEmpire.Red, 1);
    vm.deal(msg.sender, cost);
    vm.prank(msg.sender);
    world.Empires__airdropGold{ value: cost }(EEmpire.Red, 1);

    _increaseMirrors(cost);
  }

  /* -------------------------------------------------------------------------- */
  /*                                   HELPERS                                  */
  /* -------------------------------------------------------------------------- */

  /// @dev Increase the expected pot and rake
  function _increaseMirrors(uint256 cost) internal {
    uint256 rake = (cost * P_PointConfig.getPointRake()) / 10_000;
    _mirrorPot += cost - rake;
    _mirrorRake += rake;
  }

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */

  /// @dev Get the actual pot (balance of the contract)
  function getPot() external view returns (uint256) {
    return Balances.get(EMPIRES_NAMESPACE_ID);
  }

  /// @dev Get the expected pot
  function getExpectedPot() external view returns (uint256) {
    return _mirrorPot;
  }

  /// @dev Get the actual rake
  function getRake() external view returns (uint256) {
    return Balances.get(ADMIN_NAMESPACE_ID);
  }

  /// @dev Get the expected rake
  function getExpectedRake() external view returns (uint256) {
    return _mirrorRake;
  }
}
