// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Balances } from "@latticexyz/world/src/codegen/index.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";

import { P_GameConfig, WinningEmpire, Empire, Planet } from "codegen/index.sol";
import { IWorld } from "codegen/world/IWorld.sol";

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { CitadelPlanetsSet } from "adts/CitadelPlanetsSet.sol";
import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";

import { PointsMap } from "adts/PointsMap.sol";
import { PlayersMap } from "adts/PlayersMap.sol";

import { EMPIRES_NAMESPACE_ID } from "src/constants.sol";
import { addressToId } from "src/utils.sol";
import { EEmpire } from "codegen/common.sol";

/**
 * @title RewardsSystem
 * @dev A contract that manages the rewards system for the Empires game.
 */
contract RewardsSystem is EmpiresSystem {
  /**
   * @dev Modifier that restricts the execution of a function to when the game is over.
   */
  modifier _onlyGameOver() {
    EEmpire winningEmpire = WinningEmpire.get();
    if (winningEmpire == EEmpire.NULL) {
      winningEmpire = _checkTimeVictory();
      if (winningEmpire == EEmpire.NULL) {
        winningEmpire = _checkDominationVictory();
      }
      require(winningEmpire != EEmpire.NULL, "[RewardsSystem] Game is not over");
      WinningEmpire.set(winningEmpire);
    }
    _;
  }

  /**
   * @dev Checks if the game has been won by domination.
   * @return winningEmpire The empire index that has won the game, or 0 if the game has not been won by domination.
   */
  function _checkDominationVictory() internal view returns (EEmpire) {
    bytes32[] memory citadelPlanets = CitadelPlanetsSet.getCitadelPlanetIds();
    if (citadelPlanets.length == 0) {
      return EEmpire.NULL;
    }
    EEmpire winningEmpire = Planet.getEmpireId(citadelPlanets[0]);
    if (winningEmpire == EEmpire.NULL) {
      return EEmpire.NULL;
    }

    for (uint256 i = 0; i < citadelPlanets.length; i++) {
      if (Planet.getEmpireId(citadelPlanets[i]) != winningEmpire) {
        return EEmpire.NULL;
      }
    }

    return winningEmpire;
  }

  /**
   * @dev Checks if the game has been won by the match running out of time.
   * @notice First condition is number of owned citadel planets. Second condition is number of all owned planets.
   * @return winningEmpire The empire index that has won the game, or 0 if the game has not been won by time.
   */
  function _checkTimeVictory() internal view returns (EEmpire) {
    uint256 endBlock = P_GameConfig.getGameOverBlock();
    if (endBlock == 0 || block.number <= endBlock) {
      return EEmpire.NULL;
    }

    bytes32[] memory citadelPlanets = CitadelPlanetsSet.getCitadelPlanetIds();
    uint8 empireCount = P_GameConfig.getEmpireCount();
    uint256[] memory citadelPlanetsPerEmpire = new uint256[](empireCount);
    for (uint256 i = 0; i < citadelPlanets.length; i++) {
      EEmpire empire = Planet.getEmpireId(citadelPlanets[i]);
      if (empire == EEmpire.NULL) continue;

      citadelPlanetsPerEmpire[uint8(empire) - 1]++;
    }

    EEmpire winningEmpire = EEmpire.NULL;
    uint256 maxCitadelPlanets = 0;
    for (uint8 i = 1; i <= empireCount; i++) {
      uint8 index = i - 1;
      EEmpire empire = EEmpire(i);
      uint256 currentPlanets = citadelPlanetsPerEmpire[index];
      if (currentPlanets > maxCitadelPlanets) {
        maxCitadelPlanets = currentPlanets;
        winningEmpire = EEmpire(empire);
      } else if (currentPlanets == maxCitadelPlanets) {
        if (EmpirePlanetsSet.size(EEmpire(empire)) > EmpirePlanetsSet.size(winningEmpire)) {
          winningEmpire = EEmpire(empire);
        } else if (EmpirePlanetsSet.size(empire) == EmpirePlanetsSet.size(winningEmpire)) {
          // todo: handle a tie of both the number of citadel planets and the number of planets. Likely overtime or most points issued.
          continue;
        }
      }
    }

    return winningEmpire;
  }

  /**
   * @dev Allows a player to withdraw their earnings.
   * This function can only be called when the game is over.
   */
  function withdrawEarnings() public _onlyGameOver {
    EEmpire winningEmpire = WinningEmpire.get();
    require(winningEmpire != EEmpire.NULL, "[RewardsSystem] No empire has won the game");

    bytes32 playerId = addressToId(_msgSender());

    uint256 empirePoints = Empire.getPointsIssued(winningEmpire);
    if (empirePoints == 0) {
      return;
    }

    uint256 playerEmpirePoints = PointsMap.getValue(winningEmpire, playerId) -
      PointsMap.getLockedPoints(winningEmpire, playerId);

    if (playerEmpirePoints == 0) return;

    uint256 pot = (Balances.get(EMPIRES_NAMESPACE_ID));
    uint256 playerPot = (pot * playerEmpirePoints) / empirePoints;

    PlayersMap.setGain(playerId, PlayersMap.get(playerId).gain + playerPot);
    IWorld(_world()).transferBalanceToAddress(EMPIRES_NAMESPACE_ID, _msgSender(), playerPot);

    PointsMap.remove(winningEmpire, playerId);
  }
}
