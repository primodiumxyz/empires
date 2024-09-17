// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Planet, P_AcidConfig, AcidDamageOverrideLog, AcidDamageOverrideLogData } from "codegen/index.sol";
import { pseudorandomEntity } from "src/utils.sol";

/**
 * @title LibAcid
 * @dev A library for managing acid in the Primodium Empires game.
 */
library LibAcid {
  /**
   * @notice Applies acid damage to a planet's ships
   * @param _planetId The ID of the planet to apply acid damage to
   */
  function applyAcidDamage(bytes32 _planetId) internal {
    uint256 initShips = Planet.getShipCount(_planetId);
    // Round down
    uint256 shipsRemaining = (initShips * (10000 - P_AcidConfig.getAcidDamagePercent())) / 10000;
    uint256 shipsDestroyed = initShips - shipsRemaining;
    Planet.setShipCount(_planetId, shipsRemaining);

    AcidDamageOverrideLog.set(
      pseudorandomEntity(),
      AcidDamageOverrideLogData({ planetId: _planetId, shipsDestroyed: shipsDestroyed, timestamp: block.timestamp })
    );
  }
}
