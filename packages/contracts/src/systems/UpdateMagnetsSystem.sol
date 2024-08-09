// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Turn, MagnetTurnPlanets } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";
import { EMPIRE_COUNT } from "src/constants.sol";
import { LibMagnet } from "libraries/LibMagnet.sol";

contract UpdateMagnetsSystem is System {
  function updateMagnets() public {
    uint256 nextTurn = Turn.getValue() + 1;
    // remove magnets that should be removed for the next turn for each empire, so the turn starts on an updated state
    for (uint i = 1; i <= EMPIRE_COUNT; i++) {
      bytes32[] memory magnetEmpireTurnPlanets = MagnetTurnPlanets.get(EEmpire(i), nextTurn);
      for (uint j = 0; j < magnetEmpireTurnPlanets.length; j++) {
        // clear magnet
        LibMagnet.removeMagnet(EEmpire(i), magnetEmpireTurnPlanets[j]);
      }

      MagnetTurnPlanets.deleteRecord(EEmpire(i), nextTurn);
    }
  }
}
