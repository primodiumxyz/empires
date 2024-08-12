// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Keys_EmpirePlanetsSet, Meta_EmpirePlanetsSet } from "codegen/index.sol";

library EmpirePlanetsSet {
  function has(uint8 empireId, bytes32 planetId) internal view returns (bool) {
    return Meta_EmpirePlanetsSet.get(empireId, planetId).stored;
  }

  function add(uint8 empireId, bytes32 planetId) internal {
    if (has(empireId, planetId)) return;
    Keys_EmpirePlanetsSet.push(empireId, planetId);
    Meta_EmpirePlanetsSet.set(empireId, planetId, true, Keys_EmpirePlanetsSet.length(empireId) - 1);
  }

  function getEmpirePlanetIds(uint8 empireId) internal view returns (bytes32[] memory asteroidEntities) {
    return Keys_EmpirePlanetsSet.get(empireId);
  }

  function remove(uint8 empireId, bytes32 planetId) internal {
    if (!has(empireId, planetId)) return;

    if (Keys_EmpirePlanetsSet.length(empireId) == 1) {
      clear(empireId);
      return;
    }
    uint256 index = Meta_EmpirePlanetsSet.getIndex(empireId, planetId);
    bytes32 replacement = Keys_EmpirePlanetsSet.getItem(empireId, Keys_EmpirePlanetsSet.length(empireId) - 1);

    // update replacement data
    Keys_EmpirePlanetsSet.update(empireId, index, replacement);
    Meta_EmpirePlanetsSet.set(empireId, replacement, true, index);

    // remove associated asteroid
    Keys_EmpirePlanetsSet.pop(empireId);
    Meta_EmpirePlanetsSet.deleteRecord(empireId, planetId);
  }

  function size(uint8 empireId) internal view returns (uint256) {
    return Keys_EmpirePlanetsSet.length(empireId);
  }

  function clear(uint8 empireId) internal {
    for (uint256 i = 0; i < Keys_EmpirePlanetsSet.length(empireId); i++) {
      bytes32 planetId = Keys_EmpirePlanetsSet.getItem(empireId, i);
      Meta_EmpirePlanetsSet.deleteRecord(empireId, planetId);
    }
    Keys_EmpirePlanetsSet.deleteRecord(empireId);
  }
}
