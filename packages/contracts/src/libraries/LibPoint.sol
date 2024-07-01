// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Faction, Player } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";
import { EMPIRE_COUNT } from "src/constants.sol";

library LibPoint {
  function issuePoints(EEmpire empire, bytes32 playerId, uint256 points) internal {
    require(empire != EEmpire.NULL, "[LibPoint] Invalid empire");
    Faction.setPointsIssued(empire, Faction.getPointsIssued(empire) + points);
    uint256[] memory playerPoints = getPlayerPoints(playerId);
    
    playerPoints[uint256(empire)] = playerPoints[uint256(empire)] + points;

    Player.setPoints(playerId, playerPoints);
  }

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