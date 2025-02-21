// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { Turn, Magnet, PlaceMagnetOverrideLog, PlaceMagnetOverrideLogData, P_PointConfig } from "codegen/index.sol";
import { EOverride, EEmpire } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibMagnet } from "libraries/LibMagnet.sol";
import { LibOverride } from "libraries/LibOverride.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { addressToId, nextLogEntity } from "src/utils.sol";

/**
 * @title OverrideMagnetsSystem
 * @dev A contract that handles overrides related to creating and killing ships on a planet.
 */
contract OverrideMagnetsSystem is EmpiresSystem {
  function placeMagnet(
    EEmpire _empire,
    bytes32 _planetId,
    uint256 turnDuration
  ) public payable _onlyNotGameOver _notDefeated(_empire) {
    require(Magnet.get(_empire, _planetId).isMagnet == false, "[OverrideSystem] Planet already has a magnet");
    uint256 cost = LibPrice.getTotalCost(EOverride.PlaceMagnet, _empire, turnDuration);
    require(_msgValue() >= cost, "[OverrideSystem] Insufficient payment");
    bytes32 playerId = addressToId(_msgSender());

    LibMagnet.addMagnet(_empire, _planetId, playerId, turnDuration);
    LibOverride._purchaseOverride(playerId, EOverride.PlaceMagnet, _empire, turnDuration, cost);

    PlaceMagnetOverrideLog.set(
      nextLogEntity(),
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

    _refundOverspend(cost);
    _takeRake(cost);
  }
}
