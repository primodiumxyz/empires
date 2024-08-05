// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { TacticalStrikeOverrideLog, TacticalStrikeOverrideLogData, BoostChargeOverrideLog, BoostChargeOverrideLogData, StunChargeOverrideLog, StunChargeOverrideLogData, Planet_TacticalStrikeData, Planet_TacticalStrike, P_TacticalStrikeConfig, Planet, PlanetData } from "codegen/index.sol";
import { EEmpire, EOverride } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibOverride } from "libraries/LibOverride.sol";
import { pseudorandomEntity, addressToId } from "src/utils.sol";

/**
 * @title TacticalStrikeOverrideSystem
 * @dev A contract that handles overrides related to tactical strike.
 */
contract TacticalStrikeOverrideSystem is EmpiresSystem {
  function boostCharge(
    bytes32 _planetId,
    uint256 _boostCount
  ) public payable _onlyNotGameOver _takeRake _updateTacticalStrikeCharge(_planetId) {
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[TacticalStrikeOverrideSystem] Planet not found");
    require(planetData.empireId != EEmpire.NULL, "[TacticalStrikeOverrideSystem] Planet is not owned");

    uint256 cost = LibPrice.getTotalCost(EOverride.BoostCharge, planetData.empireId, _boostCount);
    require(_msgValue() == cost, "[TacticalStrikeOverrideSystem] Incorrect payment");

    LibOverride._purchaseOverride(
      addressToId(_msgSender()),
      EOverride.BoostCharge,
      planetData.empireId,
      _boostCount,
      _msgValue()
    );

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
    require(planetData.isPlanet, "[TacticalStrikeOverrideSystem] Planet not found");
    require(planetData.empireId != EEmpire.NULL, "[TacticalStrikeOverrideSystem] Planet is not owned");

    uint256 cost = LibPrice.getTotalCost(EOverride.StunCharge, planetData.empireId, _stunCount);
    require(_msgValue() == cost, "[TacticalStrikeOverrideSystem] Incorrect payment");

    LibOverride._purchaseOverride(
      addressToId(_msgSender()),
      EOverride.StunCharge,
      planetData.empireId,
      _stunCount,
      _msgValue()
    );

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
    require(planetData.isPlanet, "[TacticalStrikeOverrideSystem] Planet not found");
    require(
      Planet_TacticalStrike.get(_planetId).charge >= P_TacticalStrikeConfig.getMaxCharge(),
      "[TacticalStrikeOverrideSystem] Planet is not ready for a tactical strike"
    );

    // Reset ship count to 0
    Planet.setShipCount(_planetId, 0);

    // Reset the tactical strike charge
    Planet_TacticalStrike.set(
      _planetId,
      Planet_TacticalStrikeData({
        charge: 0,
        chargeRate: P_TacticalStrikeConfig.getChargeRate(),
        lastUpdated: block.number
      })
    );
    // Log the tactical strike
    TacticalStrikeOverrideLog.set(
      pseudorandomEntity(),
      TacticalStrikeOverrideLogData({ planetId: _planetId, timestamp: block.timestamp })
    );
  }
}
