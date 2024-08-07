// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Keys_CapitolPlanetsSet, Meta_CapitolPlanetsSet } from "codegen/index.sol";

library CapitolPlanetsSet {
  function has(bytes32 id) internal view returns (bool) {
    return Meta_CapitolPlanetsSet.get(id).stored;
  }

  function add(bytes32 id) internal {
    if (has(id)) return;
    Keys_CapitolPlanetsSet.push(id);
    Meta_CapitolPlanetsSet.set(id, true, Keys_CapitolPlanetsSet.length() - 1);
  }

  function getCapitolPlanetIds() internal view returns (bytes32[] memory capitolPlanetIds) {
    return Keys_CapitolPlanetsSet.get();
  }

  function remove(bytes32 id) internal {
    if (!has(id)) return;

    if (Keys_CapitolPlanetsSet.length() == 1) {
      clear();
      return;
    }
    uint256 index = Meta_CapitolPlanetsSet.getIndex(id);
    bytes32 replacement = Keys_CapitolPlanetsSet.getItem(Keys_CapitolPlanetsSet.length() - 1);

    // update replacement data
    Keys_CapitolPlanetsSet.update(index, replacement);
    Meta_CapitolPlanetsSet.set(replacement, true, index);

    // remove associated capitol planet
    Keys_CapitolPlanetsSet.pop();
    Meta_CapitolPlanetsSet.deleteRecord(id);
  }

  function size() internal view returns (uint256) {
    return Keys_CapitolPlanetsSet.length();
  }

  function clear() internal {
    for (uint256 i = 0; i < Keys_CapitolPlanetsSet.length(); i++) {
      bytes32 planetId = Keys_CapitolPlanetsSet.getItem(i);
      Meta_CapitolPlanetsSet.deleteRecord(planetId);
    }
    Keys_CapitolPlanetsSet.deleteRecord();
  }
}