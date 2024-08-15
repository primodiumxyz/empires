// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { LibMoveShips } from "libraries/LibMoveShips.sol";
import { LibRoutine } from "libraries/LibRoutine.sol";
import { Planet, P_GameConfig } from "codegen/index.sol";
import { RoutineThresholds } from "src/Types.sol";

contract UpdateEmpiresSubsystem is EmpiresSystem {
  function updateEmpires(RoutineThresholds[] memory routineThresholds) public {
    // spend gold and move ships for each empire planet
    for (uint i = 0; i < routineThresholds.length; i++) {
      LibMoveShips.executePendingMoves(routineThresholds[i].planetId);
      LibRoutine.executeRoutine(routineThresholds[i].planetId, routineThresholds[i]);
      Planet.setGoldCount(
        routineThresholds[i].planetId,
        Planet.getGoldCount(routineThresholds[i].planetId) +
          P_GameConfig.getGoldGenRate() *
          P_GameConfig.getEmpireCount()
      );
    }
  }
}
