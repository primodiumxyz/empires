// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { TacticalStrikeOverrideLog, TacticalStrikeOverrideLogData, BoostChargeOverrideLog, BoostChargeOverrideLogData, StunChargeOverrideLog, StunChargeOverrideLogData, Planet_TacticalStrikeData, Planet_TacticalStrike, P_TacticalStrikeConfig, P_OverrideConfig, MagnetTurnPlanets, Empire, P_MagnetConfig, PlaceMagnetOverrideLog, PlaceMagnetOverrideLogData, Magnet, MagnetData, Planet, PlanetData, Player, P_PointConfig, CreateShipOverrideLog, CreateShipOverrideLogData, KillShipOverrideLog, KillShipOverrideLogData, ChargeShieldsOverrideLog, ChargeShieldsOverrideLogData, DrainShieldsOverrideLog, DrainShieldsOverrideLogData } from "codegen/index.sol";
import { EEmpire, EOverride } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibPoint } from "libraries/LibPoint.sol";
import { LibMagnet } from "libraries/LibMagnet.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { EMPIRE_COUNT, EMPIRES_NAMESPACE_ID } from "src/constants.sol";
import { addressToId, pseudorandomEntity } from "src/utils.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { Balances } from "@latticexyz/world/src/codegen/index.sol";

/**
 * @title OverrideSystem
 * @dev A contract that handles overrides related to creating and killing ships on a planet.
 */
