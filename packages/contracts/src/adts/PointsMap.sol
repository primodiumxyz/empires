// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Keys_PointsMap, Value_PointsMap, Meta_PointsMap, Empire } from "codegen/index.sol";
import { EEmpire, EPlayerAction } from "codegen/common.sol";

/**
 * @title empireMap
 * @dev Library to manage a mapping of utilities (identified by uint8 keys) to values for each player entity in a game.
 */
library PointsMap {
  /**
   * @notice Checks if a player has a specific empire.
   * @param playerId The identifier of the player.
   * @param empire The empire to check for.
   * @return True if the empire exists for the player, false otherwise.
   */
  function has(EEmpire empire, bytes32 playerId) internal view returns (bool) {
    return Meta_PointsMap.get(empire, playerId).stored;
  }

  /**
   * @notice Sets a empire item for a player.
   * @param playerId The identifier of the player.
   * @param empire The empire to set.
   * @param value The item value to associate with the empire.
   * @dev Adds the empire if it doesn't exist, otherwise updates the existing empire's value.
   */
  function set(EEmpire empire, bytes32 playerId, uint256 value) internal {
    if (has(empire, playerId)) {
      uint256 prevValue = get(empire, playerId);

      if (value < prevValue) Empire.setPointsIssued(empire, Empire.getPointsIssued(empire) - (prevValue - value));
      else Empire.setPointsIssued(empire, Empire.getPointsIssued(empire) + (value - prevValue));

      Value_PointsMap.set(empire, playerId, value);
    } else {
      Keys_PointsMap.push(empire, playerId);
      Value_PointsMap.set(empire, playerId, value);
      Meta_PointsMap.set(empire, playerId, true, Keys_PointsMap.length(empire) - 1);
      Empire.setPointsIssued(empire, Empire.getPointsIssued(empire) + value);
    }
  }

  /**
   * @notice Retrieves the value of a specific empire for a player.
   * @param playerId The identifier of the player.
   * @param empire The empire to retrieve the value for.
   * @return The value associated with the empire.
   */
  function get(EEmpire empire, bytes32 playerId) internal view returns (uint256) {
    return Value_PointsMap.get(empire, playerId);
  }

  /**
   * @notice Returns a list of utilities that the player has.
   * @param empire The identifier of the empire.
   * @return An array of empire identifiers.
   */
  function keys(EEmpire empire) internal view returns (bytes32[] memory) {
    return Keys_PointsMap.get(empire);
  }

  /**
   * @notice Returns the values associated with each player within the empire.
   * @param empire The identifier of the empire.
   * @return _values An array of player point values.
   */
  function values(EEmpire empire) internal view returns (uint256[] memory _values) {
    bytes32[] memory players = keys(empire);
    _values = new uint256[](players.length);
    for (uint256 i = 0; i < players.length; i++) {
      _values[i] = Value_PointsMap.get(empire, players[i]);
    }
  }

  /**
   * @notice Removes a empire from a player.
   * @param playerId The identifier of the player.
   * @param empire The empire to remove.
   * @dev Maintains the integrity of the empire keys array by replacing the removed empire with the last in the array.
   */
  function remove(EEmpire empire, bytes32 playerId) internal {
    uint256 index = Meta_PointsMap.getIndex(empire, playerId);
    if (Keys_PointsMap.length(empire) == 1) {
      clear(empire);
      return;
    }

    // update replacement data
    bytes32 replacement = Keys_PointsMap.getItem(empire, Keys_PointsMap.length(empire) - 1);
    Keys_PointsMap.update(empire, index, replacement);
    Meta_PointsMap.set(empire, replacement, true, index);

    // remove empire
    Empire.setPointsIssued(empire, Empire.getPointsIssued(empire) - Value_PointsMap.get(empire, playerId));

    Keys_PointsMap.pop(empire);
    Value_PointsMap.deleteRecord(empire, playerId);
    Meta_PointsMap.deleteRecord(empire, playerId);
  }

  /**
   * @notice Returns the number of utilities a player has.
   * @param empire The identifier of the empire.
   * @return The number of utilities.
   */
  function size(EEmpire empire) internal view returns (uint256) {
    return Keys_PointsMap.length(empire);
  }

  /**
   * @notice Clears all utilities associated with a player.
   * @param empire The identifier of the empire.
   * @dev Iterates through all utilities and deletes them.
   */
  function clear(EEmpire empire) internal {
    bytes32[] memory players = keys(empire);
    for (uint256 i = 0; i < players.length; i++) {
      Value_PointsMap.deleteRecord(empire, players[i]);
      Meta_PointsMap.deleteRecord(empire, players[i]);
    }
    Keys_PointsMap.deleteRecord(empire);
    Empire.setPointsIssued(empire, 0);
  }
}
