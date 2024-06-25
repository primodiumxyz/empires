// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Faction, FactionData, Planet, PlanetData, P_MoveConfig, P_MoveConfigData } from "codegen/index.sol";
import { EEmpire, EMovement } from "codegen/common.sol";
import { pseudorandom } from "src/utils.sol";

library LibUpdateWorld {
  function moveDestroyers(bytes32 planetId) internal {
    PlanetData memory planetData = Planet.get(planetId);
    if (planetData.factionId == EEmpire.NULL || planetData.destroyerCount == 0) return;

    // move destroyers
    EMovement movement;
  }

  function resolveBattle(bytes32 planetId) internal {
    moveDestroyers(planetId);
  }

  function getMovementDirection(bytes32 planetId) internal {
    uint256 randomValue = pseudorandom(uint256(planetId), 10_000);
    PlanetData memory planetData = Planet.get(planetId);
    FactionData memory faction = Faction.get(planetData.factionId);
  }

  function _getMovementDirection(uint256 value) private view returns (EMovement) {
    P_MoveConfigData memory moveConfig = P_MoveConfig.get();
    if (value < moveConfig.none) {
      return EMovement.None;
    } else if (value < moveConfig.away) {
      return EMovement.Away;
    } else if (value < moveConfig.lateral) {
      return EMovement.Lateral;
    } else if (value < moveConfig.toward) {
      return EMovement.Toward;
    } else {
      return EMovement.None;
    }
  }
}
