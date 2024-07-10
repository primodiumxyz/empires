// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Faction, Player } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";
import { PointsMap } from "adts/PointsMap.sol";

/**
 * @title LibPoint
 * @dev A library for managing points issuance and removal in the Primodium Empires game.
 */
library LibPoint {
  /**
   * @dev Issues points to a player for a specific empire. Does not manage prices.
   * @param _empire The empire to issue points for.
   * @param _playerId The ID of the player.
   * @param _points The number of points to issue.
   */
  function issuePoints(EEmpire _empire, bytes32 _playerId, uint256 _points) internal {
    require(_empire != EEmpire.NULL && _empire != EEmpire.LENGTH, "[LibPoint] Invalid empire");
    PointsMap.set(_empire, _playerId, PointsMap.get(_empire, _playerId) + _points);
  }

  /**
   * @dev Removes points from a player for a specific empire. Does not manage prices.
   * @param _empire The empire to remove points from.
   * @param _playerId The ID of the player.
   * @param _points The number of points to remove.
   */
  function removePoints(EEmpire _empire, bytes32 _playerId, uint256 _points) internal {
    require(_points <= PointsMap.get(_empire, _playerId), "[LibPoint] Player does not have enough points to remove");
    // Requires ordered in reverse of issuePoints() for clearer error message paths
    require(_points <= Faction.getPointsIssued(_empire), "[LibPoint] Empire has not issued enough points to remove");
    PointsMap.set(_empire, _playerId, PointsMap.get(_empire, _playerId) - _points);
  }
}
