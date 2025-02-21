// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { Planet, Turn, AirdropGoldOverrideLog, AirdropGoldOverrideLogData, P_GameConfig, P_PointConfig } from "codegen/index.sol";
import { EEmpire, EOverride } from "codegen/common.sol";
import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibOverride } from "libraries/LibOverride.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { addressToId, nextLogEntity, pseudorandom } from "src/utils.sol";

/**
 * @title OverrideAirdropSystem
 * @dev A contract that handles overrides related to airdropping gold to all planets owned by empire.
 */
contract OverrideAirdropSystem is EmpiresSystem {
  /**
   * @dev A player purchaseable override that airdrops gold to all planets owned by empire.
   * @param _empireId The ID of the empire.
   * @param _overrideCount The number of overrides to purchase.
   */
  function airdropGold(
    EEmpire _empireId,
    uint256 _overrideCount
  ) public payable _onlyNotGameOver _notDefeated(_empireId) {
    require(_empireId != EEmpire.NULL, "[OverrideSystem] Empire is not owned");
    uint256 cost = LibPrice.getTotalCost(EOverride.AirdropGold, _empireId, _overrideCount);
    require(_msgValue() >= cost, "[OverrideSystem] Insufficient payment");

    // get all planets owned by empire
    uint256 planetCount = EmpirePlanetsSet.size(_empireId);
    require(planetCount > 0, "[OverrideSystem] Empire has no planets");
    bytes32[] memory planetIds = EmpirePlanetsSet.getEmpirePlanetIds(_empireId);

    // get average planets owned per empire, excluding current empire
    uint256 goldToDistribute = _overrideCount * getAveragePlanetsPerOpposingEmpire(_empireId);

    LibOverride._purchaseOverride(addressToId(_msgSender()), EOverride.AirdropGold, _empireId, _overrideCount, cost);

    // evenly distribute gold to all planets owned by empire.
    uint256 goldToDistributePerPlanet = goldToDistribute / planetCount;
    uint256 goldToDistributeModulo = goldToDistribute % planetCount;

    // Generate a random starting index for gold distribution
    uint256 startIndex = pseudorandom(uint256(keccak256("EasterEgg: Smugglers")), planetCount);

    for (uint256 i = 0; i < planetCount; i++) {
      uint256 currentIndex = (startIndex + i) % planetCount;
      if (i < goldToDistributeModulo) {
        Planet.setGoldCount(
          planetIds[currentIndex],
          Planet.getGoldCount(planetIds[currentIndex]) + goldToDistributePerPlanet + 1
        );
      } else {
        Planet.setGoldCount(
          planetIds[currentIndex],
          Planet.getGoldCount(planetIds[currentIndex]) + goldToDistributePerPlanet
        );
      }
    }

    AirdropGoldOverrideLog.set(
      nextLogEntity(),
      AirdropGoldOverrideLogData({
        playerId: addressToId(_msgSender()),
        turn: Turn.getValue(),
        empireId: _empireId,
        goldDistributed: goldToDistribute,
        ethSpent: cost,
        overrideCount: _overrideCount,
        timestamp: block.timestamp
      })
    );

    _refundOverspend(cost);
    _takeRake(cost);
  }

  /**
   * @dev Get the average number of planets per opposing empire.
   * @param _empireId The ID of the empire.
   * @return The average number of planets per opposing empire.
   */
  function getAveragePlanetsPerOpposingEmpire(EEmpire _empireId) internal view returns (uint256) {
    uint256 survivingEmpireCount = 0;
    uint256 opposingPlanetCount = 0;
    uint8 empireCount = P_GameConfig.getEmpireCount();
    for (uint256 i = 1; i <= empireCount; i++) {
      if (i != uint256(_empireId)) {
        uint256 empirePlanetCount = EmpirePlanetsSet.size(EEmpire(i));
        if (empirePlanetCount > 0) {
          survivingEmpireCount++;
          opposingPlanetCount += empirePlanetCount;
        }
      }
    }
    // get average planet per opposing empire. Round up to the nearest whole number
    return (opposingPlanetCount + survivingEmpireCount - 1) / survivingEmpireCount;
  }
}
