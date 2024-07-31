// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { StunChargeOverride, StunChargeOverrideData, BoostChargeOverride, BoostChargeOverrideData, Planet_TacticalStrikeData, Planet_TacticalStrike, TacticalStrikeOverride, TacticalStrikeOverrideData, P_TacticalStrikeConfig, Planet, PlanetData, Player, P_PointConfig, CreateShipOverride, CreateShipOverrideData, KillShipOverride, KillShipOverrideData, ChargeShieldsOverride, ChargeShieldsOverrideData, DrainShieldsOverride, DrainShieldsOverrideData } from "codegen/index.sol";
import { EEmpire, EOverride } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibPoint } from "libraries/LibPoint.sol";
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

    _purchaseOverride(EOverride.CreateShip, planetData.empireId, true, _overrideCount, _msgValue());

    Planet.setShipCount(_planetId, planetData.shipCount + _overrideCount);

    // increase tactical strike charge
    Planet_TacticalStrikeData memory planetTacticalStrikeData = Planet_TacticalStrike.get(_planetId);
    planetTacticalStrikeData.charge += P_TacticalStrikeConfig.getCreateShipBoostIncrease() * _overrideCount;
    Planet_TacticalStrike.set(_planetId, planetTacticalStrikeData);

    CreateShipOverride.set(
      pseudorandomEntity(),
      CreateShipOverrideData({
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

    _purchaseOverride(EOverride.KillShip, planetData.empireId, false, _overrideCount, _msgValue());

    Planet.setShipCount(_planetId, planetData.shipCount - _overrideCount);

    // decrease tactical strike charge
    Planet_TacticalStrikeData memory planetTacticalStrikeData = Planet_TacticalStrike.get(_planetId);
    uint256 killShipBoostCostDecrease = P_TacticalStrikeConfig.getKillShipBoostCostDecrease() * _overrideCount;
    planetTacticalStrikeData.charge = planetTacticalStrikeData.charge > killShipBoostCostDecrease
      ? planetTacticalStrikeData.charge - killShipBoostCostDecrease
      : 0;
    Planet_TacticalStrike.set(_planetId, planetTacticalStrikeData);

    KillShipOverride.set(
      pseudorandomEntity(),
      KillShipOverrideData({
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

    _purchaseOverride(EOverride.ChargeShield, planetData.empireId, true, _overrideCount, _msgValue());

    Planet.setShieldCount(_planetId, planetData.shieldCount + _overrideCount);

    ChargeShieldsOverride.set(
      pseudorandomEntity(),
      ChargeShieldsOverrideData({
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

    _purchaseOverride(EOverride.DrainShield, planetData.empireId, false, _overrideCount, _msgValue());

    Planet.setShieldCount(_planetId, planetData.shieldCount - _overrideCount);
    DrainShieldsOverride.set(
      pseudorandomEntity(),
      DrainShieldsOverrideData({
        planetId: _planetId,
        ethSpent: cost,
        overrideCount: _overrideCount,
        timestamp: block.timestamp
      })
    );
  }

  /**
   * @dev Internal function to purchase a number of overrides.
   * @param _overrideType The type of override to purchase.
   * @param _empireImpacted The empire impacted by the override.
   * @param _progressOverride Flag indicating if the override progressively or regressively impacts the empire.
   * @param _overrideCount The number of overrides to purchase.
   * @param _spend The amount spent on the override.
   */
  function _purchaseOverride(
    EOverride _overrideType,
    EEmpire _empireImpacted,
    bool _progressOverride,
    uint256 _overrideCount,
    uint256 _spend
  ) private {
    bytes32 playerId = addressToId(_msgSender());
    Player.setSpent(playerId, Player.getSpent(playerId) + _spend);
    uint256 pointUnit = P_PointConfig.getPointUnit();

    if (_progressOverride) {
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
   * @dev A player override to sell some points of an empire that they currently own.
   * @param _empire The empire to sell points from.
   * @param _points The number of points to sell.
   */
  function sellPoints(EEmpire _empire, uint256 _points) public {
    bytes32 playerId = addressToId(_msgSender());
    require(
      _points <= PointsMap.get(_empire, playerId),
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

    _purchaseOverride(EOverride.BoostCharge, planetData.empireId, false, _boostCount, _msgValue());

    Planet_TacticalStrikeData memory planetTacticalStrikeData = Planet_TacticalStrike.get(_planetId);
    planetTacticalStrikeData.charge += P_TacticalStrikeConfig.getBoostChargeIncrease() * _boostCount;
    Planet_TacticalStrike.set(_planetId, planetTacticalStrikeData);
    BoostChargeOverride.set(
      pseudorandomEntity(),
      BoostChargeOverrideData({
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

    _purchaseOverride(EOverride.StunCharge, planetData.empireId, false, _stunCount, _msgValue());

    Planet_TacticalStrikeData memory planetTacticalStrikeData = Planet_TacticalStrike.get(_planetId);
    uint256 stunDecrease = P_TacticalStrikeConfig.getStunChargeDecrease() * _stunCount;
    planetTacticalStrikeData.charge = planetTacticalStrikeData.charge > stunDecrease
      ? planetTacticalStrikeData.charge - stunDecrease
      : 0;
    Planet_TacticalStrike.set(_planetId, planetTacticalStrikeData);
    StunChargeOverride.set(
      pseudorandomEntity(),
      StunChargeOverrideData({ planetId: _planetId, ethSpent: cost, stunCount: _stunCount, timestamp: block.timestamp })
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
    TacticalStrikeOverride.set(
      pseudorandomEntity(),
      TacticalStrikeOverrideData({ planetId: _planetId, timestamp: block.timestamp })
    );
  }
}
