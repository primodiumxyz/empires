// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Empire, P_PointConfig, P_GameConfig } from "codegen/index.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { EEmpire } from "codegen/common.sol";

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
    uint8 empireCount = P_GameConfig.getEmpireCount();
    require(_empire != EEmpire.NULL && uint8(_empire) <= empireCount, "[LibPoint] Invalid empire");
    if (Empire.getIsDefeated(_empire)) {
      return;
    }
    uint256 currentPoints = PointsMap.getValue(_empire, _playerId);
    uint256 newPoints = currentPoints + _points;
    PointsMap.setValue(_empire, _playerId, newPoints);
  }

  /**
   * @dev Removes points from a player for a specific empire. Does not manage prices.
   * @param _empire The empire to remove points from.
   * @param _playerId The ID of the player.
   * @param _points The number of points to remove.
   */
  function removePoints(EEmpire _empire, bytes32 _playerId, uint256 _points) internal {
    uint256 currentPoints = PointsMap.getValue(_empire, _playerId);
    require(
      _points <= currentPoints - PointsMap.getLockedPoints(_empire, _playerId),
      "[LibPoint] Player does not have enough unlocked points to remove"
    );
    require(_points <= Empire.getPointsIssued(_empire), "[LibPoint] Empire has not issued enough points to remove"); // This should never happen
    PointsMap.setValue(_empire, _playerId, currentPoints - _points);
  }
}
