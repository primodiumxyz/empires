// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Turn, Empire, P_MagnetConfig, Magnet, MagnetData, MagnetTurnPlanets, P_GameConfig } from "codegen/index.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { EEmpire } from "codegen/common.sol";

/**
 * @title LibMagnet
 * @dev A library for managing magnets in the Primodium Empires game.
 */
library LibMagnet {
  function removeMagnet(EEmpire _empire, bytes32 _planetId) internal {
    MagnetData memory magnetData = Magnet.get(_empire, _planetId);
    if (!magnetData.isMagnet) return;
    bytes32 playerId = magnetData.playerId;
    uint256 lockedPoints = magnetData.lockedPoints;

    // Remove magnet from planet
    Magnet.deleteRecord(_empire, _planetId);

    // Remove locked points from player
    PointsMap.setLockedPoints(_empire, playerId, PointsMap.getLockedPoints(_empire, playerId) - lockedPoints);
  }

  function addMagnet(EEmpire _empire, bytes32 _planetId, bytes32 _playerId, uint256 _fullTurnDuration) internal {
    uint256 requiredPoints = (P_MagnetConfig.getLockedPointsPercent() * Empire.getPointsIssued(_empire)) / 10000;
    uint256 currLockedPoints = PointsMap.getLockedPoints(_empire, _playerId);
    require(
      requiredPoints <= PointsMap.getValue(_empire, _playerId) - currLockedPoints,
      "[OverrideSystem] Player does not have enough points to place magnet"
    );

    uint256 currTurn = Turn.getValue();
    uint256 endTurn = currTurn + (_fullTurnDuration * P_GameConfig.getEmpireCount());

    PointsMap.setLockedPoints(_empire, _playerId, currLockedPoints + requiredPoints);

    Magnet.set(
      _empire,
      _planetId,
      MagnetData({ isMagnet: true, lockedPoints: requiredPoints, playerId: _playerId, endTurn: endTurn })
    );
    MagnetTurnPlanets.push(_empire, endTurn, _planetId);
  }
}
