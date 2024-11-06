// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Balances } from "@latticexyz/world/src/codegen/index.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";

import { P_GameConfig, WinningEmpire, Empire } from "codegen/index.sol";
import { IWorld } from "codegen/world/IWorld.sol";

import { EmpiresSystem } from "systems/EmpiresSystem.sol";

import { PointsMap } from "adts/PointsMap.sol";
import { PlayersMap } from "adts/PlayersMap.sol";

import { EMPIRES_NAMESPACE_ID } from "src/constants.sol";
import { addressToId } from "src/utils.sol";
import { EEmpire } from "codegen/common.sol";

/**
 * @title RewardsSystem
 * @dev A contract that manages the rewards system for the Empires game.
 */
contract RewardsSystem is EmpiresSystem {
  /**
   * @dev Allows a player to withdraw their earnings.
   * This function can only be called when the game is over.
   */
  function withdrawEarnings() public _onlyGameOver {
    EEmpire winningEmpire = WinningEmpire.get();
    require(winningEmpire != EEmpire.NULL, "[RewardsSystem] No empire has won the game");

    bytes32 playerId = addressToId(_msgSender());

    uint256 empirePoints = Empire.getPointsIssued(winningEmpire);
    if (empirePoints == 0) {
      return;
    }

    uint256 playerEmpirePoints = PointsMap.getValue(winningEmpire, playerId) -
      PointsMap.getLockedPoints(winningEmpire, playerId);

    if (playerEmpirePoints == 0) return;

    uint256 pot = (Balances.get(EMPIRES_NAMESPACE_ID));
    uint256 playerPot = (pot * playerEmpirePoints) / empirePoints;

    PlayersMap.setGain(playerId, PlayersMap.get(playerId).gain + playerPot);
    PointsMap.remove(winningEmpire, playerId);

    IWorld(_world()).transferBalanceToAddress(EMPIRES_NAMESPACE_ID, _msgSender(), playerPot);
  }
}
