// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import {Arrivals, Planet, PlanetData} from "codegen/index.sol";
import {FactionPlanetsSet} from "adts/FactionPlanetsSet.sol";
import {EEmpire} from "codegen/common.sol";

library LibResolveCombat {
    function resolveCombat(EEmpire empire, bytes32 planetId) internal {
        uint256 arrivingDestroyers = Arrivals.get(planetId);
        if (arrivingDestroyers == 0) return;

        PlanetData memory planetData = Planet.get(planetId);
        if (empire == planetData.factionId) {
            Planet.setDestroyerCount(planetId, planetData.destroyerCount + arrivingDestroyers);
        } else {
            bool conquer = false;

            // attackers bounce off shields
            if (arrivingDestroyers <= planetData.shieldCount) {
                Planet.setShieldCount(planetId, planetData.shieldCount - arrivingDestroyers);
            }
            // attackers destroy shields and damage destroyers, but don't conquer
            else if (arrivingDestroyers <= planetData.shieldCount + planetData.destroyerCount) {
                arrivingDestroyers -= planetData.shieldCount;
                Planet.setShieldCount(planetId, 0);
                Planet.setDestroyerCount(planetId, planetData.destroyerCount - arrivingDestroyers);
            }
            // attackers conquer planet
            else if (arrivingDestroyers > planetData.shieldCount + planetData.destroyerCount) {
                Planet.setShieldCount(planetId, 0);

                Planet.setDestroyerCount(
                    planetId, arrivingDestroyers - (planetData.destroyerCount + planetData.shieldCount)
                );

                FactionPlanetsSet.add(empire, planetId);
                FactionPlanetsSet.remove(planetData.factionId, planetId);
                Planet.setFactionId(planetId, empire);
            }
            // should be impossible
            else {
                return;
            }
        }
        Arrivals.deleteRecord(planetId);
    }
}
