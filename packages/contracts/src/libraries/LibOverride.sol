// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EEmpire, EOverride } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { LibPoint } from "libraries/LibPoint.sol";
import { addressToId } from "src/utils.sol";
import { PlayersMap } from "adts/PlayersMap.sol";
import { P_PointConfig, P_OverrideConfig, P_GameConfig } from "codegen/index.sol";

/**
 * @title OverrideSystem
 * @dev A contract that handles overrides related to creating and killing ships on a planet.
 */
library LibOverride {
  /**
   * @dev Internal function to purchase a number of overrides.
   * @param _overrideType The type of override to purchase.
   * @param _empireImpacted The empire impacted by the override.
   * @param _overrideCount The number of overrides to purchase.
   * @param _spend The amount spent on the override.
   */
  function _purchaseOverride(
    bytes32 playerId,
    EOverride _overrideType,
    EEmpire _empireImpacted,
    uint256 _overrideCount,
    uint256 _spend
  ) internal {
    PlayersMap.setLoss(playerId, PlayersMap.get(playerId).loss + _spend);
    uint256 pointUnit = P_PointConfig.getPointUnit();
    uint8 empireCount = P_GameConfig.getEmpireCount();
    bool progressOverride = P_OverrideConfig.getIsProgressOverride(_overrideType);
    uint256 pointMultiplier = P_PointConfig.getPointMultiplier();

    if (progressOverride) {
      uint256 numPoints = _overrideCount * (empireCount - 1) * pointUnit * pointMultiplier;
      LibPoint.issuePoints(_empireImpacted, playerId, numPoints);
      LibPrice.pointCostUp(_empireImpacted, numPoints);
    } else {
      uint256 numPoints = _overrideCount * pointUnit * pointMultiplier;
      // Iterate through each empire except the impacted one
      for (uint8 i = 1; i <= empireCount; i++) {
        if (EEmpire(i) == _empireImpacted) {
          continue;
        }
        LibPoint.issuePoints(EEmpire(i), playerId, numPoints);
        LibPrice.pointCostUp(EEmpire(i), numPoints);
      }
    }
    LibPrice.overrideCostUp(_empireImpacted, _overrideType, _overrideCount);
  }
}
