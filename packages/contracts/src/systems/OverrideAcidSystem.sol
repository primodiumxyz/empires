// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { Turn, Planet, P_AcidConfig, PlaceAcidOverrideLog, PlaceAcidOverrideLogData } from "codegen/index.sol";
import { EOverride, EEmpire } from "codegen/common.sol";
import { AcidPlanetsSet } from "adts/AcidPlanetsSet.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibOverride } from "libraries/LibOverride.sol";
import { addressToId, pseudorandomEntity } from "src/utils.sol";

/**
 * @title OverrideAcidSystem
 * @dev A contract that handles overrides related to creating and killing ships on a planet.
 */
contract OverrideAcidSystem is EmpiresSystem {
  function placeAcid(bytes32 _planetId) public payable _onlyNotGameOver _takeRake {
    bytes32 playerId = addressToId(_msgSender());
    EEmpire empire = Planet.getEmpireId(_planetId);

    require(AcidPlanetsSet.has(empire, _planetId) == false, "[OverrideSystem] Planet already has acid");
    uint256 cost = LibPrice.getTotalCost(EOverride.PlaceAcid, empire, 1);
    require(_msgValue() == cost, "[OverrideSystem] Incorrect payment");

    AcidPlanetsSet.add(empire, _planetId, P_AcidConfig.getAcidDuration());
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
}
