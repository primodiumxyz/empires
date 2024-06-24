// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Keys_FactionTilesSet, Meta_FactionTilesSet } from "codegen/index.sol";

library FactionTilesSet {
  function has(bytes32 factionId, bytes32 planetId) internal view returns (bool) {
    return Meta_FactionTilesSet.get(factionId, planetId).stored;
  }

  function add(bytes32 factionId, bytes32 planetId) internal {
    if (has(factionId, planetId)) return;
    Keys_FactionTilesSet.push(factionId, planetId);
    Meta_FactionTilesSet.set(factionId, planetId, true, Keys_FactionTilesSet.length(factionId) - 1);
  }

  function getFactionTilesIds(bytes32 factionId) internal view returns (bytes32[] memory asteroidEntities) {
    return Keys_FactionTilesSet.get(factionId);
  }

  function remove(bytes32 factionId, bytes32 planetId) internal {
    if (!has(factionId, planetId)) return;

    if (Keys_FactionTilesSet.length(factionId) == 1) {
      clear(factionId);
      return;
    }
    uint256 index = Meta_FactionTilesSet.getIndex(factionId, planetId);
    bytes32 replacement = Keys_FactionTilesSet.getItem(factionId, Keys_FactionTilesSet.length(factionId) - 1);

    // update replacement data
    Keys_FactionTilesSet.update(factionId, index, replacement);
    Meta_FactionTilesSet.set(factionId, replacement, true, index);

    // remove associated asteroid
    Keys_FactionTilesSet.pop(factionId);
    Meta_FactionTilesSet.deleteRecord(factionId, planetId);
  }

  function size(bytes32 factionId) internal view returns (uint256) {
    return Keys_FactionTilesSet.length(factionId);
  }

  function clear(bytes32 factionId) internal {
    for (uint256 i = 0; i < Keys_FactionTilesSet.length(factionId); i++) {
      bytes32 planetId = Keys_FactionTilesSet.getItem(factionId, i);
      Meta_FactionTilesSet.deleteRecord(factionId, planetId);
    }
    Keys_FactionTilesSet.deleteRecord(factionId);
  }
}
