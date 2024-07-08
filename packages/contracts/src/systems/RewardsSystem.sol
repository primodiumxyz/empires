// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Balances } from "@latticexyz/world/src/codegen/index.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";

import { P_PointConfig, P_GameConfig, WinningEmpire, Player, RakeTaken, Faction } from "codegen/index.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { EEmpire } from "codegen/common.sol";

import { EmpiresSystem } from "systems/EmpiresSystem.sol";

import { PointsMap } from "adts/PointsMap.sol";

import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";
import { addressToId } from "src/utils.sol";

contract RewardsSystem is EmpiresSystem {
  modifier _onlyGameOver() {
    uint256 endBlock = P_GameConfig.getGameOverBlock();
    require(endBlock > 0 && block.number > endBlock, "[RewardsSystem] Game is not over");
    _;
  }

  function claimVictory(EEmpire empire) public _onlyGameOver {
    // todo: victory condition

    WinningEmpire.set(empire);
  }

  function _takeRake(ResourceId namespace) private {
    if (RakeTaken.get()) return;

    uint256 pot = Balances.get(namespace);
    uint256 rake = (pot * P_PointConfig.getPointRake()) / 10_000;

    IWorld(_world()).transferBalanceToNamespace(
      namespace,
      WorldResourceIdLib.encodeNamespace(ADMIN_NAMESPACE_ID),
      rake
    );
    RakeTaken.set(true);
  }

  function withdrawEarnings() public _onlyGameOver {
    EEmpire empire = WinningEmpire.get();
    require(empire != EEmpire.NULL, "[RewardsSystem] No empire has won the game");

    bytes32 playerId = addressToId(_msgSender());

    uint256 factionPoints = Faction.getPointsIssued(empire);
    if (factionPoints == 0) {
      return;
    }

    ResourceId empiresNamespaceId = WorldResourceIdLib.encodeNamespace(EMPIRES_NAMESPACE_ID);

    _takeRake(empiresNamespaceId);

    uint256 playerFactionPoints = PointsMap.get(empire, playerId);

    uint256 playerPotPctTimes10000 = (playerFactionPoints * 10_000) / factionPoints;

    uint256 pot = (Balances.get(empiresNamespaceId));

    uint256 playerPot = (pot * playerPotPctTimes10000) / (10_000);

    IWorld(_world()).transferBalanceToAddress(empiresNamespaceId, _msgSender(), playerPot);

    PointsMap.remove(empire, playerId);
  }
}
