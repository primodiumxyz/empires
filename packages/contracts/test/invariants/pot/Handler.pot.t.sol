// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { HandlerBase } from "test/invariants/Handler.Base.t.sol";

import { Balances } from "@latticexyz/world/src/codegen/index.sol";
import { EEmpire, EOverride } from "codegen/common.sol";
import { EMPIRES_NAMESPACE_ID } from "src/constants.sol";

contract HandlerPot is HandlerBase {
  /* -------------------------------------------------------------------------- */
  /*                                   STORAGE                                  */
  /* -------------------------------------------------------------------------- */

  uint256 private _mirrorPot;

  /* -------------------------------------------------------------------------- */
  /*                                  FUNCTIONS                                 */
  /* -------------------------------------------------------------------------- */

  constructor(address _world, address _creator) HandlerBase(_world, _creator) {}

  // function airdropGold(uint256 playerSeed, uint256 planetSeed, uint256 overrideCountSeed) public {
  //   address player = _selectRandomOrCreatePlayer(playerSeed);
  //   (bytes32 planet, EEmpire empire) = _selectRandomOwnedPlanet(planetSeed);
  //   (uint256 overrideCount, uint256 overrideCost) = _getSensibleOverrideCount(
  //     overrideCountSeed,
  //     EOverride.CreateShip,
  //     empire,
  //     player
  //   );

  //   vm.prank(player);
  //   world.Empires__airdropGold(empire, overrideCount);

  //   _mirrorPot += overrideCost;
  // }

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */

  function getPot() external view returns (uint256) {
    return Balances.get(EMPIRES_NAMESPACE_ID);
  }

  function getMirrorPot() external view returns (uint256) {
    return _mirrorPot;
  }
}
