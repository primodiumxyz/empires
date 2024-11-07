// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { NamespaceOwner } from "@latticexyz/world/src/codegen/tables/NamespaceOwner.sol";
import { Ready, P_GameConfig, P_PointConfig, WinningEmpire, Role, Empire } from "codegen/index.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";
import { EEmpire, ERole } from "codegen/common.sol";

contract EmpiresSystem is System {
  modifier _onlyNotGameOver() {
    require(Ready.get(), "[EmpiresSystem] Game not ready");
    require(WinningEmpire.get() == EEmpire.NULL, "[EmpiresSystem] Game over");
    require(block.number >= P_GameConfig.getGameStartBlock(), "[EmpiresSystem] Game not started");
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

  modifier _notDefeated(EEmpire _empire) {
    require(!Empire.getIsDefeated(_empire), "[EmpiresSystem] Empire defeated");
    _;
  }

  /**
   * @dev Refunds the user if they send more than the expected cost.
   * @param _cost The expected cost of the transaction.
   * @notice Auditor: should this function be migrated and duplicated to all the Override systems and made private? Note how MUD handles System registration to a namespace.
   */
  function _refundOverspend(uint256 _cost) internal {
    uint256 msgValue = _msgValue();
    require(msgValue >= _cost, "[EmpiresSystem] Incorrect payment");
    if (msgValue > _cost) {
      IWorld(_world()).transferBalanceToAddress(
        EMPIRES_NAMESPACE_ID,
        _msgSender(),
        msgValue - _cost
      );
    }
  }

  /**
   * @dev Calculates and transfers the rake (fee) from the transaction cost.
   * @param _cost The total cost of the transaction.
   * @notice Auditor: should this function be migrated and duplicated to all the Override systems and made private? Note how MUD handles System registration to a namespace, such that new systems after deployment must be registered before they have any access to modify its state
   */
  function _takeRake(uint256 _cost) internal {
    uint256 rake = (_cost * P_PointConfig.getPointRake()) / 10_000;
    IWorld(_world()).transferBalanceToNamespace(
      EMPIRES_NAMESPACE_ID,
      ADMIN_NAMESPACE_ID,
      rake
    );
  }
}
