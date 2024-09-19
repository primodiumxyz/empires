// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { Turn, Planet, P_AcidConfig, PlaceAcidOverrideLog, PlaceAcidOverrideLogData, P_PointConfig } from "codegen/index.sol";
import { EOverride, EEmpire } from "codegen/common.sol";
import { AcidPlanetsSet } from "adts/AcidPlanetsSet.sol";
import { LibAcid } from "libraries/LibAcid.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibOverride } from "libraries/LibOverride.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { addressToId, pseudorandomEntity } from "src/utils.sol";

/**
 * @title OverrideAcidSystem
 * @dev A contract that handles overrides related to creating and killing ships on a planet.
 */
contract OverrideAcidSystem is EmpiresSystem {
  function placeAcid(bytes32 _planetId) public payable _onlyNotGameOver {
    bytes32 playerId = addressToId(_msgSender());
    EEmpire empire = Planet.getEmpireId(_planetId);
    require(empire != EEmpire.NULL, "[OverrideSystem] Planet is not owned");
    require(AcidPlanetsSet.has(empire, _planetId) == false, "[OverrideSystem] Planet already has acid");
    uint256 cost = LibPrice.getTotalCost(EOverride.PlaceAcid, empire, 1);

    // instantly apply first cycle of acid
    LibAcid.applyAcidDamage(_planetId);

    AcidPlanetsSet.add(empire, _planetId, P_AcidConfig.getAcidDuration() - 1);
    LibOverride._purchaseOverride(addressToId(_msgSender()), EOverride.PlaceAcid, empire, 1, _msgValue());

    _refundOverspend(cost);
    _takeRake(cost);

    PlaceAcidOverrideLog.set(
      nextLogEntity(),
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
}
