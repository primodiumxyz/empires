// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { LibUpdateWorld } from "libraries/LibUpdateWorld.sol";
import { Turn, TurnData, P_GameConfig } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { FactionPlanetsSet } from "adts/FactionPlanetsSet.sol";
import { EEmpire } from "codegen/common.sol";

contract UpdateSystem is System {
  function _updateTurn() private returns (EEmpire) {
    TurnData memory turn = Turn.get();
    bool canUpdate = block.number >= turn.nextTurnBlock;
    if (!canUpdate) revert("[UpdateSystem] Cannot update yet");
    uint256 newNextTurnBlock = block.number + P_GameConfig.get();
    EEmpire newEmpire = EEmpire(((uint256(turn.empire) + 1) % 3) + 1);
    Turn.set(newNextTurnBlock, newEmpire);
    return newEmpire;
  }

  function updateWorld() public returns (bool) {
    EEmpire empire = _updateTurn();

    bytes32[] memory factionPlanets = FactionPlanetsSet.getFactionPlanetIds(empire);
    for (uint i = 0; i < factionPlanets.length; i++) {
      LibUpdateWorld.moveDestroyers(factionPlanets[i]);
    }

    bytes32[] memory allPlanets = PlanetsSet.getPlanetIds();

    return true;
  }
}
