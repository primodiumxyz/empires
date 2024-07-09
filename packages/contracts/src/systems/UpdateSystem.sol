// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { LibMoveDestroyers } from "libraries/LibMoveDestroyers.sol";
import { LibResolveCombat } from "libraries/LibResolveCombat.sol";
import { LibGold } from "libraries/LibGold.sol";
import { Planet, Turn, TurnData, P_GameConfig } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { FactionPlanetsSet } from "adts/FactionPlanetsSet.sol";
import { EEmpire } from "codegen/common.sol";

contract UpdateSystem is System {
  function _updateTurn() private returns (EEmpire) {
    TurnData memory turn = Turn.get();

    bool canUpdate = block.number >= turn.nextTurnBlock;
    if (!canUpdate) revert("[UpdateSystem] Cannot update yet");
    uint256 newNextTurnBlock = block.number + P_GameConfig.getTurnLengthBlocks();
    EEmpire newEmpire = EEmpire(((uint256(turn.empire) + 1) % 3) + 1);
    Turn.set(newNextTurnBlock, newEmpire);
    return turn.empire;
  }

  function updateWorld() public {
    EEmpire empire = _updateTurn();

    bytes32[] memory planets = PlanetsSet.getPlanetIds();
    uint256 goldGenRate = P_GameConfig.getGoldGenRate();

    // add gold to every planet
    for (uint i = 0; i < planets.length; i++) {
      Planet.setGoldCount(planets[i], Planet.getGoldCount(planets[i]) + goldGenRate);
    }

    // spend gold and move destroyers for each faction planet
    bytes32[] memory factionPlanets = FactionPlanetsSet.getFactionPlanetIds(empire);
    for (uint i = 0; i < factionPlanets.length; i++) {
      LibGold.spendGold(planets[i]);
      LibMoveDestroyers.moveDestroyers(factionPlanets[i]);
    }

    // resolve combat for each planet
    for (uint i = 0; i < planets.length; i++) {
      LibResolveCombat.resolveCombat(empire, planets[i]);
    }
  }
}
