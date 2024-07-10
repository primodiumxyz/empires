// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Balances } from "@latticexyz/world/src/codegen/index.sol";

import { IWorld } from "codegen/world/IWorld.sol";

import { System } from "@latticexyz/world/src/System.sol";

import { ADMIN_NAMESPACE_ID } from "src/constants.sol";

/**
 * @title RewardsSystem
 * @dev A contract that manages the rewards system for the Empires game.
 * @dev exists in the ADMIN_NAMESPACE_ID namespace
 */
contract WithdrawRakeSystem is System {
  /**
   * @dev Allows a user to withdraw their accumulated rake.
   * todo This function should be restricted to the admin.
   */
  function withdrawRake() public {
    uint256 value = (Balances.get(ADMIN_NAMESPACE_ID));

    IWorld(_world()).transferBalanceToAddress(ADMIN_NAMESPACE_ID, _msgSender(), value);
  }
}
