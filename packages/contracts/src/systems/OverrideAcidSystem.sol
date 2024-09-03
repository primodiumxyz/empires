// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { Turn, Planet, P_AcidConfig, PlaceAcidOverrideLog, PlaceAcidOverrideLogData } from "codegen/index.sol";
import { EOverride, EEmpire } from "codegen/common.sol";
import { AcidPlanetsSet } from "adts/AcidPlanetsSet.sol";
import { LibAcid } from "libraries/LibAcid.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibOverride } from "libraries/LibOverride.sol";
import { EMPIRES_NAMESPACE_ID } from "src/constants.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { addressToId, pseudorandomEntity } from "src/utils.sol";

/**
 * @title OverrideAcidSystem
 * @dev A contract that handles overrides related to creating and killing ships on a planet.
 */
contract OverrideAcidSystem is EmpiresSystem {
  function placeAcid(bytes32 _planetId) public payable _onlyNotGameOver _takeRake {
    bytes32 playerId = addressToId(_msgSender());
    EEmpire empire = Planet.getEmpireId(_planetId);
    require(empire != EEmpire.NULL, "[OverrideSystem] Planet is not owned");
    require(AcidPlanetsSet.has(empire, _planetId) == false, "[OverrideSystem] Planet already has acid");
    uint256 cost = LibPrice.getTotalCost(EOverride.PlaceAcid, empire, 1);
    _refundOverspend(cost);

    // instantly apply first cycle of acid
    LibAcid.applyAcidDamage(_planetId);

    AcidPlanetsSet.add(empire, _planetId, P_AcidConfig.getAcidDuration() - 1);
    LibOverride._purchaseOverride(addressToId(_msgSender()), EOverride.PlaceAcid, empire, 1, _msgValue());

    PlaceAcidOverrideLog.set(
      pseudorandomEntity(),
      PlaceAcidOverrideLogData({
        playerId: playerId,
        turn: Turn.getValue(),
        planetId: _planetId,
        ethSpent: _msgValue(),
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
