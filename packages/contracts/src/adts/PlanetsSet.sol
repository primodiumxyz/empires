// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Keys_PlanetsSet, Meta_PlanetsSet } from "codegen/index.sol";

library PlanetsSet {
  function has(bytes32 id) internal view returns (bool) {
    return Meta_PlanetsSet.get(id).stored;
  }

  function add(bytes32 id) internal {
    if (has(id)) return;
    Keys_PlanetsSet.push(id);
    Meta_PlanetsSet.set(id, true, Keys_PlanetsSet.length() - 1);
  }

  function getPlanetsIds() internal view returns (bytes32[] memory asteroidEntities) {
    return Keys_PlanetsSet.get();
  }

  function remove(bytes32 id) internal {
    if (!has(id)) return;

    if (Keys_PlanetsSet.length() == 1) {
      clear();
      return;
    }
    uint256 index = Meta_PlanetsSet.getIndex(id);
    bytes32 replacement = Keys_PlanetsSet.getItem(Keys_PlanetsSet.length() - 1);

    // update replacement data
    Keys_PlanetsSet.update(index, replacement);
    Meta_PlanetsSet.set(replacement, true, index);

    // remove associated asteroid
    Keys_PlanetsSet.pop();
    Meta_PlanetsSet.deleteRecord(id);
  }

  function size() internal view returns (uint256) {
    return Keys_PlanetsSet.length();
  }

  function clear() internal {
    for (uint256 i = 0; i < Keys_PlanetsSet.length(); i++) {
      bytes32 planetId = Keys_PlanetsSet.getItem(i);
      Meta_PlanetsSet.deleteRecord(planetId);
    }
    Keys_PlanetsSet.deleteRecord();
  }
}
