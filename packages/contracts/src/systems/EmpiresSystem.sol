// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { NamespaceOwner } from "@latticexyz/world/src/codegen/tables/NamespaceOwner.sol";
import { Ready, P_GameConfig, P_PointConfig, WinningEmpire, Role, Empire, Planet } from "codegen/index.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";
import { EEmpire, ERole } from "codegen/common.sol";

import { CitadelPlanetsSet } from "adts/CitadelPlanetsSet.sol";
import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";
import { pseudorandom } from "src/utils.sol";

contract EmpiresSystem is System {
  modifier _onlyNotGameOver() {
    require(Ready.get(), "[EmpiresSystem] Game not ready");
    require(WinningEmpire.get() == EEmpire.NULL, "[EmpiresSystem] Game over");
    require(block.number >= P_GameConfig.getGameStartBlock(), "[EmpiresSystem] Game not started");
    require(_checkDominationVictory() == EEmpire.NULL, "[EmpiresSystem] Game over");
    uint256 endBlock = P_GameConfig.getGameOverBlock();
    require(endBlock == 0 || block.number < endBlock, "[EmpiresSystem] Game over");

    _;
  }

  // Modifier to restrict access to admin only
  modifier _onlyAdmin() {
    address sender = _msgSender();
    require(
      Role.get(sender) == ERole.Admin || NamespaceOwner.get(EMPIRES_NAMESPACE_ID) == sender,
      "[EmpiresSystem] Only admin"
    );
    _;
  }

  modifier _onlyAdminOrCanUpdate() {
    ERole role = Role.get(_msgSender());
    require(role == ERole.Admin || role == ERole.CanUpdate, "[EmpiresSystem] Only admin or can update");
    _;
  }

  modifier _notDefeated(EEmpire _empire) {
    require(!Empire.getIsDefeated(_empire), "[EmpiresSystem] Empire defeated");
    _;
  }

  /**
   * @dev Refunds the user if they send more than the expected cost.
   * @param _cost The expected cost of the transaction.
   * @notice Auditor: should this function be migrated and duplicated to all the Override systems and made private? Note how MUD handles System registration to a namespace.
   */
  function _refundOverspend(uint256 _cost) internal {
    uint256 msgValue = _msgValue();
    require(msgValue >= _cost, "[EmpiresSystem] Incorrect payment");
    if (msgValue > _cost) {
      IWorld(_world()).transferBalanceToAddress(EMPIRES_NAMESPACE_ID, _msgSender(), msgValue - _cost);
    }
  }

  /**
   * @dev Calculates and transfers the rake (fee) from the transaction cost.
   * @param _cost The total cost of the transaction.
   * @notice Auditor: should this function be migrated and duplicated to all the Override systems and made private? Note how MUD handles System registration to a namespace, such that new systems after deployment must be registered before they have any access to modify its state
   */
  function _takeRake(uint256 _cost) internal {
    uint256 rake = (_cost * P_PointConfig.getPointRake()) / 10_000;
    IWorld(_world()).transferBalanceToNamespace(EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID, rake);
  }

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
      require(winningEmpire != EEmpire.NULL, "[EmpiresSystem] Game is not over");
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
   * @dev Checks if the game has ended by the match running out of time, and sets the winning empire.
   * @notice First condition is number of owned citadel planets. Second condition is number of all owned planets. Third condition is number of points issued. Fourth condition is pseudorandom tiebreaker.
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
    uint256 pseudorandomWinner = 0; // used to handle ties, and not rerolling the winner prevents the Monty Hall problem
    for (uint8 i = 1; i <= empireCount; i++) {
      uint8 index = i - 1;
      EEmpire empire = EEmpire(i);
      uint256 currentPlanets = citadelPlanetsPerEmpire[index];
      uint256 pseudorandomCurrent = pseudorandom(uint256(empire), 1e18) + 1;
      if (currentPlanets > maxCitadelPlanets) {
        // most citadel planets
        maxCitadelPlanets = currentPlanets;
        winningEmpire = EEmpire(empire);
      } else if (currentPlanets == maxCitadelPlanets) {
        // same number of citadel planets, most planets
        if (EmpirePlanetsSet.size(empire) > EmpirePlanetsSet.size(winningEmpire)) {
          winningEmpire = EEmpire(empire);
        } else if (EmpirePlanetsSet.size(empire) == EmpirePlanetsSet.size(winningEmpire)) {
          // same number of citadel planets and planets, most points issued
          if (Empire.getPointsIssued(empire) > Empire.getPointsIssued(winningEmpire)) {
            winningEmpire = EEmpire(empire);
          } else if (Empire.getPointsIssued(empire) == Empire.getPointsIssued(winningEmpire)) {
            // pseudorandomly select winner
            if (pseudorandomCurrent > pseudorandomWinner) {
              winningEmpire = EEmpire(empire);
            }
          }
        }
      }

      if (winningEmpire == empire) {
        pseudorandomWinner = pseudorandomCurrent; // update pseudorandom winner to handle potential ties in future loops
      }
    }

    return winningEmpire;
  }
}
