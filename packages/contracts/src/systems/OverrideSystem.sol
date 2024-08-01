// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { MagnetEmpireEndTurnPlanets, Empire, P_MagnetConfig, PlaceMagnetOverrideLog, PlaceMagnetOverrideLogData, Magnet, MagnetData, Planet, PlanetData, Player, P_PointConfig, CreateShipOverrideLog, CreateShipOverrideLogData, KillShipOverrideLog, KillShipOverrideLogData, ChargeShieldsOverrideLog, ChargeShieldsOverrideLogData, DrainShieldsOverrideLog, DrainShieldsOverrideLogData } from "codegen/index.sol";
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
   * @dev A player purchaseable override that creates a ship on a planet.
   * @param _planetId The ID of the planet.
   * @param _overrideCount The number of overrides to purchase.
   */
  function createShip(bytes32 _planetId, uint256 _overrideCount) public payable _onlyNotGameOver _takeRake {
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[OverrideSystem] Planet not found");
    require(planetData.empireId != EEmpire.NULL, "[OverrideSystem] Planet is not owned");
    uint256 cost = LibPrice.getTotalCost(EOverride.CreateShip, planetData.empireId, _overrideCount);
    require(_msgValue() == cost, "[OverrideSystem] Incorrect payment");

    _purchaseOverride(EOverride.CreateShip, planetData.empireId, true, _overrideCount, _msgValue());

    Planet.setShipCount(_planetId, planetData.shipCount + _overrideCount);

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
  function killShip(bytes32 _planetId, uint256 _overrideCount) public payable _onlyNotGameOver _takeRake {
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[OverrideSystem] Planet not found");
    require(planetData.shipCount >= _overrideCount, "[OverrideSystem] Not enough ships to kill");
    require(planetData.empireId != EEmpire.NULL, "[OverrideSystem] Planet is not owned");
    uint256 cost = LibPrice.getTotalCost(EOverride.KillShip, planetData.empireId, _overrideCount);
    require(_msgValue() == cost, "[OverrideSystem] Incorrect payment");

    _purchaseOverride(EOverride.KillShip, planetData.empireId, false, _overrideCount, _msgValue());

    Planet.setShipCount(_planetId, planetData.shipCount - _overrideCount);
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

    _purchaseOverride(EOverride.ChargeShield, planetData.empireId, true, _overrideCount, _msgValue());

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

    _purchaseOverride(EOverride.DrainShield, planetData.empireId, false, _overrideCount, _msgValue());

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
    PlanetData memory planetData = Planet.get(_planetId);

    require(Magnet.get(_empire, _planetId).isMagnet == false, "[OverrideSystem] Planet already has a magnet");
    uint256 cost = LibPrice.getTotalCost(EOverride.PlaceMagnet, planetData.empireId, turnDuration);
    require(_msgValue() == cost, "[OverrideSystem] Incorrect payment");

    _purchaseOverride(EOverride.PlaceMagnet, planetData.empireId, false, turnDuration, _msgValue());
    LibMagnet.addMagnet(_empire, _planetId, playerId, turnDuration);

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
}
