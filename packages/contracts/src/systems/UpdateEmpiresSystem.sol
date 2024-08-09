// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { LibMoveShips } from "libraries/LibMoveShips.sol";
import { LibRoutine } from "libraries/LibRoutine.sol";
import { Planet, P_GameConfig } from "codegen/index.sol";
import { RoutineThresholds } from "../Types.sol";
import { EMPIRE_COUNT } from "src/constants.sol";

contract UpdateEmpiresSystem is System {
  function updateEmpires(RoutineThresholds[] memory routineThresholds) public {
    // spend gold and move ships for each empire planet
    for (uint i = 0; i < routineThresholds.length; i++) {
      LibMoveShips.executePendingMoves(routineThresholds[i].planetId);
      LibRoutine.executeRoutine(routineThresholds[i].planetId, routineThresholds[i]);
      Planet.setGoldCount(
        routineThresholds[i].planetId,
        Planet.getGoldCount(routineThresholds[i].planetId) + P_GameConfig.getGoldGenRate() * EMPIRE_COUNT
      );
    }
  }
}
