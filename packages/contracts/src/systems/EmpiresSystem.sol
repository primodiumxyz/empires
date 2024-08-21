// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Ready, P_PointConfig, P_GameConfig, WinningEmpire } from "codegen/index.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";
import { EEmpire } from "codegen/common.sol";

contract EmpiresSystem is System {
  modifier _onlyNotGameOver() {
    require(Ready.get(), "[EmpiresSystem] Game not ready");
    require(WinningEmpire.get() == EEmpire.NULL, "[EmpiresSystem] Game over");
    uint256 endBlock = P_GameConfig.getGameOverBlock();
    require(endBlock == 0 || block.number < endBlock, "[EmpiresSystem] Game over");
    _;
  }
  /**
   * @dev Function to take the rake from the rewards system.
   * This function is private and can only be called within the contract.
   */
  modifier _takeRake() {
    uint256 rake = (_msgValue() * P_PointConfig.getPointRake()) / 10_000;

    IWorld(_world()).transferBalanceToNamespace(EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID, rake);
    _;
  }

  // Modifier to restrict access to admin only
  modifier _onlyAdmin() {
    // TODO: Implement proper admin check
    _;
  }
}
