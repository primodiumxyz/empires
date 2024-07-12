// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { P_GameConfig } from "codegen/index.sol";
import { P_PointConfig } from "codegen/index.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";

contract EmpiresSystem is System {
  modifier _onlyNotGameOver() {
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
}
