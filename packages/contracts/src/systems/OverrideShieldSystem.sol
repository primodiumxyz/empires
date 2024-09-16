// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { Turn, ChargeShieldsOverrideLog, ChargeShieldsOverrideLogData, Planet, PlanetData, P_PointConfig } from "codegen/index.sol";
import { EOverride, EEmpire } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibOverride } from "libraries/LibOverride.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { addressToId, pseudorandomEntity } from "src/utils.sol";

/**
 * @title OverrideShieldSystem
 * @dev A contract that handles overrides related to creating and killing ships on a planet.
 */
contract OverrideShieldSystem is EmpiresSystem {
  /**
   * @dev A player purchaseable override that increases the shield on a planet.
   * @param _planetId The ID of the planet.
   * @param _overrideCount The number of overrides to purchase.
   */
  function chargeShield(bytes32 _planetId, uint256 _overrideCount) public payable _onlyNotGameOver {
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[OverrideSystem] Planet not found");
    require(planetData.empireId != EEmpire.NULL, "[OverrideSystem] Planet is not owned");
    uint256 cost = LibPrice.getTotalCost(EOverride.ChargeShield, planetData.empireId, _overrideCount);
    require(_msgValue() >= cost, "[OverrideSystem] Insufficient payment");
    bytes32 playerId = addressToId(_msgSender());

    LibOverride._purchaseOverride(playerId, EOverride.ChargeShield, planetData.empireId, _overrideCount, _msgValue());

    Planet.setShieldCount(_planetId, planetData.shieldCount + _overrideCount);

    _refundOverspend(cost);
    _takeRake(cost);

    ChargeShieldsOverrideLog.set(
      pseudorandomEntity(),
      ChargeShieldsOverrideLogData({
        turn: Turn.getValue(),
        planetId: _planetId,
        playerId: playerId,
        ethSpent: cost,
        overrideCount: _overrideCount,
        timestamp: block.timestamp
      })
    );
  }
}
