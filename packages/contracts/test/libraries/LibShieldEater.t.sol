// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { addressToId } from "src/utils.sol";

import { Empire, Player, P_PointConfig, ShieldEater, Planet, PlanetData } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";

import { LibShieldEater } from "libraries/LibShieldEater.sol";

import { pseudorandom, coordToId } from "src/utils.sol";

contract LibShieldEaterTest is PrimodiumTest {
  function setUp() public override {
    super.setUp();
  }

  function testChooseStartingPlanet(uint256 fuzz) public {
    vm.startPrank(creator);
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    assertTrue(planetIds.length > 0, "LibShieldEater: planetIds.length is 0");

    // set a random block.number
    vm.roll(fuzz);

    // choose a starting planet
    LibShieldEater.chooseStartingPlanet();

    // check that it is a valid planetId
    assertTrue(PlanetsSet.has(ShieldEater.getCurrentPlanet()), "LibShieldEater: planetId not contained in PlanetsSet");
  }

  function testChooseNextDestination(uint256 fuzz) public {
    vm.startPrank(creator);
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();

    fuzz = bound(fuzz, 1000000, 1e36);

    // set a random block.number
    vm.roll(fuzz);

    // populate lastEMStormVisit for all planets
    for (uint256 i = 0; i < planetIds.length; i++) {
      Planet.setLastShieldEaterVisit(planetIds[i], pseudorandom(i, fuzz - 1));
    }

    // save the top 3 planetIds
    bytes32[] memory longestWithoutVisit = new bytes32[](3);
    uint256 longest = 0;

    // TODO: so expensive.  optimize.
    for (uint256 i = 0; i < planetIds.length; i++) {
      if (block.number - Planet.getLastShieldEaterVisit(planetIds[i]) >= longest) {
        longestWithoutVisit[2] = longestWithoutVisit[1];
        longestWithoutVisit[1] = longestWithoutVisit[0];
        longestWithoutVisit[0] = planetIds[i];
      }
    }

    // choose a next destination
    LibShieldEater.chooseNextDestination();

    // check that it is a valid planetId
    assertTrue(
      PlanetsSet.has(ShieldEater.getDestinationPlanet()),
      "LibShieldEater: planetId not contained in PlanetsSet"
    );

    // check that it is one of the top 3 planetIds
    assertTrue(
      ShieldEater.getDestinationPlanet() == longestWithoutVisit[0] ||
        ShieldEater.getDestinationPlanet() == longestWithoutVisit[1] ||
        ShieldEater.getDestinationPlanet() == longestWithoutVisit[2],
      "LibShieldEater: planetId not one of the top 3"
    );
  }

  function testMoveShieldEater(uint256 fuzz) public {
    vm.startPrank(creator);

    LibShieldEater.chooseStartingPlanet();
    LibShieldEater.chooseNextDestination();

    PlanetData memory currPlanetData = Planet.get(ShieldEater.getCurrentPlanet());
    PlanetData memory destPlanetData = Planet.get(ShieldEater.getDestinationPlanet());

    console.log("               [ q, r]");
    console.log("currPlanetData:");
    console.logInt(currPlanetData.q);
    console.logInt(currPlanetData.r);
    console.log("destPlanetData:");
    console.logInt(destPlanetData.q);
    console.logInt(destPlanetData.r);
    console.log("---");

    uint256 loopcount = 0;

    while (currPlanetData.q != destPlanetData.q || currPlanetData.r != destPlanetData.r) {
      LibShieldEater.moveShieldEater();
      currPlanetData = Planet.get(ShieldEater.getCurrentPlanet());
      console.log("currPlanetData:");
      console.logInt(currPlanetData.q);
      console.logInt(currPlanetData.r);
      loopcount++;
      if (loopcount > 20) {
        break;
      }
    }

    assertEq(currPlanetData.q, destPlanetData.q, "LibShieldEater: currPlanetData.q != destPlanetData.q");
    assertEq(currPlanetData.r, destPlanetData.r, "LibShieldEater: currPlanetData.r != destPlanetData.r");
  }
}
