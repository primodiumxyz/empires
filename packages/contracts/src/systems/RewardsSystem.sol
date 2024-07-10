// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console } from "forge-std/console.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { Balances } from "@latticexyz/world/src/codegen/index.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";

import { P_PointConfig, P_GameConfig, WinningEmpire, Player, RakeTaken, Faction } from "codegen/index.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { EEmpire } from "codegen/common.sol";

import { EmpiresSystem } from "systems/EmpiresSystem.sol";

import { PointsMap } from "adts/PointsMap.sol";

import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";
import { addressToId } from "src/utils.sol";

/**
 * @title RewardsSystem
 * @dev A contract that manages the rewards system for the Empires game.
 */
contract RewardsSystem is EmpiresSystem {
  /**
   * @dev Modifier that restricts the execution of a function to when the game is over.
   */
  modifier _onlyGameOver() {
    uint256 endBlock = P_GameConfig.getGameOverBlock();
    require(endBlock > 0 && block.number > endBlock, "[RewardsSystem] Game is not over");
    _;
  }

  /**
   * @dev Internal function to take the rake from the rewards system.
   * This function is private and can only be called within the contract.
   */
  function _takeRake() private {
    if (RakeTaken.get()) return;

    uint256 pot = Balances.get(EMPIRES_NAMESPACE_ID);
    uint256 rake = (pot * P_PointConfig.getPointRake()) / 10_000;

    IWorld(_world()).transferBalanceToNamespace(EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID, rake);
    RakeTaken.set(true);
  }

  /**
   * @dev Allows an EEmpire to claim victory.
   * @param empire The EEmpire that wants to claim victory.
   * @notice This function can only be called when the game is over.
   */
  function claimVictory(EEmpire empire) public _onlyGameOver {
    require(WinningEmpire.get() == EEmpire.NULL, "[RewardsSystem] Victory has already been claimed");
    // todo: victory condition

    WinningEmpire.set(empire);
  }

  /**
   * @dev Allows a player to withdraw their earnings.
   * This function can only be called when the game is over.
   */
  function withdrawEarnings() public _onlyGameOver {
    EEmpire empire = WinningEmpire.get();
    require(empire != EEmpire.NULL, "[RewardsSystem] No empire has won the game");

    bytes32 playerId = addressToId(_msgSender());

    uint256 factionPoints = Faction.getPointsIssued(empire);
    if (factionPoints == 0) {
      return;
    }

    _takeRake();

    uint256 playerFactionPoints = PointsMap.get(empire, playerId);
    if (playerFactionPoints == 0) return;

    uint256 pot = (Balances.get(EMPIRES_NAMESPACE_ID));
    uint256 playerPot = (pot * playerFactionPoints) / factionPoints;

    IWorld(_world()).transferBalanceToAddress(EMPIRES_NAMESPACE_ID, _msgSender(), playerPot);

    PointsMap.remove(empire, playerId);
  }
}
