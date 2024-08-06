// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { TacticalStrikeOverrideLog, TacticalStrikeOverrideLogData, BoostChargeOverrideLog, BoostChargeOverrideLogData, StunChargeOverrideLog, StunChargeOverrideLogData, Planet_TacticalStrikeData, Planet_TacticalStrike, P_TacticalStrikeConfig, P_OverrideConfig, Empire, CreateShipOverrideLog, CreateShipOverrideLogData, KillShipOverrideLog, KillShipOverrideLogData, ChargeShieldsOverrideLog, ChargeShieldsOverrideLogData, DrainShieldsOverrideLog, DrainShieldsOverrideLogData, Magnet, Planet, PlanetData, P_PointConfig, PlaceMagnetOverrideLog, PlaceMagnetOverrideLogData } from "codegen/index.sol";
import { EEmpire, EOverride } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibPoint } from "libraries/LibPoint.sol";
import { LibOverride } from "libraries/LibOverride.sol";
import { LibMagnet } from "libraries/LibMagnet.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { EMPIRES_NAMESPACE_ID } from "src/constants.sol";
import { addressToId, pseudorandomEntity } from "src/utils.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { Balances } from "@latticexyz/world/src/codegen/index.sol";

/**
 * @title OverrideSystem
 * @dev A contract that handles overrides related to creating and killing ships on a planet.
 */
contract OverrideSystem is EmpiresSystem {
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
    require(planetData.empireId != EEmpire.NULL, "[OverrideSystem] Planet is not owned");
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
    require(planetData.empireId != EEmpire.NULL, "[OverrideSystem] Planet is not owned");
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
        planetId: _planetId,
        ethSpent: cost,
        overrideCount: _overrideCount,
        timestamp: block.timestamp
      })
    );
  }

  /**
   * @dev A player purchaseable override that increases the shield on a planet.
   * @param _planetId The ID of the planet.
   * @param _overrideCount The number of overrides to purchase.
   */
  function chargeShield(bytes32 _planetId, uint256 _overrideCount) public payable _onlyNotGameOver _takeRake {
    bytes32 playerId = addressToId(_msgSender());
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[OverrideSystem] Planet not found");
    require(planetData.empireId != EEmpire.NULL, "[OverrideSystem] Planet is not owned");
    uint256 cost = LibPrice.getTotalCost(EOverride.ChargeShield, planetData.empireId, _overrideCount);
    require(_msgValue() == cost, "[OverrideSystem] Incorrect payment");

    LibOverride._purchaseOverride(playerId, EOverride.ChargeShield, planetData.empireId, _overrideCount, _msgValue());

    Planet.setShieldCount(_planetId, planetData.shieldCount + _overrideCount);

    ChargeShieldsOverrideLog.set(
      pseudorandomEntity(),
      ChargeShieldsOverrideLogData({
        planetId: _planetId,
        playerId: playerId,
        ethSpent: cost,
        overrideCount: _overrideCount,
        timestamp: block.timestamp
      })
    );
  }

  /**
   * @dev A player purchaseable override that decreases the shield on a planet.
   * @param _planetId The ID of the planet.
   * @param _overrideCount The number of overrides to purchase.
   */
  function drainShield(bytes32 _planetId, uint256 _overrideCount) public payable _onlyNotGameOver _takeRake {
    bytes32 playerId = addressToId(_msgSender());
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[OverrideSystem] Planet not found");
    require(planetData.shieldCount >= _overrideCount, "[OverrideSystem] Not enough shields to drain");
    require(planetData.empireId != EEmpire.NULL, "[OverrideSystem] Planet is not owned");

    uint256 cost = LibPrice.getTotalCost(EOverride.DrainShield, planetData.empireId, _overrideCount);
    require(_msgValue() == cost, "[OverrideSystem] Incorrect payment");

    LibOverride._purchaseOverride(playerId, EOverride.DrainShield, planetData.empireId, _overrideCount, _msgValue());

    Planet.setShieldCount(_planetId, planetData.shieldCount - _overrideCount);
    DrainShieldsOverrideLog.set(
      pseudorandomEntity(),
      DrainShieldsOverrideLogData({
        planetId: _planetId,
        playerId: playerId,
        ethSpent: cost,
        overrideCount: _overrideCount,
        timestamp: block.timestamp
      })
    );
  }

  /**
   * @dev A player override to sell some points of an empire that they currently own.
   * @param _empire The empire to sell points from.
   * @param _points The number of points to sell.
   */
  function sellPoints(EEmpire _empire, uint256 _points) public {
    bytes32 playerId = addressToId(_msgSender());
    require(
      _points <= PointsMap.getValue(_empire, playerId) - PointsMap.getLockedPoints(_empire, playerId),
      "[OverrideSystem] Player does not have enough points to remove"
    );

    uint256 pointSaleValue = LibPrice.getPointSaleValue(_empire, _points);

    // require that the pot has enough ETH to send
    require(pointSaleValue <= Balances.get(EMPIRES_NAMESPACE_ID), "[OverrideSystem] Insufficient funds for point sale");

    // set the new empire point cost
    LibPrice.sellEmpirePointCostDown(_empire, _points);

    // remove points from player and empire's issued points count
    LibPoint.removePoints(_empire, playerId, _points);

    // send eth to player
    IWorld(_world()).transferBalanceToAddress(EMPIRES_NAMESPACE_ID, _msgSender(), pointSaleValue);
  }

  function placeMagnet(
    EEmpire _empire,
    bytes32 _planetId,
    uint256 turnDuration
  ) public payable _onlyNotGameOver _takeRake {
    bytes32 playerId = addressToId(_msgSender());

    require(Magnet.get(_empire, _planetId).isMagnet == false, "[OverrideSystem] Planet already has a magnet");
    uint256 cost = LibPrice.getTotalCost(EOverride.PlaceMagnet, _empire, turnDuration);
    require(_msgValue() == cost, "[OverrideSystem] Incorrect payment");

    LibMagnet.addMagnet(_empire, _planetId, playerId, turnDuration);
    LibOverride._purchaseOverride(addressToId(_msgSender()), EOverride.PlaceMagnet, _empire, turnDuration, _msgValue());

    PlaceMagnetOverrideLog.set(
      pseudorandomEntity(),
      PlaceMagnetOverrideLogData({
        planetId: _planetId,
        playerId: playerId,
        ethSpent: cost,
        overrideCount: turnDuration,
        timestamp: block.timestamp
      })
    );
  }
}
