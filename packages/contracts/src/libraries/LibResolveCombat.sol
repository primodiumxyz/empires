// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Arrivals } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";

library LibResolveCombat {
  function resolveCombat(EEmpire empire, bytes32 planetId) internal {
    uint256 arrivingDestroyers = Arrivals.get(planetId);
    if (arrivingDestroyers == 0) return;

    PlanetData memory planetData = Planet.get(planetId);
    if (empire == planetData.factionId)
      Planet.setDestroyerCount(planetId, planetData.destroyerCount + arrivingDestroyers);
    else {
      bool conquer = planetData.destroyerCount < arrivingDestroyers;

      uint256 remainingDestroyers = conquer
        ? arrivingDestroyers - planetData.destroyerCount
        : planetData.destroyerCount - arrivingDestroyers;

      if (conquer) {
        Planet.setFactionId(planetId, empire);
      }

      Planet.setDestroyerCount(planetId, remainingDestroyers);
    }
  }
}
