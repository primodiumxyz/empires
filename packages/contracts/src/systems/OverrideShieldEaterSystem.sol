// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { Turn, TacticalStrikeOverrideLog, TacticalStrikeOverrideLogData, BoostChargeOverrideLog, BoostChargeOverrideLogData, StunChargeOverrideLog, StunChargeOverrideLogData, Planet_TacticalStrikeData, Planet_TacticalStrike, P_TacticalStrikeConfig, P_OverrideConfig, Empire, CreateShipOverrideLog, CreateShipOverrideLogData, KillShipOverrideLog, KillShipOverrideLogData, ChargeShieldsOverrideLog, ChargeShieldsOverrideLogData, DrainShieldsOverrideLog, DrainShieldsOverrideLogData, Magnet, Planet, PlanetData, P_PointConfig, PlaceMagnetOverrideLog, PlaceMagnetOverrideLogData, ShieldEaterDetonateOverrideLog, ShieldEaterDetonateOverrideLogData, P_ShieldEaterConfig } from "codegen/index.sol";
import { EEmpire, EOverride } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibPoint } from "libraries/LibPoint.sol";
import { LibOverride } from "libraries/LibOverride.sol";
import { LibMagnet } from "libraries/LibMagnet.sol";
import { LibShieldEater } from "libraries/LibShieldEater.sol";
import { ShieldEater } from "codegen/index.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { EMPIRES_NAMESPACE_ID } from "src/constants.sol";
import { addressToId, pseudorandomEntity } from "src/utils.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { Balances } from "@latticexyz/world/src/codegen/index.sol";

/**
 * @title OverrideSystem
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
    require(_msgValue() == cost, "[OverrideSystem] Incorrect payment");

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
}
