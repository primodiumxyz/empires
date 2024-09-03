// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { Turn, Planet, PlanetData, ShieldEaterDetonateOverrideLog, ShieldEaterDetonateOverrideLogData, P_ShieldEaterConfig } from "codegen/index.sol";
import { EOverride } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibOverride } from "libraries/LibOverride.sol";
import { LibShieldEater } from "libraries/LibShieldEater.sol";
import { ShieldEater } from "codegen/index.sol";
import { EMPIRES_NAMESPACE_ID } from "src/constants.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { addressToId, pseudorandomEntity } from "src/utils.sol";

/**
 * @title OverrideShieldEaterSystem
 * @dev A contract that handles overrides related to creating and killing ships on a planet.
 */
contract OverrideShieldEaterSystem is EmpiresSystem {
  function detonateShieldEater() public payable _onlyNotGameOver _takeRake {
    bytes32 playerId = addressToId(_msgSender());
    PlanetData memory planetData = Planet.get(ShieldEater.getCurrentPlanet());

    require(
      ShieldEater.getCurrentCharge() >= P_ShieldEaterConfig.getDetonationThreshold(),
      "[OverrideSystem] ShieldEater not fully charged"
    );

    uint256 cost = LibPrice.getTotalCost(EOverride.DetonateShieldEater, planetData.empireId, 1);
    _refundOverspend(cost);

    LibOverride._purchaseOverride(playerId, EOverride.DetonateShieldEater, planetData.empireId, 1, _msgValue());

    LibShieldEater.detonate();

    ShieldEaterDetonateOverrideLog.set(
      pseudorandomEntity(),
      ShieldEaterDetonateOverrideLogData({
        turn: Turn.getValue(),
        planetId: ShieldEater.getCurrentPlanet(),
        playerId: playerId,
        ethSpent: cost,
        overrideCount: 1,
        timestamp: block.timestamp
      })
    );
  }

  /**
   * @dev Handles overspending by the user when making a payment.
   * @param _cost The expected cost of the transaction.
   * @notice This function ensures that the user has sent enough ETH to cover the cost.
   * If the user sends more than the required amount, the excess is refunded.
   */
  function _refundOverspend(uint256 _cost) private {
    require(_msgValue() >= _cost, "[OverrideSystem] Incorrect payment");
    if (_msgValue() > _cost) {
      IWorld(_world()).transferBalanceToAddress(EMPIRES_NAMESPACE_ID, _msgSender(), _msgValue() - _cost);
    }
  }
}
