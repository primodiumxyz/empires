// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { addressToId } from "src/utils.sol";

import { Empire, Player, P_PointConfig, EMStorm, Planet } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";

import { LibEMStorm } from "libraries/LibEMStorm.sol";

import { pseudorandom, coordToId } from "src/utils.sol";

contract LibEMStormTest is PrimodiumTest {
  bytes32 planetId;
  bytes32 aliceId;
  bytes32 bobId;
  function setUp() public override {
    super.setUp();
    aliceId = addressToId(alice);
    bobId = addressToId(bob);
  }

  function testChooseStartingPlanet(uint256 fuzz) public {
    vm.startPrank(creator);
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    assertTrue(planetIds.length > 0, "LibEMStorm: planetIds.length is 0");

    // set a random block.number
    vm.roll(fuzz);

    // choose a starting planet
    LibEMStorm.chooseStartingPlanet();

    // check that it is a valid planetId
    assertTrue(PlanetsSet.has(EMStorm.getCurrentPlanet()), "LibEMStorm: planetId not contained in PlanetsSet");
  }

  function testChooseNextDestination(uint256 fuzz) public {
    vm.startPrank(creator);
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();

    fuzz = bound(fuzz, 1000000, 1e36);

    // set a random block.number
    vm.roll(fuzz);

    // populate lastEMStormVisit for all planets
    for (uint256 i = 0; i < planetIds.length; i++) {
      Planet.setLastEMStormVisit(planetIds[i], pseudorandom(i, fuzz - 1));
    }

    // save the top 3 planetIds
    bytes32[] memory longestWithoutVisit = new bytes32[](3);
    uint256 longest = 0;

    // TODO: so expensive.  optimize.
    for (uint256 i = 0; i < planetIds.length; i++) {
      if (block.number - Planet.getLastEMStormVisit(planetIds[i]) >= longest) {
        longestWithoutVisit[2] = longestWithoutVisit[1];
        longestWithoutVisit[1] = longestWithoutVisit[0];
        longestWithoutVisit[0] = planetIds[i];
      }
    }

    // choose a next destination
    LibEMStorm.chooseNextDestination();

    // check that it is a valid planetId
    assertTrue(PlanetsSet.has(EMStorm.getDestinationPlanet()), "LibEMStorm: planetId not contained in PlanetsSet");

    // check that it is one of the top 3 planetIds
    assertTrue(
      EMStorm.getDestinationPlanet() == longestWithoutVisit[0] ||
        EMStorm.getDestinationPlanet() == longestWithoutVisit[1] ||
        EMStorm.getDestinationPlanet() == longestWithoutVisit[2],
      "LibEMStorm: planetId not one of the top 3"
    );
  }
}
