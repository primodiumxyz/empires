// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { NamespaceOwner } from "@latticexyz/world/src/codegen/tables/NamespaceOwner.sol";
import { Ready, P_GameConfig, WinningEmpire, Role } from "codegen/index.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { EMPIRES_NAMESPACE_ID } from "src/constants.sol";
import { EEmpire, ERole } from "codegen/common.sol";

contract EmpiresSystem is System {
  modifier _onlyNotGameOver() {
    require(Ready.get(), "[EmpiresSystem] Game not ready");
    require(WinningEmpire.get() == EEmpire.NULL, "[EmpiresSystem] Game over");
    uint256 endBlock = P_GameConfig.getGameOverBlock();
    require(endBlock == 0 || block.number < endBlock, "[EmpiresSystem] Game over");
    _;
  }

  // Modifier to restrict access to admin only
  modifier _onlyAdmin() {
    address sender = _msgSender();
    require(
      Role.get(sender) == ERole.Admin || NamespaceOwner.get(EMPIRES_NAMESPACE_ID) == sender,
      "[EmpiresSystem] Only admin"
    );
    _;
  }

  modifier _onlyAdminOrCanUpdate() {
    ERole role = Role.get(_msgSender());
    require(role == ERole.Admin || role == ERole.CanUpdate, "[EmpiresSystem] Only admin or can update");
    _;
  }
}
