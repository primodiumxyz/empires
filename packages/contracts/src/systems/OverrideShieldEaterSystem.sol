// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { Turn, Planet, PlanetData, ShieldEaterDetonateOverrideLog, ShieldEaterDetonateOverrideLogData, P_ShieldEaterConfig, P_PointConfig } from "codegen/index.sol";
import { EOverride } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibOverride } from "libraries/LibOverride.sol";
import { LibShieldEater } from "libraries/LibShieldEater.sol";
import { ShieldEater } from "codegen/index.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { addressToId, nextLogEntity } from "src/utils.sol";

/**
 * @title OverrideShieldEaterSystem
 * @dev A contract that handles overrides related to creating and killing ships on a planet.
 */
contract OverrideShieldEaterSystem is EmpiresSystem {
  function detonateShieldEater() public payable _onlyNotGameOver {
    bytes32 playerId = addressToId(_msgSender());
    PlanetData memory planetData = Planet.get(ShieldEater.getCurrentPlanet());

    require(
      ShieldEater.getCurrentCharge() >= P_ShieldEaterConfig.getDetonationThreshold(),
      "[OverrideSystem] ShieldEater not fully charged"
    );

    uint256 cost = LibPrice.getTotalCost(EOverride.DetonateShieldEater, planetData.empireId, 1);

    LibOverride._purchaseOverride(playerId, EOverride.DetonateShieldEater, planetData.empireId, 1, cost);

    LibShieldEater.detonate();

    ShieldEaterDetonateOverrideLog.set(
      nextLogEntity(),
      ShieldEaterDetonateOverrideLogData({
        turn: Turn.getValue(),
        planetId: ShieldEater.getCurrentPlanet(),
        playerId: playerId,
        ethSpent: cost,
        overrideCount: 1,
        timestamp: block.timestamp
      })
    );

    _refundOverspend(cost);
    _takeRake(cost);
  }
}
