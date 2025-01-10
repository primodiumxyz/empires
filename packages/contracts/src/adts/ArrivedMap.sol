// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Keys_ArrivedMap, Value_ArrivedMap, Meta_ArrivedMap } from "codegen/index.sol";

/**
 * @title ArrivedMap
 * @dev Library to manage a mapping of planetIds to values for each planet entity.
 */
library ArrivedMap {
  /**
   * @notice Checks if a planetId exists in the map.
   * @param planetId The identifier of the planet.
   * @return True if the planetId exists, false otherwise.
   */
  function has(bytes32 planetId) internal view returns (bool) {
    return Meta_ArrivedMap.get(planetId).stored;
  }

  /**
   * @notice Sets a planetId's value.
   * @param planetId The identifier of the planet.
   * @param value The value to associate with the planet.
   * @dev Adds the planetId if it doesn't exist, otherwise updates the existing planetId's value.
   */
  function set(bytes32 planetId, uint256 value) internal {
    if (has(planetId)) {
      Value_ArrivedMap.set(planetId, value);
    } else {
      Keys_ArrivedMap.push(planetId);
      Value_ArrivedMap.set(planetId, value);
      Meta_ArrivedMap.set(planetId, true, Keys_ArrivedMap.length() - 1);
    }
  }

  /**
   * @notice Retrieves the value of a specific planetId.
   * @param planetId The identifier of the planet.
   * @return The value associated with the planet.
   */
  function get(bytes32 planetId) internal view returns (uint256) {
    return Value_ArrivedMap.get(planetId);
  }

  /**
   * @notice Returns a list of planetIds that have arrived.
   * @return An array of planet identifiers.
   */
  function keys() internal view returns (bytes32[] memory) {
    return Keys_ArrivedMap.get();
  }

  /**
   * @notice Returns the values associated with each planetId.
   * @return _values An array of planet values.
   */
  function values() internal view returns (uint256[] memory _values) {
    bytes32[] memory planetIds = keys();
    _values = new uint256[](planetIds.length);
    for (uint256 i = 0; i < planetIds.length; i++) {
      _values[i] = Value_ArrivedMap.get(planetIds[i]);
    }
  }

  /**
   * @notice Removes a planetId from the map.
   * @param planetId The identifier of the planet.
   * @dev Maintains the integrity of the map by replacing the removed planetId with the last in the array.
   */
  function remove(bytes32 planetId) internal {
    if (!has(planetId)) {
      return;
    }
    
    uint256 index = Meta_ArrivedMap.getIndex(planetId);
    if (Keys_ArrivedMap.length() == 1) {
      clear();
      return;
    }

    // update replacement data
    bytes32 replacement = Keys_ArrivedMap.getItem(Keys_ArrivedMap.length() - 1);
    Keys_ArrivedMap.update(index, replacement);
    Meta_ArrivedMap.set(replacement, true, index);

    Keys_ArrivedMap.pop();
    Value_ArrivedMap.deleteRecord(planetId);
    Meta_ArrivedMap.deleteRecord(planetId);
  }

  /**
   * @notice Returns the number of planetIds in the map.
   * @return The number of planetIds.
   */
  function size() internal view returns (uint256) {
    return Keys_ArrivedMap.length();
  }

  /**
   * @notice Clears all planetIds from the map.
   * @dev Iterates through all planetIds and deletes them.
   */
  function clear() internal {
    bytes32[] memory planetIds = keys();
    for (uint256 i = 0; i < planetIds.length; i++) {
      Value_ArrivedMap.deleteRecord(planetIds[i]);
      Meta_ArrivedMap.deleteRecord(planetIds[i]);
    }
    Keys_ArrivedMap.deleteRecord();
  }
}