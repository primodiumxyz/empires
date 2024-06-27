// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Faction, Player } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";

library LibPoint {
  function issuePoints(EEmpire empire, bytes32 playerId, uint256 points) external {
    require(empire != EEmpire.NULL, "LibPoint: Invalid empire");
    Faction.setPointsIssued(empire, Faction.getPointsIssued(empire) + points);
    uint256[] memory playerPoints = Player.getPoints(playerId);
    playerPoints[uint256(empire)] += points;
    Player.setPoints(playerId, playerPoints);
  }
}