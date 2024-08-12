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

/**
 * @title RewardsSystem
 * @dev A contract that manages the rewards system for the Empires game.
 */
contract RewardsSystem is EmpiresSystem {
  /**
   * @dev Modifier that restricts the execution of a function to when the game is over.
   */
  modifier _onlyGameOver() {
    uint8 winningEmpire = WinningEmpire.get();
    if (winningEmpire == 0) {
      winningEmpire = _checkTimeVictory();
      if (winningEmpire == 0) {
        winningEmpire = _checkDominationVictory();
      }
      require(winningEmpire != 0, "[RewardsSystem] Game is not over");
      WinningEmpire.set(winningEmpire);
    }
    _;
  }

  /**
   * @dev Checks if the game has been won by domination.
   * @return winningEmpire The empire index that has won the game, or 0 if the game has not been won by domination.
   */
  function _checkDominationVictory() internal view returns (uint8) {
    bytes32[] memory citadelPlanets = CitadelPlanetsSet.getCitadelPlanetIds();
    if (citadelPlanets.length == 0) {
      return 0;
    }
    uint8 winningEmpire = Planet.getEmpireId(citadelPlanets[0]);
    if (winningEmpire == 0) {
      return 0;
    }

    for (uint256 i = 0; i < citadelPlanets.length; i++) {
      if (Planet.getEmpireId(citadelPlanets[i]) != winningEmpire) {
        return 0;
      }
    }

    return winningEmpire;
  }

  /**
   * @dev Checks if the game has been won by the match running out of time.
   * @notice First condition is number of owned citadel planets. Second condition is number of all owned planets.
   * @return winningEmpire The empire index that has won the game, or 0 if the game has not been won by time.
   */
  function _checkTimeVictory() internal view returns (uint8) {
    uint256 endBlock = P_GameConfig.getGameOverBlock();
    if (endBlock == 0 || block.number <= endBlock) {
      return 0;
    }

    bytes32[] memory citadelPlanets = CitadelPlanetsSet.getCitadelPlanetIds();
    uint8 empireCount = P_GameConfig.getEmpireCount();
    uint256[] memory citadelPlanetsPerEmpire = new uint256[](empireCount);
    for (uint256 i = 0; i < citadelPlanets.length; i++) {
      uint8 empire = Planet.getEmpireId(citadelPlanets[i]);
      if (empire == 0) continue;

      citadelPlanetsPerEmpire[empire - 1]++;
    }

    uint8 winningEmpire = 0;
    uint256 maxCitadelPlanets = 0;
    for (uint8 empire = 1; empire <= empireCount; empire++) {
      uint8 index = empire - 1;
      uint256 citadelPlanets = citadelPlanetsPerEmpire[index];
      if (citadelPlanets > maxCitadelPlanets) {
        maxCitadelPlanets = citadelPlanets;
        winningEmpire = empire;
      } else if (citadelPlanets == maxCitadelPlanets) {
        if (EmpirePlanetsSet.size(empire) > EmpirePlanetsSet.size(winningEmpire)) {
          winningEmpire = empire;
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
    uint8 winningEmpire = WinningEmpire.get();
    require(winningEmpire != 0, "[RewardsSystem] No empire has won the game");

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
