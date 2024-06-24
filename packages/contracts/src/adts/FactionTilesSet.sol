// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Keys_FactionPlanetsSet, Meta_FactionPlanetsSet } from "codegen/index.sol";

library FactionPlanetsSet {
  function has(bytes32 factionId, bytes32 planetId) internal view returns (bool) {
    return Meta_FactionPlanetsSet.get(factionId, planetId).stored;
  }

  function add(bytes32 factionId, bytes32 planetId) internal {
    if (has(factionId, planetId)) return;
    Keys_FactionPlanetsSet.push(factionId, planetId);
    Meta_FactionPlanetsSet.set(factionId, planetId, true, Keys_FactionPlanetsSet.length(factionId) - 1);
  }

  function getFactionPlanetsIds(bytes32 factionId) internal view returns (bytes32[] memory asteroidEntities) {
    return Keys_FactionPlanetsSet.get(factionId);
  }

  function remove(bytes32 factionId, bytes32 planetId) internal {
    if (!has(factionId, planetId)) return;

    if (Keys_FactionPlanetsSet.length(factionId) == 1) {
      clear(factionId);
      return;
    }
    uint256 index = Meta_FactionPlanetsSet.getIndex(factionId, planetId);
    bytes32 replacement = Keys_FactionPlanetsSet.getItem(factionId, Keys_FactionPlanetsSet.length(factionId) - 1);

    // update replacement data
    Keys_FactionPlanetsSet.update(factionId, index, replacement);
    Meta_FactionPlanetsSet.set(factionId, replacement, true, index);

    // remove associated asteroid
    Keys_FactionPlanetsSet.pop(factionId);
    Meta_FactionPlanetsSet.deleteRecord(factionId, planetId);
  }

  function size(bytes32 factionId) internal view returns (uint256) {
    return Keys_FactionPlanetsSet.length(factionId);
  }

  function clear(bytes32 factionId) internal {
    for (uint256 i = 0; i < Keys_FactionPlanetsSet.length(factionId); i++) {
      bytes32 planetId = Keys_FactionPlanetsSet.getItem(factionId, i);
      Meta_FactionPlanetsSet.deleteRecord(factionId, planetId);
    }
    Keys_FactionPlanetsSet.deleteRecord(factionId);
  }
}
