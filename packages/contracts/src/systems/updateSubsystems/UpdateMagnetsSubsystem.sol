// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { Turn, MagnetTurnPlanets, P_GameConfig } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";
import { LibMagnet } from "libraries/LibMagnet.sol";

contract UpdateMagnetsSubsystem is EmpiresSystem {
  function updateMagnets() public {
    uint256 nextTurn = Turn.getValue() + 1;
    // remove magnets that should be removed for the next turn for each empire, so the turn starts on an updated state
    for (uint8 i = 1; i <= P_GameConfig.getEmpireCount(); i++) {
      EEmpire empire = EEmpire(i);
      bytes32[] memory magnetEmpireTurnPlanets = MagnetTurnPlanets.get(empire, nextTurn);
      for (uint j = 0; j < magnetEmpireTurnPlanets.length; j++) {
        // clear magnet
        LibMagnet.removeMagnet(empire, magnetEmpireTurnPlanets[j]);
      }

      MagnetTurnPlanets.deleteRecord(empire, nextTurn);
    }
  }
}
