// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { Turn, P_OverrideConfig, Empire, CreateShipOverrideLog, CreateShipOverrideLogData, ChargeShieldsOverrideLog, ChargeShieldsOverrideLogData, Magnet, Planet, PlanetData, P_PointConfig, PlaceMagnetOverrideLog, PlaceMagnetOverrideLogData } from "codegen/index.sol";
import { EOverride, EEmpire } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibPoint } from "libraries/LibPoint.sol";
import { LibOverride } from "libraries/LibOverride.sol";
import { LibMagnet } from "libraries/LibMagnet.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { PlayersMap } from "adts/PlayersMap.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";
import { addressToId, pseudorandomEntity } from "src/utils.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { Balances } from "@latticexyz/world/src/codegen/index.sol";

/**
 * @title OverrideShipSystem
 * @dev A contract that handles overrides related to creating and killing ships on a planet.
 */
contract OverrideShipSystem is EmpiresSystem {
  /**
   * @dev A player purchaseable override that creates a ship on a planet.
   * @param _planetId The ID of the planet.
   * @param _overrideCount The number of overrides to purchase.
   */
  function createShip(bytes32 _planetId, uint256 _overrideCount) public payable _onlyNotGameOver {
    bytes32 playerId = addressToId(_msgSender());
    // increase ships
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[OverrideSystem] Planet not found");
    require(planetData.empireId != EEmpire.NULL, "[OverrideSystem] Planet is not owned");
    uint256 cost = LibPrice.getTotalCost(EOverride.CreateShip, planetData.empireId, _overrideCount);

    LibOverride._purchaseOverride(playerId, EOverride.CreateShip, planetData.empireId, _overrideCount, _msgValue());

    Planet.setShipCount(_planetId, planetData.shipCount + _overrideCount);

    _refundOverspend(cost);
    _takeRake(cost);

    CreateShipOverrideLog.set(
      nextLogEntity(),
      CreateShipOverrideLogData({
        playerId: playerId,
        turn: Turn.getValue(),
        planetId: _planetId,
        ethSpent: cost,
        overrideCount: _overrideCount,
        timestamp: block.timestamp
      })
    );
  }
}
