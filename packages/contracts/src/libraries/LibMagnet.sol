// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Turn, Empire, P_MagnetConfig, Magnet, MagnetData, MagnetTurnPlanets, P_GameConfig } from "codegen/index.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { console } from "forge-std/console.sol";

/**
 * @title LibMagnet
 * @dev A library for managing magnets in the Primodium Empires game.
 */
library LibMagnet {
  function removeMagnet(uint8 _empire, bytes32 _planetId) internal {
    // todo: remove magnet from planet. remove locked points from player.
    MagnetData memory magnetData = Magnet.get(_empire, _planetId);
    if (!magnetData.isMagnet) return;

    // Remove magnet from planet
    Magnet.deleteRecord(_empire, _planetId);

    // Remove locked points from player
    bytes32 playerId = magnetData.playerId;
    uint256 lockedPoints = magnetData.lockedPoints;
    PointsMap.setLockedPoints(_empire, playerId, PointsMap.getLockedPoints(_empire, playerId) - lockedPoints);
  }

  function addMagnet(uint8 _empire, bytes32 _planetId, bytes32 _playerId, uint256 _fullTurnDuration) internal {
    uint256 requiredPoints = (P_MagnetConfig.getLockedPointsPercent() * Empire.getPointsIssued(_empire)) / 10000;
    require(
      requiredPoints <= PointsMap.getValue(_empire, _playerId) - PointsMap.getLockedPoints(_empire, _playerId),
      "[OverrideSystem] Player does not have enough points to place magnet"
    );

    uint256 currTurn = Turn.getValue();
    uint256 endTurn = currTurn + (_fullTurnDuration * P_GameConfig.getEmpireCount());

    Magnet.set(
      _empire,
      _planetId,
      MagnetData({ isMagnet: true, lockedPoints: requiredPoints, playerId: _playerId, endTurn: endTurn })
    );
    PointsMap.setLockedPoints(_empire, _playerId, PointsMap.getLockedPoints(_empire, _playerId) + requiredPoints);
    MagnetTurnPlanets.push(_empire, endTurn, _planetId);
  }
}
