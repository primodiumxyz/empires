// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { ShieldEater, P_ShieldEaterConfig, Planet, PlanetData, ShieldEaterDamageOverrideLog, ShieldEaterDamageOverrideLogData } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EDirection, EShieldEaterDamageType } from "codegen/common.sol";

import { pseudorandom, nextLogEntity, coordToId } from "src/utils.sol";
import { CoordData } from "src/Types.sol";

import { console } from "forge-std/console.sol";

/**
 * @title LibShieldEater
 * @dev A library for managing Shield Eater Event and Override in the Primodium Empires game.
 */
library LibShieldEater {
  /**
   * @dev Randomly selects a starting planet for the Shield Eater.
   */
  function initialize() internal {
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    uint256 randomIndex = pseudorandom(block.number, planetIds.length);
    ShieldEater.setCurrentPlanet(planetIds[randomIndex]);
    ShieldEater.setCurrentCharge(0);
    ShieldEater.setRetargetPending(true);
  }

  /**
   * @dev Moves the Shield Eater to the next planet en route to the destination planet.
   */
  function update(bytes32 shieldEaterNextPlanetId) internal {
    if (ShieldEater.getCurrentPlanet() != shieldEaterNextPlanetId) {
      ShieldEater.setCurrentPlanet(shieldEaterNextPlanetId);

      // Eat a little shields if there are any
      uint256 shieldCount = Planet.getShieldCount(shieldEaterNextPlanetId);
      uint256 shieldDamage = P_ShieldEaterConfig.getVisitShieldDamage();
      uint256 addCharge = 1;
      if (shieldCount > shieldDamage) {
        Planet.setShieldCount(shieldEaterNextPlanetId, shieldCount - shieldDamage);
        addCharge += shieldDamage;
        ShieldEaterDamageOverrideLog.set(
          nextLogEntity(),
          ShieldEaterDamageOverrideLogData({
            planetId: shieldEaterNextPlanetId,
            shieldsDestroyed: shieldDamage,
            damageType: EShieldEaterDamageType.Eat,
            timestamp: block.timestamp
          })
        );
      } else if (shieldCount > 0) {
        Planet.setShieldCount(shieldEaterNextPlanetId, 0);
        addCharge += shieldCount;
        ShieldEaterDamageOverrideLog.set(
          nextLogEntity(),
          ShieldEaterDamageOverrideLogData({
            planetId: shieldEaterNextPlanetId,
            shieldsDestroyed: shieldCount,
            damageType: EShieldEaterDamageType.Eat,
            timestamp: block.timestamp
          })
        );
      }

      ShieldEater.setCurrentCharge(ShieldEater.getCurrentCharge() + addCharge);
    }
  }

  /**
   * @dev Detonates the Shield Eater at the current location, wiping out shield on all nearby planets.
   */
  function detonate() internal {
    uint256 centerDamage = P_ShieldEaterConfig.getDetonateCenterDamage();
    uint256 adjacentDamage = P_ShieldEaterConfig.getDetonateAdjacentDamage();

    if (centerDamage > 10000) {
      centerDamage = 10000;
    }

    if (adjacentDamage > 10000) {
      adjacentDamage = 10000;
    }

    // Center
    bytes32 planetId = ShieldEater.getCurrentPlanet();
    uint256 shieldCount = Planet.getShieldCount(planetId);
    uint256 shieldsDestroyed = (shieldCount * centerDamage) / 10000;
    Planet.setShieldCount(planetId, (shieldCount - shieldsDestroyed));
    ShieldEaterDamageOverrideLog.set(
      nextLogEntity(),
      ShieldEaterDamageOverrideLogData({
        planetId: planetId,
        shieldsDestroyed: shieldsDestroyed,
        damageType: EShieldEaterDamageType.Detonate,
        timestamp: block.timestamp
      })
    );

    // for each direction
    bytes32 neighborId;
    for (uint256 i = 2; i < uint256(EDirection.LENGTH); i++) {
      // get the neighbor
      neighborId = getNeighbor(planetId, EDirection(i));

      // if neighbor is a planet
      if (Planet.getIsPlanet(neighborId)) {
        shieldCount = Planet.getShieldCount(neighborId);
        shieldsDestroyed = (shieldCount * adjacentDamage) / 10000;
        Planet.setShieldCount(neighborId, (shieldCount - shieldsDestroyed));
        ShieldEaterDamageOverrideLog.set(
          nextLogEntity(),
          ShieldEaterDamageOverrideLogData({
            planetId: neighborId,
            shieldsDestroyed: shieldsDestroyed,
            damageType: EShieldEaterDamageType.Collateral,
            timestamp: block.timestamp
          })
        );
      }
    }

    ShieldEater.setCurrentCharge(0);
  }

  function getNeighbor(bytes32 planetId, EDirection direction) internal view returns (bytes32 neighbor) {
    PlanetData memory planet = Planet.get(planetId);
    if (direction == EDirection.East) {
      neighbor = coordToId(planet.q + 1, planet.r);
    } else if (direction == EDirection.Southeast) {
      neighbor = coordToId(planet.q, planet.r + 1);
    } else if (direction == EDirection.Southwest) {
      neighbor = coordToId(planet.q - 1, planet.r + 1);
    } else if (direction == EDirection.West) {
      neighbor = coordToId(planet.q - 1, planet.r);
    } else if (direction == EDirection.Northwest) {
      neighbor = coordToId(planet.q, planet.r - 1);
    } else if (direction == EDirection.Northeast) {
      neighbor = coordToId(planet.q + 1, planet.r - 1);
    } else {
      // we appear to have no neighbors. return the current planet
      neighbor = planetId;
    }
  }
}
