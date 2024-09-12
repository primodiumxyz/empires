// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { TestPlus } from "solady/TestPlus.sol";

/// @dev Base handler to be implemented by specific handlers
/// @dev This base is used to:
/// - create/select random users
abstract contract HandlerBase is PrimodiumTest, TestPlus {
  /* -------------------------------------------------------------------------- */
  /*                                   STORAGE                                  */
  /* -------------------------------------------------------------------------- */

  /// @dev Users that interacted with the contract
  address[] internal _players;

  /* -------------------------------------------------------------------------- */
  /*                                  FUNCTIONS                                 */
  /* -------------------------------------------------------------------------- */

  constructor() {}

  /* -------------------------------------------------------------------------- */
  /*                                  UTILITIES                                 */
  /* -------------------------------------------------------------------------- */

  /// @dev Return a boolean indicating whether `a` implies `b`
  function implies(bool a, bool b) internal pure returns (bool) {
    return !a || b;
  }

  /// @dev Assert that `a` implies `b`
  function assert_implies(bool a, bool b) internal pure {
    assert(implies(a, b));
  }

  /* -------------------------------------------------------------------------- */
  /*                                   HELPERS                                  */
  /* -------------------------------------------------------------------------- */

  /// @dev A. Return an existing user; meaning that they have already interacted with the contract (30%)
  /// @dev B. Create a new user, deal some ETH and add them to the array
  /// (70%)
  function _selectRandomOrCreateUser(uint256 seed) internal virtual returns (address user) {
    uint256 chanceToSelectExistingUser = 30; // 30%

    if (seed % 100 < chanceToSelectExistingUser && _players.length > 0) {
      user = _players[seed % _players.length];
    } else {
      user = address(uint160(seed));

      // Do they exist already?
      for (uint256 i = 0; i < _players.length; i++) {
        if (_players[i] == user) {
          return user;
        }
      }

      // If not, add them to the list and fund them
      _players.push(user);
      uint256 amount = bound(seed, 1, uint256(type(uint96).max));
      vm.deal(user, amount);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */

  /// @dev Return the list of players that interacted with the contract
  function players() external view returns (address[] memory) {
    return _players;
  }
}
