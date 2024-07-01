// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Faction, Player } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";
import { EMPIRE_COUNT } from "src/constants.sol";

/**
 * @title LibPoint
 * @dev A library for managing points issuance and removal in the Primodium Empires game.
 */
library LibPoint {
  /**
   * @dev Issues points to a player for a specific empire. Does not manage prices.
   * @param empire The empire to issue points for.
   * @param playerId The ID of the player.
   * @param points The number of points to issue.
   */
  function issuePoints(EEmpire empire, bytes32 playerId, uint256 points) internal {
    require(empire != EEmpire.NULL, "[LibPoint] Invalid empire");
    Faction.setPointsIssued(empire, Faction.getPointsIssued(empire) + points);
    uint256[] memory playerPoints = getPlayerPoints(playerId);
    
    playerPoints[uint256(empire)] = playerPoints[uint256(empire)] + points;

    Player.setPoints(playerId, playerPoints);
  }

  /**
   * @dev Removes points from a player for a specific empire. Does not manage prices.
   * @param empire The empire to remove points from.
   * @param playerId The ID of the player.
   * @param points The number of points to remove.
   */
  function removePoints(EEmpire empire, bytes32 playerId, uint256 points) internal {
    require(empire != EEmpire.NULL, "[LibPoint] Invalid empire");
    uint256[] memory playerPoints = getPlayerPoints(playerId);

    require(playerPoints[uint256(empire)] >= points, "[LibPoint] Player does not have enough points to remove");
    playerPoints[uint256(empire)] = playerPoints[uint256(empire)] - points;

    Player.setPoints(playerId, playerPoints);

    // Ordered in reverse of issuePoints() for clearer error message paths
    require(points <= Faction.getPointsIssued(empire), "[LibPoint] Empire has not issued enough points to remove");
    Faction.setPointsIssued(empire, Faction.getPointsIssued(empire) - points);
  }

  /**
   * @dev A utility for retrieving the points of a player for all empires.
   * @param playerId The ID of the player.
   * @return playerPoints An array of uint256 values representing the points of the player for each empire.
   */
  function getPlayerPoints(bytes32 playerId) internal view returns (uint256[] memory) {
    uint256[] memory playerPoints = Player.getPoints(playerId);

    if (playerPoints.length <= EMPIRE_COUNT) {
      uint256[] memory tempPoints = new uint256[](EMPIRE_COUNT + 1);
      for (uint i = 0; i < playerPoints.length; i++) {
          tempPoints[i] = playerPoints[i];
      }
      playerPoints = tempPoints;
    }

    return playerPoints;
  }
}