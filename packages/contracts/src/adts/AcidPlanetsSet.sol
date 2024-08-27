// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Keys_AcidPlanetsSet, Meta_AcidPlanetsSet, Value_AcidPlanetsSet } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";

library AcidPlanetsSet {
  function has(EEmpire empireId, bytes32 planetId) internal view returns (bool) {
    return Meta_AcidPlanetsSet.get(empireId, planetId).stored;
  }

  function add(EEmpire empireId, bytes32 planetId, uint256 acidCycles) internal {
    if (acidCycles == 0) return;
    if (has(empireId, planetId)) return;
    Keys_AcidPlanetsSet.push(empireId, planetId);
    Meta_AcidPlanetsSet.set(empireId, planetId, true, Keys_AcidPlanetsSet.length(empireId) - 1);
    Value_AcidPlanetsSet.set(empireId, planetId, acidCycles);
  }

  function getAcidPlanetIds(EEmpire empireId) internal view returns (bytes32[] memory acidPlanetIds) {
    return Keys_AcidPlanetsSet.get(empireId);
  }

  function getAcidCycles(EEmpire empireId, bytes32 planetId) internal view returns (uint256) {
    return Value_AcidPlanetsSet.get(empireId, planetId);
  }

  function updateAcidCycles(EEmpire empireId, bytes32 planetId, uint256 newAcidCycles) internal {
    if (!has(empireId, planetId)) return;
    if (newAcidCycles == 0) {
      remove(empireId, planetId);
    } else {
      Value_AcidPlanetsSet.set(empireId, planetId, newAcidCycles);
    }
  }

  function remove(EEmpire empireId, bytes32 planetId) internal {
    if (!has(empireId, planetId)) return;

    if (Keys_AcidPlanetsSet.length(empireId) == 1) {
      clear(empireId);
      return;
    }
    uint256 index = Meta_AcidPlanetsSet.getIndex(empireId, planetId);
    bytes32 replacement = Keys_AcidPlanetsSet.getItem(empireId, Keys_AcidPlanetsSet.length(empireId) - 1);

    // update replacement data
    Keys_AcidPlanetsSet.update(empireId, index, replacement);
    Meta_AcidPlanetsSet.set(empireId, replacement, true, index);

    // remove associated planet
    Keys_AcidPlanetsSet.pop(empireId);
    Meta_AcidPlanetsSet.deleteRecord(empireId, planetId);
    Value_AcidPlanetsSet.deleteRecord(empireId, planetId);
  }

  function size(EEmpire empireId) internal view returns (uint256) {
    return Keys_AcidPlanetsSet.length(empireId);
  }

  function clear(EEmpire empireId) internal {
    for (uint256 i = 0; i < Keys_AcidPlanetsSet.length(empireId); i++) {
      bytes32 planetId = Keys_AcidPlanetsSet.getItem(empireId, i);
      Meta_AcidPlanetsSet.deleteRecord(empireId, planetId);
      Value_AcidPlanetsSet.deleteRecord(empireId, planetId);
    }
    Keys_AcidPlanetsSet.deleteRecord(empireId);
  }

  function changeEmpire(EEmpire oldEmpireId, EEmpire newEmpireId, bytes32 planetId) internal {
    if (!has(oldEmpireId, planetId)) return;
    uint256 acidCycles = getAcidCycles(oldEmpireId, planetId);
    remove(oldEmpireId, planetId);
    if (acidCycles > 0) {
      add(newEmpireId, planetId, acidCycles);
    }
  }
}