// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Ready, Role, P_GameConfig, P_GameConfigData } from "codegen/index.sol";
import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { ERole } from "codegen/common.sol";

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

  function setGameConfig(P_GameConfigData memory gameConfig) public _onlyAdmin {
    P_GameConfig.set(gameConfig);
  }

  /**
   * @dev Adds or updates a role for a user
   * @param user The address of the user
   * @param role The role to be assigned
   */
  function setRole(address user, ERole role) public _onlyAdmin {
    require(role == ERole.Admin || role == ERole.CanUpdate, "[AdminSystem] Invalid role");
    Role.set(user, role);
  }

  /**
   * @dev Removes a role from a user
   * @param user The address of the user
   */
  function removeRole(address user) public _onlyAdmin {
    Role.deleteRecord(user);
  }
}
