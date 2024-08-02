// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { LibMoveShips } from "libraries/LibMoveShips.sol";
import { LibResolveCombat } from "libraries/LibResolveCombat.sol";
import { LibRoutine } from "libraries/LibRoutine.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibMagnet } from "libraries/LibMagnet.sol";
import { Planet, Turn, TurnData, P_GameConfig, MagnetTurnPlanets } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";
import { EEmpire } from "codegen/common.sol";
import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { RoutineThresholds } from "../Types.sol";
import { EMPIRE_COUNT } from "src/constants.sol";

contract UpdateSystem is EmpiresSystem {
  /**
   * @dev Updates the current turn and returns the empire whose turn just ended.
   * @return The empire whose turn just ended.
   */
  function _updateTurn() private returns (EEmpire) {
    TurnData memory turn = Turn.get();

    bool canUpdate = block.number >= turn.nextTurnBlock;
    if (!canUpdate) revert("[UpdateSystem] Cannot update yet");
    uint256 newNextTurnBlock = block.number + P_GameConfig.getTurnLengthBlocks();
    EEmpire newEmpire = EEmpire(((uint256(turn.empire) % 3) + 1));
    Turn.set(newNextTurnBlock, newEmpire, turn.value + 1);
    return turn.empire;
  }

  /**
   * @dev Updates the game world state, including gold generation, ship movements, combat resolution.
   * @param routineThresholds An array of RoutineThresholds structs containing information about planet routines.
   */
  function updateWorld(RoutineThresholds[] memory routineThresholds) public _onlyNotGameOver {
    uint256 goldGenRate = P_GameConfig.getGoldGenRate();
    // add gold to every planet

    // spend gold and move ships for each empire planet
    for (uint i = 0; i < routineThresholds.length; i++) {
      LibMoveShips.executePendingMoves(routineThresholds[i].planetId);
      LibRoutine.executeRoutine(routineThresholds[i].planetId, routineThresholds[i]);
      Planet.setGoldCount(
        routineThresholds[i].planetId,
        Planet.getGoldCount(routineThresholds[i].planetId) + goldGenRate
      );
    }

    // resolve combat on all planets
    // todo: only resolve combat on planets that have pending arrivals
    bytes32[] memory planets = PlanetsSet.getPlanetIds();
    for (uint i = 0; i < planets.length; i++) {
      LibResolveCombat.resolveCombat(planets[i]);
    }

    TurnData memory currTurn = Turn.get();
    uint256 currFullTurn = (currTurn.value - 1) / EMPIRE_COUNT;

    bytes32[] memory magnetEmpireTurnPlanets = MagnetTurnPlanets.get(currTurn.empire, currFullTurn);
    for (uint i = 0; i < magnetEmpireTurnPlanets.length; i++) {
      // clear magnet
      LibMagnet.removeMagnet(currTurn.empire, magnetEmpireTurnPlanets[i]);
    }
    MagnetTurnPlanets.deleteRecord(currTurn.empire, currFullTurn);

    // update empire point costs
    for (uint i = 1; i < uint256(EEmpire.LENGTH); i++) {
      LibPrice.turnEmpirePointCostDown(EEmpire(i));
      LibPrice.empireOverridesCostDown(EEmpire(i));
    }

    _updateTurn();
  }
}
