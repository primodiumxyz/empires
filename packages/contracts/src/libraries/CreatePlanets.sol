// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console } from "forge-std/console.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";
import { Planet, PlanetData, Empire, Planet_TacticalStrikeData, Planet_TacticalStrike } from "codegen/index.sol";
import { EEmpire, EOrigin, EOverride } from "codegen/common.sol";
import { coordToId } from "src/utils.sol";

function createPlanets() {
  bytes32 redPlanetId = coordToId(101, -2);
  PlanetData memory planetData = PlanetData({
    q: 101,
    r: -2,
    isPlanet: true,
    shipCount: 0,
    shieldCount: 0,
    empireId: EEmpire.Red,
    goldCount: 0
  });
  Planet_TacticalStrikeData memory planetTacticalStrikeData = Planet_TacticalStrikeData({
    strikeReloadRate: 100, // out of 100
    strikeReloadCount: 0
  });
  Planet.set(redPlanetId, planetData);
  Planet_TacticalStrike.set(redPlanetId, planetTacticalStrikeData);
  PlanetsSet.add(redPlanetId);
  EmpirePlanetsSet.add(EEmpire.Red, redPlanetId);
  Empire.set(EEmpire.Red, EOrigin.North, 0, 0);

  planetData.q = 98;
  planetData.r = 1;
  planetData.empireId = EEmpire.Blue;
  bytes32 bluePlanetId = coordToId(98, 1);
  Planet.set(bluePlanetId, planetData);
  Planet_TacticalStrike.set(bluePlanetId, planetTacticalStrikeData);

  PlanetsSet.add(bluePlanetId);
  EmpirePlanetsSet.add(EEmpire.Blue, bluePlanetId);
  Empire.set(EEmpire.Blue, EOrigin.Southwest, 0, 0);

  bytes32 greenPlanetId = coordToId(101, 1);
  planetData.q = 101;
  planetData.r = 1;
  planetData.empireId = EEmpire.Green;

  Planet.set(greenPlanetId, planetData);
  Planet_TacticalStrike.set(greenPlanetId, planetTacticalStrikeData);

  PlanetsSet.add(greenPlanetId);
  EmpirePlanetsSet.add(EEmpire.Green, greenPlanetId);
  Empire.set(EEmpire.Green, EOrigin.Southeast, 0, 0);

  // neutral planets have no strike reload rate
  planetTacticalStrikeData.strikeReloadRate = 0;
  planetData.shieldCount = 4;

  bytes32 planet4 = coordToId(100, -1);
  planetData.q = 100;
  planetData.r = -1;
  planetData.empireId = EEmpire.NULL;
  Planet.set(planet4, planetData);
  Planet_TacticalStrike.set(planet4, planetTacticalStrikeData);
  PlanetsSet.add(planet4);

  bytes32 planet5 = coordToId(100, 1);
  planetData.q = 100;
  planetData.r = 1;

  Planet.set(planet5, planetData);
  Planet_TacticalStrike.set(planet5, planetTacticalStrikeData);
  PlanetsSet.add(planet5);

  bytes32 planet6 = coordToId(99, 0);

  planetData.q = 99;
  planetData.r = 0;
  Planet.set(planet6, planetData);
  Planet_TacticalStrike.set(planet6, planetTacticalStrikeData);
  PlanetsSet.add(planet6);

  bytes32 planet7 = coordToId(100, 0);
  planetData.q = 100;
  planetData.r = 0;
  Planet.set(planet7, planetData);
  Planet_TacticalStrike.set(planet7, planetTacticalStrikeData);
  PlanetsSet.add(planet7);

  bytes32 planet8 = coordToId(101, 0);
  planetData.q = 101;
  planetData.r = 0;
  Planet.set(planet8, planetData);
  Planet_TacticalStrike.set(planet8, planetTacticalStrikeData);
  PlanetsSet.add(planet8);

  bytes32 planet9 = coordToId(99, 1);
  planetData.q = 99;
  planetData.r = 1;
  Planet.set(planet9, planetData);
  Planet_TacticalStrike.set(planet9, planetTacticalStrikeData);
  PlanetsSet.add(planet9);

  bytes32 planet10 = coordToId(101, -1);
  planetData.q = 101;
  planetData.r = -1;
  Planet.set(planet10, planetData);
  Planet_TacticalStrike.set(planet10, planetTacticalStrikeData);
  PlanetsSet.add(planet10);
}