contract OverrideSystem is EmpiresSystem {
  /**
   * @dev Internal function to purchase a number of overrides.
   * @param _overrideType The type of override to purchase.
   * @param _empireImpacted The empire impacted by the override.
   * @param _overrideCount The number of overrides to purchase.
   * @param _spend The amount spent on the override.
   */
  function _purchaseOverride(
    EOverride _overrideType,
    EEmpire _empireImpacted,
    uint256 _overrideCount,
    uint256 _spend
  ) private {
    bytes32 playerId = addressToId(_msgSender());
    Player.setSpent(playerId, Player.getSpent(playerId) + _spend);
    uint256 pointUnit = P_PointConfig.getPointUnit();
    bool progressOverride = P_OverrideConfig.getIsProgressOverride(_overrideType);

    if (progressOverride) {
      uint256 numPoints = _overrideCount * (EMPIRE_COUNT - 1) * pointUnit;
      LibPoint.issuePoints(_empireImpacted, playerId, numPoints);
      LibPrice.pointCostUp(_empireImpacted, numPoints);
    } else {
      uint256 numPoints = _overrideCount * pointUnit;
      // Iterate through each empire except the impacted one
      for (uint256 i = 1; i < uint256(EEmpire.LENGTH); i++) {
        if (i == uint256(_empireImpacted)) {
          continue;
        }
        LibPoint.issuePoints(EEmpire(i), playerId, numPoints);
        LibPrice.pointCostUp(_empireImpacted, numPoints);
      }
    }
    LibPrice.overrideCostUp(_empireImpacted, _overrideType, _overrideCount);
  }

  /**
   * @dev A player purchaseable override that creates a ship on a planet.
   * @param _planetId The ID of the planet.
   * @param _overrideCount The number of overrides to purchase.
   */
  function createShip(
    bytes32 _planetId,
    uint256 _overrideCount
  ) public payable _onlyNotGameOver _takeRake _updateTacticalStrikeCharge(_planetId) {
    // increase ships
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[OverrideSystem] Planet not found");
    require(planetData.empireId != EEmpire.NULL, "[OverrideSystem] Planet is not owned");
    uint256 cost = LibPrice.getTotalCost(EOverride.CreateShip, planetData.empireId, _overrideCount);
    require(_msgValue() == cost, "[OverrideSystem] Incorrect payment");

    _purchaseOverride(EOverride.CreateShip, planetData.empireId, _overrideCount, _msgValue());

    Planet.setShipCount(_planetId, planetData.shipCount + _overrideCount);

    // increase tactical strike charge
    Planet_TacticalStrikeData memory planetTacticalStrikeData = Planet_TacticalStrike.get(_planetId);
    planetTacticalStrikeData.charge += P_TacticalStrikeConfig.getCreateShipBoostIncrease() * _overrideCount;
    Planet_TacticalStrike.set(_planetId, planetTacticalStrikeData);

    CreateShipOverrideLog.set(
      pseudorandomEntity(),
      CreateShipOverrideLogData({
        playerId: addressToId(_msgSender()),
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
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[OverrideSystem] Planet not found");
    require(planetData.shipCount >= _overrideCount, "[OverrideSystem] Not enough ships to kill");
    require(planetData.empireId != EEmpire.NULL, "[OverrideSystem] Planet is not owned");
    uint256 cost = LibPrice.getTotalCost(EOverride.KillShip, planetData.empireId, _overrideCount);
    require(_msgValue() == cost, "[OverrideSystem] Incorrect payment");

    _purchaseOverride(EOverride.KillShip, planetData.empireId, _overrideCount, _msgValue());

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
        playerId: addressToId(_msgSender()),
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
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[OverrideSystem] Planet not found");
    require(planetData.empireId != EEmpire.NULL, "[OverrideSystem] Planet is not owned");
    uint256 cost = LibPrice.getTotalCost(EOverride.ChargeShield, planetData.empireId, _overrideCount);
    require(_msgValue() == cost, "[OverrideSystem] Incorrect payment");

    _purchaseOverride(EOverride.ChargeShield, planetData.empireId, _overrideCount, _msgValue());

    Planet.setShieldCount(_planetId, planetData.shieldCount + _overrideCount);

    ChargeShieldsOverrideLog.set(
      pseudorandomEntity(),
      ChargeShieldsOverrideLogData({
        planetId: _planetId,
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
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[OverrideSystem] Planet not found");
    require(planetData.shieldCount >= _overrideCount, "[OverrideSystem] Not enough shields to drain");
    require(planetData.empireId != EEmpire.NULL, "[OverrideSystem] Planet is not owned");

    uint256 cost = LibPrice.getTotalCost(EOverride.DrainShield, planetData.empireId, _overrideCount);
    require(_msgValue() == cost, "[OverrideSystem] Incorrect payment");

    _purchaseOverride(EOverride.DrainShield, planetData.empireId, _overrideCount, _msgValue());

    Planet.setShieldCount(_planetId, planetData.shieldCount - _overrideCount);
    DrainShieldsOverrideLog.set(
      pseudorandomEntity(),
      DrainShieldsOverrideLogData({
        planetId: _planetId,
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
    _purchaseOverride(EOverride.PlaceMagnet, _empire, turnDuration, _msgValue());

    PlaceMagnetOverrideLog.set(
      pseudorandomEntity(),
      PlaceMagnetOverrideLogData({
        planetId: _planetId,
        ethSpent: cost,
        overrideCount: turnDuration,
        timestamp: block.timestamp
      })
    );
  }
  /* ----------------------------- Tactical Strike ---------------------------- */
  /**
   * @dev Updates the tactical strike countdown for a given planet.
   * @param _planetId The ID of the planet to update.
   * @notice This function calculates the progress of the tactical strike countdown based on the number of blocks elapsed since the last update.
   * @custom:effects
   *  - Increases the charge based on the time passed and the planet's charge rate.
   *  - Updates the lastUpdated timestamp to the current block number.
   */
  modifier _updateTacticalStrikeCharge(bytes32 _planetId) {
    Planet_TacticalStrikeData memory planetTacticalStrikeData = Planet_TacticalStrike.get(_planetId);
    uint256 blocksElapsed = block.number - planetTacticalStrikeData.lastUpdated;
    planetTacticalStrikeData.charge += (blocksElapsed * planetTacticalStrikeData.chargeRate) / 100;
    planetTacticalStrikeData.lastUpdated = block.number;
    Planet_TacticalStrike.set(_planetId, planetTacticalStrikeData);
    _;
  }

  function boostCharge(
    bytes32 _planetId,
    uint256 _boostCount
  ) public payable _onlyNotGameOver _takeRake _updateTacticalStrikeCharge(_planetId) {
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[OverrideSystem] Planet not found");
    require(planetData.empireId != EEmpire.NULL, "[OverrideSystem] Planet is not owned");

    uint256 cost = LibPrice.getTotalCost(EOverride.BoostCharge, planetData.empireId, _boostCount);
    require(_msgValue() == cost, "[OverrideSystem] Incorrect payment");

    _purchaseOverride(EOverride.BoostCharge, planetData.empireId, _boostCount, _msgValue());

    Planet_TacticalStrikeData memory planetTacticalStrikeData = Planet_TacticalStrike.get(_planetId);
    planetTacticalStrikeData.charge += P_TacticalStrikeConfig.getBoostChargeIncrease() * _boostCount;
    Planet_TacticalStrike.set(_planetId, planetTacticalStrikeData);
    BoostChargeOverrideLog.set(
      pseudorandomEntity(),
      BoostChargeOverrideLogData({
        planetId: _planetId,
        ethSpent: cost,
        boostCount: _boostCount,
        timestamp: block.timestamp
      })
    );
  }

  function stunCharge(
    bytes32 _planetId,
    uint256 _stunCount
  ) public payable _onlyNotGameOver _takeRake _updateTacticalStrikeCharge(_planetId) {
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[OverrideSystem] Planet not found");
    require(planetData.empireId != EEmpire.NULL, "[OverrideSystem] Planet is not owned");

    uint256 cost = LibPrice.getTotalCost(EOverride.StunCharge, planetData.empireId, _stunCount);
    require(_msgValue() == cost, "[OverrideSystem] Incorrect payment");

    _purchaseOverride(EOverride.StunCharge, planetData.empireId, _stunCount, _msgValue());

    Planet_TacticalStrikeData memory planetTacticalStrikeData = Planet_TacticalStrike.get(_planetId);
    uint256 stunDecrease = P_TacticalStrikeConfig.getStunChargeDecrease() * _stunCount;
    planetTacticalStrikeData.charge = planetTacticalStrikeData.charge > stunDecrease
      ? planetTacticalStrikeData.charge - stunDecrease
      : 0;
    Planet_TacticalStrike.set(_planetId, planetTacticalStrikeData);
    StunChargeOverrideLog.set(
      pseudorandomEntity(),
      StunChargeOverrideLogData({
        planetId: _planetId,
        ethSpent: cost,
        stunCount: _stunCount,
        timestamp: block.timestamp
      })
    );
  }
  /**
   * @dev Executes a tactical strike on a planet, setting its ship count to 0.
   * @notice This override is free and designed to be called by the keeper automatically when the countdown ends.
   * @param _planetId The ID of the planet to strike.
   * @custom:requirements The planet must exist and be in a valid tactical strike state.
   * @custom:effects Sets the planet's ship count to 0, resets the countdown, and logs the strike.
   */
  function tacticalStrike(bytes32 _planetId) public _updateTacticalStrikeCharge(_planetId) {
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[OverrideSystem] Planet not found");
    require(
      Planet_TacticalStrike.get(_planetId).charge >= P_TacticalStrikeConfig.getMaxCharge(),
      "[OverrideSystem] Planet is not ready for a tactical strike"
    );

    // Reset ship count to 0
    Planet.setShipCount(_planetId, 0);

    // Reset the tactical strike charge
    Planet_TacticalStrike.set(
      _planetId,
      Planet_TacticalStrikeData({ charge: 0, chargeRate: 100, lastUpdated: block.number })
    );
    // Log the tactical strike
    TacticalStrikeOverrideLog.set(
      pseudorandomEntity(),
      TacticalStrikeOverrideLogData({ planetId: _planetId, timestamp: block.timestamp })
    );
  }
}
