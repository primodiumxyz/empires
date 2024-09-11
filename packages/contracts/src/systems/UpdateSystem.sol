// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IWorld } from "codegen/world/IWorld.sol";

import { Turn, TurnData, P_GameConfig } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";
import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { RoutineThresholds } from "../Types.sol";

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
    uint8 empireCount = P_GameConfig.getEmpireCount();
    EEmpire newEmpire = EEmpire(((uint256(turn.empire) % empireCount) + 1));
    Turn.set(newNextTurnBlock, newEmpire, turn.value + 1);
    return turn.empire;
  }

  /**
   * @dev Updates the game world state, including gold generation, ship movements, combat resolution.
   * @param routineThresholds An array of RoutineThresholds structs containing information about planet routines.
   */
  function updateWorld(
    RoutineThresholds[] memory routineThresholds,
    bytes32 shieldEaterNextPlanetId
  ) public _onlyNotGameOver _onlyAdminOrCanUpdate {
    IWorld world = IWorld(_world());
    world.Empires__updateEmpires(routineThresholds);
    world.Empires__updateMagnets();
    world.Empires__updateAcid();
    world.Empires__updateShieldEater(shieldEaterNextPlanetId);
    world.Empires__updatePrice();
    _updateTurn();
  }
}
