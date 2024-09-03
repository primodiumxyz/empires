// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { Turn, Magnet, PlaceMagnetOverrideLog, PlaceMagnetOverrideLogData } from "codegen/index.sol";
import { EOverride, EEmpire } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibMagnet } from "libraries/LibMagnet.sol";
import { LibOverride } from "libraries/LibOverride.sol";
import { EMPIRES_NAMESPACE_ID } from "src/constants.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { addressToId, pseudorandomEntity } from "src/utils.sol";

/**
 * @title OverrideMagnetsSystem
 * @dev A contract that handles overrides related to creating and killing ships on a planet.
 */
contract OverrideMagnetsSystem is EmpiresSystem {
  function placeMagnet(
    EEmpire _empire,
    bytes32 _planetId,
    uint256 turnDuration
  ) public payable _onlyNotGameOver _takeRake {
    bytes32 playerId = addressToId(_msgSender());

    require(Magnet.get(_empire, _planetId).isMagnet == false, "[OverrideSystem] Planet already has a magnet");
    uint256 cost = LibPrice.getTotalCost(EOverride.PlaceMagnet, _empire, turnDuration);
    _refundOverspend(cost);

    LibMagnet.addMagnet(_empire, _planetId, playerId, turnDuration);
    LibOverride._purchaseOverride(addressToId(_msgSender()), EOverride.PlaceMagnet, _empire, turnDuration, _msgValue());

    PlaceMagnetOverrideLog.set(
      pseudorandomEntity(),
      PlaceMagnetOverrideLogData({
        turn: Turn.getValue(),
        planetId: _planetId,
        playerId: playerId,
        empireId: _empire,
        ethSpent: cost,
        overrideCount: turnDuration,
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
