// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { P_ActionConfig, Planet, PlanetData, Player, P_PointConfig, CreateShipPlayerAction, CreateShipPlayerActionData, KillShipPlayerAction, KillShipPlayerActionData, ChargeShieldsPlayerAction, ChargeShieldsPlayerActionData, DrainShieldsPlayerAction, DrainShieldsPlayerActionData } from "codegen/index.sol";
import { EEmpire, EPlayerAction } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibPoint } from "libraries/LibPoint.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { EMPIRE_COUNT, EMPIRES_NAMESPACE_ID } from "src/constants.sol";
import { addressToId, pseudorandomEntity } from "src/utils.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { Balances } from "@latticexyz/world/src/codegen/index.sol";

/**
 * @title ActionSystem
 * @dev A contract that handles actions related to creating and killing ships on a planet.
 */
contract ActionSystem is EmpiresSystem {
  /**
   * @dev A player purchaseable action that creates a ship on a planet.
   * @param _planetId The ID of the planet.
   * @param _actionCount The number of actions to purchase.
   */
  function createShip(bytes32 _planetId, uint256 _actionCount) public payable _onlyNotGameOver _takeRake {
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[ActionSystem] Planet not found");
    require(planetData.empireId != EEmpire.NULL, "[ActionSystem] Planet is not owned");
    uint256 cost = LibPrice.getTotalCost(EPlayerAction.CreateShip, planetData.empireId, true, _actionCount);
    require(_msgValue() == cost, "[ActionSystem] Incorrect payment");

    _purchaseAction(EPlayerAction.CreateShip, planetData.empireId, true, _actionCount, _msgValue());

    Planet.setShipCount(_planetId, planetData.shipCount + _actionCount);

    CreateShipPlayerAction.set(
      pseudorandomEntity(),
      CreateShipPlayerActionData({
        playerId: addressToId(_msgSender()),
        planetId: _planetId,
        ethSpent: cost,
        actionCount: _actionCount,
        timestamp: block.timestamp
      })
    );
  }

  /**
   * @dev A player purchaseable action that kills a ship on a planet.
   * @param _planetId The ID of the planet.
   */
  function killShip(bytes32 _planetId) public payable _onlyNotGameOver _takeRake {
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[ActionSystem] Planet not found");
    require(planetData.shipCount > 0, "[ActionSystem] No ships to kill");
    require(planetData.empireId != EEmpire.NULL, "[ActionSystem] Planet is not owned");
    uint256 cost = LibPrice.getTotalCost(EPlayerAction.KillShip, planetData.empireId, false, 1);
    require(_msgValue() == cost, "[ActionSystem] Incorrect payment");

    _purchaseAction(EPlayerAction.KillShip, planetData.empireId, false, 1, _msgValue());

    uint256 newShipCount = (planetData.shipCount * P_ActionConfig.getReductionPct()) / 10000;
    Planet.setShipCount(_planetId, newShipCount);
    KillShipPlayerAction.set(
      pseudorandomEntity(),
      KillShipPlayerActionData({
        playerId: addressToId(_msgSender()),
        planetId: _planetId,
        ethSpent: cost,
        actionCount: 1,
        timestamp: block.timestamp
      })
    );
  }

  /**
   * @dev A player purchaseable action that increases the shield on a planet.
   * @param _planetId The ID of the planet.
   * @param _actionCount The number of actions to purchase.
   */
  function chargeShield(bytes32 _planetId, uint256 _actionCount) public payable _onlyNotGameOver _takeRake {
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[ActionSystem] Planet not found");
    require(planetData.empireId != EEmpire.NULL, "[ActionSystem] Planet is not owned");
    uint256 cost = LibPrice.getTotalCost(EPlayerAction.ChargeShield, planetData.empireId, true, _actionCount);
    require(_msgValue() == cost, "[ActionSystem] Incorrect payment");

    _purchaseAction(EPlayerAction.ChargeShield, planetData.empireId, true, _actionCount, _msgValue());

    Planet.setShieldCount(_planetId, planetData.shieldCount + _actionCount);

    ChargeShieldsPlayerAction.set(
      pseudorandomEntity(),
      ChargeShieldsPlayerActionData({ planetId: _planetId, ethSpent: cost, actionCount: _actionCount, timestamp: block.timestamp })
    );
  }

  /**
   * @dev A player purchaseable action that decreases the shield on a planet.
   * @param _planetId The ID of the planet.
   */
  function drainShield(bytes32 _planetId) public payable _onlyNotGameOver _takeRake {
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[ActionSystem] Planet not found");
    require(planetData.shieldCount > 0, "[ActionSystem] No shields to drain");
    require(planetData.empireId != EEmpire.NULL, "[ActionSystem] Planet is not owned");

    uint256 cost = LibPrice.getTotalCost(EPlayerAction.DrainShield, planetData.empireId, false, 1);
    require(_msgValue() == cost, "[ActionSystem] Incorrect payment");

    _purchaseAction(EPlayerAction.DrainShield, planetData.empireId, false, 1, _msgValue());

    uint256 newShieldCount = (planetData.shieldCount * P_ActionConfig.getReductionPct()) / 10000;
    Planet.setShieldCount(_planetId, newShieldCount);
    DrainShieldsPlayerAction.set(
      pseudorandomEntity(),
      DrainShieldsPlayerActionData({ planetId: _planetId, ethSpent: cost, actionCount: 1, timestamp: block.timestamp })
    );
  }

  /**
   * @dev Internal function to purchase a number of actions.
   * @param _actionType The type of action to purchase.
   * @param _empireImpacted The empire impacted by the action.
   * @param _progressAction Flag indicating if the action progressively or regressively impacts the empire.
   * @param _actionCount The number of actions to purchase.
   * @param _spend The amount spent on the action.
   */
  function _purchaseAction(
    EPlayerAction _actionType,
    EEmpire _empireImpacted,
    bool _progressAction,
    uint256 _actionCount,
    uint256 _spend
  ) private {
    bytes32 playerId = addressToId(_msgSender());
    Player.setSpent(playerId, Player.getSpent(playerId) + _spend);
    uint256 pointUnit = P_PointConfig.getPointUnit();

    if (_progressAction) {
      uint256 numPoints = _actionCount * (EMPIRE_COUNT - 1) * pointUnit;
      LibPoint.issuePoints(_empireImpacted, playerId, numPoints);
      LibPrice.pointCostUp(_empireImpacted, numPoints);
    } else {
      uint256 numPoints = _actionCount * pointUnit;
      // Iterate through each empire except the impacted one
      for (uint256 i = 1; i < uint256(EEmpire.LENGTH); i++) {
        if (i == uint256(_empireImpacted)) {
          continue;
        }
        LibPoint.issuePoints(EEmpire(i), playerId, numPoints);
        LibPrice.pointCostUp(_empireImpacted, numPoints);
      }
    }
    LibPrice.actionCostUp(_empireImpacted, _actionType, _actionCount);
  }

  /**
   * @dev A player action to sell some points of an empire that they currently own.
   * @param _empire The empire to sell points from.
   * @param _points The number of points to sell.
   */
  function sellPoints(EEmpire _empire, uint256 _points) public {
    bytes32 playerId = addressToId(_msgSender());
    require(_points <= PointsMap.get(_empire, playerId), "[ActionSystem] Player does not have enough points to remove");

    uint256 pointSaleValue = LibPrice.getPointSaleValue(_empire, _points);

    // require that the pot has enough ETH to send
    require(pointSaleValue <= Balances.get(EMPIRES_NAMESPACE_ID), "[ActionSystem] Insufficient funds for point sale");

    // set the new empire point cost
    LibPrice.sellEmpirePointCostDown(_empire, _points);

    // remove points from player and empire's issued points count
    LibPoint.removePoints(_empire, playerId, _points);

    // send eth to player
    IWorld(_world()).transferBalanceToAddress(EMPIRES_NAMESPACE_ID, _msgSender(), pointSaleValue);
  }
}
