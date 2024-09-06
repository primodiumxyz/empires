// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Balances } from "@latticexyz/world/src/codegen/index.sol";

import { IWorld } from "codegen/world/IWorld.sol";

import { EmpiresSystem } from "systems/EmpiresSystem.sol";

import { ADMIN_NAMESPACE_ID } from "src/constants.sol";


/**
 * @title WithdrawRakeSystem
 * @dev A contract that manages the withdrawal of rake from the Empires game.
 * @dev exists in the ADMIN_NAMESPACE_ID namespace
 */
contract WithdrawRakeSystem is EmpiresSystem {
  /**
   * @dev Allows a user to withdraw their accumulated rake.
   * todo This function should be restricted to the admin.
   */
  function withdrawRake() public _onlyAdmin {
    uint256 value = (Balances.get(ADMIN_NAMESPACE_ID));

    IWorld(_world()).transferBalanceToAddress(ADMIN_NAMESPACE_ID, _msgSender(), value);
  }
}
