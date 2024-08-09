// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Ready } from "codegen/index.sol";
import { EmpiresSystem } from "systems/EmpiresSystem.sol";

contract AdminSystem is EmpiresSystem {
  /**
   * @dev Pauses the game by setting Ready to false
   */
  function pause() public _onlyAdmin {
    Ready.set(false);
  }

  /**
   * @dev Unpauses the game by setting Ready to true
   */
  function unpause() public _onlyAdmin {
    Ready.set(true);
  }
}
