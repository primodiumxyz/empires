// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Keys_CitadelPlanetsSet, Meta_CitadelPlanetsSet } from "codegen/index.sol";

library CitadelPlanetsSet {
  function has(bytes32 id) internal view returns (bool) {
    return Meta_CitadelPlanetsSet.get(id).stored;
  }

  function add(bytes32 id) internal {
    if (has(id)) return;
    Keys_CitadelPlanetsSet.push(id);
    Meta_CitadelPlanetsSet.set(id, true, Keys_CitadelPlanetsSet.length() - 1);
  }

  function getCitadelPlanetIds() internal view returns (bytes32[] memory citadelPlanetIds) {
    return Keys_CitadelPlanetsSet.get();
  }

  function remove(bytes32 id) internal {
    if (!has(id)) return;

    if (Keys_CitadelPlanetsSet.length() == 1) {
      clear();
      return;
    }
    uint256 index = Meta_CitadelPlanetsSet.getIndex(id);
    bytes32 replacement = Keys_CitadelPlanetsSet.getItem(Keys_CitadelPlanetsSet.length() - 1);

    // update replacement data
    Keys_CitadelPlanetsSet.update(index, replacement);
    Meta_CitadelPlanetsSet.set(replacement, true, index);

    // remove associated citadel planet
    Keys_CitadelPlanetsSet.pop();
    Meta_CitadelPlanetsSet.deleteRecord(id);
  }

  function size() internal view returns (uint256) {
    return Keys_CitadelPlanetsSet.length();
  }

  function clear() internal {
    for (uint256 i = 0; i < Keys_CitadelPlanetsSet.length(); i++) {
      bytes32 planetId = Keys_CitadelPlanetsSet.getItem(i);
      Meta_CitadelPlanetsSet.deleteRecord(planetId);
    }
    Keys_CitadelPlanetsSet.deleteRecord();
  }
}