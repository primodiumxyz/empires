// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Planet, PlanetData, Player } from "codegen/index.sol";
import { EEmpire, EAction } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibPoint } from "libraries/LibPoint.sol";
import { POINTS_UNIT } from "src/constants.sol";
import { addressToId } from "src/utils.sol";

contract ActionSystem is System {
  function createDestroyer(bytes32 _planetId) public payable {
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[ActionSystem] Planet not found");
    require(planetData.factionId != EEmpire.NULL, "[ActionSystem] Planet is not owned");
    require(_msgValue() == LibPrice.getTotalCost(EAction.CreateDestroyer, planetData.factionId, true), "[ActionSystem] Incorrect payment");

    _purchaseAction(EAction.CreateDestroyer, planetData.factionId, true, _msgValue());

    Planet.setDestroyerCount(_planetId, planetData.destroyerCount + 1);
  }

  function killDestroyer(bytes32 _planetId) public payable {
    PlanetData memory planetData = Planet.get(_planetId);
    require(planetData.isPlanet, "[ActionSystem] Planet not found");
    require(planetData.destroyerCount > 0, "[ActionSystem] No destroyers to kill");
    require(planetData.factionId != EEmpire.NULL, "[ActionSystem] Planet is not owned");
    require(_msgValue() == LibPrice.getTotalCost(EAction.KillDestroyer, planetData.factionId, false), "[ActionSystem] Incorrect payment");

    _purchaseAction(EAction.KillDestroyer, planetData.factionId, false, _msgValue());

    Planet.setDestroyerCount(_planetId, planetData.destroyerCount - 1);
  }

  function _purchaseAction(EAction _actionType, EEmpire _empireImpacted, bool _progressAction, uint256 _spend) private {
    bytes32 playerId = addressToId(_msgSender());
    Player.setSpent(playerId, Player.getSpent(playerId) + _spend);

    if(_progressAction) {
      LibPoint.issuePoints(_empireImpacted, playerId, POINTS_UNIT*(uint256(EEmpire.LENGTH)-1));
      LibPrice.pointCostUp(_empireImpacted, uint256(EEmpire.LENGTH)-1);
    } else {
      // Iterate through each empire except the impacted one
      for(uint256 i = 0; i < uint256(EEmpire.LENGTH); i++) {
        if(i == uint256(_empireImpacted)) {
          continue;
        }
        LibPoint.issuePoints(EEmpire(i), playerId, POINTS_UNIT);
        LibPrice.pointCostUp(_empireImpacted, 1);
      }
    }
    LibPrice.actionCostUp(_empireImpacted, _actionType);
  }
}
