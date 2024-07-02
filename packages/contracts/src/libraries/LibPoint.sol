// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Faction, Player, Points } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";

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
    require(empire != EEmpire.NULL && empire != EEmpire.LENGTH, "[LibPoint] Invalid empire");
    Faction.setPointsIssued(empire, Faction.getPointsIssued(empire) + points);
    Points.set(playerId, empire, Points.get(playerId, empire) + points);
  }

  /**
   * @dev Removes points from a player for a specific empire. Does not manage prices.
   * @param empire The empire to remove points from.
   * @param playerId The ID of the player.
   * @param points The number of points to remove.
   */
  function removePoints(EEmpire empire, bytes32 playerId, uint256 points) internal {
    require(empire != EEmpire.NULL && empire != EEmpire.LENGTH, "[LibPoint] Invalid empire");
    require(points <= Points.get(playerId, empire), "[LibPoint] Player does not have enough points to remove");
    // Requires ordered in reverse of issuePoints() for clearer error message paths
    require(points <= Faction.getPointsIssued(empire), "[LibPoint] Empire has not issued enough points to remove");
    Points.set(playerId, empire, Points.get(playerId, empire) - points);
    Faction.setPointsIssued(empire, Faction.getPointsIssued(empire) - points);
  }
}