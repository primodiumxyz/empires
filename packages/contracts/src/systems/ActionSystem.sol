// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { Planet, PlanetData, Player, P_PointConfig } from "codegen/index.sol";
import { EEmpire, EPlayerAction } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibPoint } from "libraries/LibPoint.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { EMPIRE_COUNT, EMPIRES_NAMESPACE_ID } from "src/constants.sol";
import { addressToId } from "src/utils.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { Balances } from "@latticexyz/world/src/codegen/index.sol";


/**
 * @title ActionSystem
 * @dev A contract that handles actions related to creating and killing destroyers on a planet.
 */
contract ActionSystem is EmpiresSystem {
  /**
   * @dev A player purchaseable action that creates a destroyer on a planet.
   * @param _planetId The ID of the planet.
   */
  function createDestroyer(bytes32 _planetId) public payable _onlyNotGameOver _takeRake {
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[ActionSystem] Planet not found");
    require(planetData.factionId != EEmpire.NULL, "[ActionSystem] Planet is not owned");
    require(
      _msgValue() == LibPrice.getTotalCost(EPlayerAction.CreateDestroyer, planetData.factionId, true),
      "[ActionSystem] Incorrect payment"
    );

    _purchaseAction(EPlayerAction.CreateDestroyer, planetData.factionId, true, _msgValue());

    Planet.setDestroyerCount(_planetId, planetData.destroyerCount + 1);
  }

  /**
   * @dev A player purchaseable action that kills a destroyer on a planet.
   * @param _planetId The ID of the planet.
   */
  function killDestroyer(bytes32 _planetId) public payable _onlyNotGameOver _takeRake {
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[ActionSystem] Planet not found");
    require(planetData.destroyerCount > 0, "[ActionSystem] No destroyers to kill");
    require(planetData.factionId != EEmpire.NULL, "[ActionSystem] Planet is not owned");
    require(
      _msgValue() == LibPrice.getTotalCost(EPlayerAction.KillDestroyer, planetData.factionId, false),
      "[ActionSystem] Incorrect payment"
    );

    _purchaseAction(EPlayerAction.KillDestroyer, planetData.factionId, false, _msgValue());

    Planet.setDestroyerCount(_planetId, planetData.destroyerCount - 1);
  }

  /**
   * @dev Internal function to purchase an action.
   * @param _actionType The type of action to purchase.
   * @param _empireImpacted The empire impacted by the action.
   * @param _progressAction Flag indicating if the action progressively or regressively impacts the empire.
   * @param _spend The amount spent on the action.
   */
  function _purchaseAction(
    EPlayerAction _actionType,
    EEmpire _empireImpacted,
    bool _progressAction,
    uint256 _spend
  ) private {
    bytes32 playerId = addressToId(_msgSender());
    Player.setSpent(playerId, Player.getSpent(playerId) + _spend);
    uint256 pointUnit = P_PointConfig.getPointUnit();

    if (_progressAction) {
      LibPoint.issuePoints(_empireImpacted, playerId, pointUnit * (EMPIRE_COUNT - 1));
      LibPrice.pointCostUp(_empireImpacted, EMPIRE_COUNT - 1);
    } else {
      // Iterate through each empire except the impacted one
      for (uint256 i = 1; i < uint256(EEmpire.LENGTH); i++) {
        if (i == uint256(_empireImpacted)) {
          continue;
        }
        LibPoint.issuePoints(EEmpire(i), playerId, pointUnit);
        LibPrice.pointCostUp(_empireImpacted, 1);
      }
    }
    LibPrice.actionCostUp(_empireImpacted, _actionType);
  }

  /**
   * @dev A player action to sell some points of an empire that they currently own.
   * @param _empire The empire to sell points from.
   * @param _pointsUnscaled The number of points to sell.
   */
  function sellPoints(EEmpire _empire, uint256 _pointsUnscaled) public {
    bytes32 playerId = addressToId(_msgSender());
    uint256 pointsScaled = _pointsUnscaled * P_PointConfig.getPointUnit();
    require(pointsScaled <= PointsMap.get(_empire, playerId), "[ActionSystem] Player does not have enough points to remove");

    uint256 pointSaleValue = LibPrice.getPointSaleValue(_empire, _pointsUnscaled);

    // require that the pot has enough ETH to send
    require(pointSaleValue <= Balances.get(EMPIRES_NAMESPACE_ID), "[ActionSystem] Insufficient funds for point sale");

    // set the new empire point cost
    LibPrice.sellEmpirePointCostDown(_empire, _pointsUnscaled);

    // remove points from player and empire's issued points count
    LibPoint.removePoints(_empire, playerId, pointsScaled);

    // send eth to player
    IWorld(_world()).transferBalanceToAddress(EMPIRES_NAMESPACE_ID, _msgSender(), pointSaleValue);
  }
}
