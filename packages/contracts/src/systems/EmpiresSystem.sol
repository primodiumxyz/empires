// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Ready, P_PointConfig, P_GameConfig, Planet_TacticalStrike, Planet_TacticalStrikeData, WinningEmpire } from "codegen/index.sol";
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

  /**
   * @dev Updates the tactical strike countdown for a given planet.
   * @param _planetId The ID of the planet to update.
   * @notice This function calculates the progress of the tactical strike countdown based on the number of blocks elapsed since the last update.
   * @custom:effects
   *  - Increases the charge based on the time passed and the planet's charge rate.
   *  - Updates the lastUpdated timestamp to the current block number.
   */
  modifier _updateTacticalStrikeCharge(bytes32 _planetId) {
    Planet_TacticalStrikeData memory planetTacticalStrikeData = Planet_TacticalStrike.get(_planetId);
    uint256 blocksElapsed = block.number - planetTacticalStrikeData.lastUpdated;
    planetTacticalStrikeData.charge += (blocksElapsed * planetTacticalStrikeData.chargeRate) / 100;
    planetTacticalStrikeData.lastUpdated = block.number;
    Planet_TacticalStrike.set(_planetId, planetTacticalStrikeData);
    _;
  }
}
