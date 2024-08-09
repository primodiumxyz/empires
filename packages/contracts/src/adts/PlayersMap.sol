// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Keys_PlayersMap, Value_PlayersMap, Value_PlayersMapData, Meta_PlayersMap } from "codegen/index.sol";

/**
 * @title PlayersMap
 * @dev Library to manage a mapping of players to values for each player entity in a game.
 */
library PlayersMap {
  /**
   * @notice Checks if a player exists in the map.
   * @param playerId The identifier of the player.
   * @return True if the player exists, false otherwise.
   */
  function has(bytes32 playerId) internal view returns (bool) {
    return Meta_PlayersMap.get(playerId).stored;
  }

  /**
   * @notice Sets a player's value.
   * @param playerId The identifier of the player.
   * @param value The item value to associate with the player.
   * @dev Adds the player if it doesn't exist, otherwise updates the existing player's value.
   */
  function setGain(bytes32 playerId, uint256 value) internal {
    if (has(playerId)) {
      Value_PlayersMap.setGain(playerId, value);
    } else {
      Keys_PlayersMap.push(playerId);
      Value_PlayersMap.setGain(playerId, value);
      Meta_PlayersMap.set(playerId, true, Keys_PlayersMap.length() - 1);
    }
  }

  function setLoss(bytes32 playerId, uint256 value) internal {
    if (has(playerId)) {
      Value_PlayersMap.setLoss(playerId, value);
    } else {
      Keys_PlayersMap.push(playerId);
      Value_PlayersMap.setLoss(playerId, value);
      Meta_PlayersMap.set(playerId, true, Keys_PlayersMap.length() - 1);
    }
  }

  /**
   * @notice Retrieves the value of a specific player.
   * @param playerId The identifier of the player.
   * @return The value associated with the player.
   */
  function get(bytes32 playerId) internal view returns (Value_PlayersMapData memory) {
    return Value_PlayersMap.get(playerId);
  }

  /**
   * @notice Returns a list of utilities that the player has.
   * @return An array of player identifiers.
   */
  function keys() internal view returns (bytes32[] memory) {
    return Keys_PlayersMap.get();
  }

  /**
   * @notice Returns the values associated with each player.
   * @return _values An array of player point values.
   */
  function values() internal view returns (Value_PlayersMapData[] memory _values) {
    bytes32[] memory players = keys();
    _values = new Value_PlayersMapData[](players.length);
    for (uint256 i = 0; i < players.length; i++) {
      _values[i] = Value_PlayersMap.get(players[i]);
    }
  }

  /**
   * @notice Removes a player from the map.
   * @param playerId The identifier of the player.
   * @dev Maintains the integrity of the map by replacing the removed player with the last in the array.
   */
  function remove(bytes32 playerId) internal {
    uint256 index = Meta_PlayersMap.getIndex(playerId);
    if (Keys_PlayersMap.length() == 1) {
      clear();
      return;
    }

    // update replacement data
    bytes32 replacement = Keys_PlayersMap.getItem(Keys_PlayersMap.length() - 1);
    Keys_PlayersMap.update(index, replacement);
    Meta_PlayersMap.set(replacement, true, index);

    Keys_PlayersMap.pop();
    Value_PlayersMap.deleteRecord(playerId);
    Meta_PlayersMap.deleteRecord(playerId);
  }

  /**
   * @notice Returns the number of players in the map.
   * @return The number of players.
   */
  function size() internal view returns (uint256) {
    return Keys_PlayersMap.length();
  }

  /**
   * @notice Clears all utilities associated with a player.
   * @dev Iterates through all players and deletes them.
   */
  function clear() internal {
    bytes32[] memory players = keys();
    for (uint256 i = 0; i < players.length; i++) {
      Value_PlayersMap.deleteRecord(players[i]);
      Meta_PlayersMap.deleteRecord(players[i]);
    }
    Keys_PlayersMap.deleteRecord();
  }
}
