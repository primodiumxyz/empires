// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console } from "forge-std/console.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { FactionPlanetsSet } from "adts/FactionPlanetsSet.sol";
import { Planet, PlanetData } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";
import { coordToId } from "src/utils.sol";

function createPlanets() {
  bytes32 redPlanetId = coordToId(1, -2);
  Planet.set(redPlanetId, PlanetData({ q: 1, r: -2, isPlanet: true, destroyerCount: 0, factionId: EEmpire.Red }));
  PlanetsSet.add(redPlanetId);
  FactionPlanetsSet.add(EEmpire.Red, redPlanetId);

  bytes32 bluePlanetId = coordToId(-2, 1);
  Planet.set(bluePlanetId, PlanetData({ q: -2, r: 1, isPlanet: true, destroyerCount: 0, factionId: EEmpire.Blue }));
  PlanetsSet.add(bluePlanetId);
  FactionPlanetsSet.add(EEmpire.Blue, bluePlanetId);

  bytes32 greenPlanetId = coordToId(1, 1);
  Planet.set(greenPlanetId, PlanetData({ q: 1, r: 1, isPlanet: true, destroyerCount: 0, factionId: EEmpire.Green }));
  PlanetsSet.add(greenPlanetId);
  FactionPlanetsSet.add(EEmpire.Green, greenPlanetId);

  bytes32 planet4 = coordToId(0, -1);
  Planet.set(planet4, PlanetData({ q: 0, r: -1, isPlanet: true, destroyerCount: 0, factionId: EEmpire.NULL }));
  PlanetsSet.add(planet4);

  bytes32 planet5 = coordToId(-1, -1);
  Planet.set(planet5, PlanetData({ q: 1, r: -1, isPlanet: true, destroyerCount: 0, factionId: EEmpire.NULL }));
  PlanetsSet.add(planet5);

  bytes32 planet6 = coordToId(-1, 0);
  Planet.set(planet6, PlanetData({ q: -1, r: 0, isPlanet: true, destroyerCount: 0, factionId: EEmpire.NULL }));
  PlanetsSet.add(planet6);

  bytes32 planet7 = coordToId(0, 0);
  Planet.set(planet7, PlanetData({ q: 0, r: 0, isPlanet: true, destroyerCount: 0, factionId: EEmpire.NULL }));
  PlanetsSet.add(planet7);

  bytes32 planet8 = coordToId(1, 0);
  Planet.set(planet8, PlanetData({ q: 1, r: 0, isPlanet: true, destroyerCount: 0, factionId: EEmpire.NULL }));
  PlanetsSet.add(planet8);

  bytes32 planet9 = coordToId(-1, 1);
  Planet.set(planet9, PlanetData({ q: -1, r: 1, isPlanet: true, destroyerCount: 0, factionId: EEmpire.NULL }));
  PlanetsSet.add(planet9);

  bytes32 planet10 = coordToId(1, -1);
  Planet.set(planet10, PlanetData({ q: 1, r: -1, isPlanet: true, destroyerCount: 0, factionId: EEmpire.NULL }));
  PlanetsSet.add(planet10);
}
