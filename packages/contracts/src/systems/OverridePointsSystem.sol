// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { EEmpire } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibPoint } from "libraries/LibPoint.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { PlayersMap } from "adts/PlayersMap.sol";
import { EMPIRES_NAMESPACE_ID } from "src/constants.sol";
import { addressToId, pseudorandomEntity } from "src/utils.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { SellPointsOverrideLog, SellPointsOverrideLogData, Turn } from "codegen/index.sol";
import { Balances } from "@latticexyz/world/src/codegen/index.sol";

/**
 * @title OverridePointsSystem
 * @dev A contract that handles overrides related to creating and killing ships on a planet.
 */
contract OverridePointsSystem is EmpiresSystem {
  /**
   * @dev A player override to sell some points of an empire that they currently own.
   * @param _empire The empire to sell points from.
   * @param _points The number of points to sell.
   */
  function sellPoints(EEmpire _empire, uint256 _points) public _onlyNotGameOver {
    bytes32 playerId = addressToId(_msgSender());
    require(
      _points <= PointsMap.getValue(_empire, playerId) - PointsMap.getLockedPoints(_empire, playerId),
      "[OverrideSystem] Player does not have enough points to remove"
    );

    uint256 pointSaleValue = LibPrice.getPointSaleValue(_empire, _points);

    // require that the pot has enough ETH to send
    require(pointSaleValue <= Balances.get(EMPIRES_NAMESPACE_ID), "[OverrideSystem] Insufficient funds for point sale");

    // remove points from player and empire's issued points count
    LibPoint.removePoints(_empire, playerId, _points);

    // set the new empire point cost
    LibPrice.sellEmpirePointCostDown(_empire, _points);

    PlayersMap.setGain(playerId, PlayersMap.get(playerId).gain + pointSaleValue);

    // send eth to player
    IWorld(_world()).transferBalanceToAddress(EMPIRES_NAMESPACE_ID, _msgSender(), pointSaleValue);

    SellPointsOverrideLog.set(
      pseudorandomEntity(),
      SellPointsOverrideLogData({
        playerId: playerId,
        turn: Turn.getValue(),
        empireId: _empire,
        ethReceived: pointSaleValue,
        overrideCount: _points,
        timestamp: block.timestamp
      })
    );
  }
}
