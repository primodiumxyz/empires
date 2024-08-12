// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { Turn, TacticalStrikeOverrideLog, TacticalStrikeOverrideLogData, BoostChargeOverrideLog, BoostChargeOverrideLogData, StunChargeOverrideLog, StunChargeOverrideLogData, Planet_TacticalStrikeData, Planet_TacticalStrike, P_TacticalStrikeConfig, P_OverrideConfig, Empire, CreateShipOverrideLog, CreateShipOverrideLogData, KillShipOverrideLog, KillShipOverrideLogData, ChargeShieldsOverrideLog, ChargeShieldsOverrideLogData, DrainShieldsOverrideLog, DrainShieldsOverrideLogData, Magnet, Planet, PlanetData, P_PointConfig, PlaceMagnetOverrideLog, PlaceMagnetOverrideLogData } from "codegen/index.sol";
import { EOverride } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibPoint } from "libraries/LibPoint.sol";
import { LibOverride } from "libraries/LibOverride.sol";
import { LibMagnet } from "libraries/LibMagnet.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { PlayersMap } from "adts/PlayersMap.sol";
import { EMPIRES_NAMESPACE_ID } from "src/constants.sol";
import { addressToId, pseudorandomEntity } from "src/utils.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { Balances } from "@latticexyz/world/src/codegen/index.sol";

/**
 * @title OverrideSystem
 * @dev A contract that handles overrides related to creating and killing ships on a planet.
 */
contract OverrideShipSystem is EmpiresSystem {
  /**
   * @dev A player purchaseable override that creates a ship on a planet.
   * @param _planetId The ID of the planet.
   * @param _overrideCount The number of overrides to purchase.
   */
  function createShip(
    bytes32 _planetId,
    uint256 _overrideCount
  ) public payable _onlyNotGameOver _takeRake _updateTacticalStrikeCharge(_planetId) {
    bytes32 playerId = addressToId(_msgSender());
    // increase ships
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[OverrideSystem] Planet not found");
    require(planetData.empireId != 0, "[OverrideSystem] Planet is not owned");
    uint256 cost = LibPrice.getTotalCost(EOverride.CreateShip, planetData.empireId, _overrideCount);
    require(_msgValue() == cost, "[OverrideSystem] Incorrect payment");

    LibOverride._purchaseOverride(playerId, EOverride.CreateShip, planetData.empireId, _overrideCount, _msgValue());

    Planet.setShipCount(_planetId, planetData.shipCount + _overrideCount);

    // increase tactical strike charge
    Planet_TacticalStrikeData memory planetTacticalStrikeData = Planet_TacticalStrike.get(_planetId);
    planetTacticalStrikeData.charge += P_TacticalStrikeConfig.getCreateShipBoostIncrease() * _overrideCount;
    Planet_TacticalStrike.set(_planetId, planetTacticalStrikeData);

    CreateShipOverrideLog.set(
      pseudorandomEntity(),
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

  /**
   * @dev A player purchaseable override that kills a ship on a planet.
   * @param _planetId The ID of the planet.
   * @param _overrideCount The number of overrides to purchase.
   */
  function killShip(
    bytes32 _planetId,
    uint256 _overrideCount
  ) public payable _onlyNotGameOver _takeRake _updateTacticalStrikeCharge(_planetId) {
    // decrease ship count
    bytes32 playerId = addressToId(_msgSender());
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[OverrideSystem] Planet not found");
    require(planetData.shipCount >= _overrideCount, "[OverrideSystem] Not enough ships to kill");
    require(planetData.empireId != 0, "[OverrideSystem] Planet is not owned");
    uint256 cost = LibPrice.getTotalCost(EOverride.KillShip, planetData.empireId, _overrideCount);
    require(_msgValue() == cost, "[OverrideSystem] Incorrect payment");

    LibOverride._purchaseOverride(playerId, EOverride.KillShip, planetData.empireId, _overrideCount, _msgValue());

    Planet.setShipCount(_planetId, planetData.shipCount - _overrideCount);

    // decrease tactical strike charge
    Planet_TacticalStrikeData memory planetTacticalStrikeData = Planet_TacticalStrike.get(_planetId);
    uint256 killShipBoostCostDecrease = P_TacticalStrikeConfig.getKillShipBoostCostDecrease() * _overrideCount;
    planetTacticalStrikeData.charge = planetTacticalStrikeData.charge > killShipBoostCostDecrease
      ? planetTacticalStrikeData.charge - killShipBoostCostDecrease
      : 0;
    Planet_TacticalStrike.set(_planetId, planetTacticalStrikeData);

    KillShipOverrideLog.set(
      pseudorandomEntity(),
      KillShipOverrideLogData({
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
