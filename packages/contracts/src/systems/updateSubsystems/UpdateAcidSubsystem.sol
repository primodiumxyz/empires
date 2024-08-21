// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { Turn, Planet, P_AcidConfig } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";
import { AcidPlanetsSet } from "adts/AcidPlanetsSet.sol";

contract UpdateAcidSubsystem is EmpiresSystem {
  function updateAcid() public {
    EEmpire empire = Turn.getEmpire();
    bytes32[] memory planetIds = AcidPlanetsSet.getAcidPlanetIds(empire);
    uint256 length = planetIds.length;
    for (uint256 i = 0; i < length; i++) {
      bytes32 planetId = planetIds[i];

      // apply acid to planet, round down
      uint256 initShips = Planet.getShipCount(planetId);
      uint256 newShips = (initShips * (10000 - P_AcidConfig.getAcidDamagePercent())) / 10000;
      Planet.setShipCount(planetId, newShips);

      // decrement acid cycles
      uint256 acidCyclesRemaining = AcidPlanetsSet.getAcidCycles(empire, planetId);
      if (acidCyclesRemaining > 1) {
        AcidPlanetsSet.updateAcidCycles(empire, planetId, acidCyclesRemaining - 1);
      } else {
        AcidPlanetsSet.remove(empire, planetId);
      }
    }
  }
}
