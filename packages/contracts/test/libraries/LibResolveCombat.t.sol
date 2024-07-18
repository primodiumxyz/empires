// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { Planet, PlanetData, Arrivals } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EEmpire, EMovement, EOrigin, EDirection } from "codegen/common.sol";
import { LibMoveShips } from "libraries/LibMoveShips.sol";
import { LibResolveCombat } from "libraries/LibResolveCombat.sol";
import { coordToId } from "src/utils.sol";

contract LibResolveCombatTest is PrimodiumTest {
  bytes32 planetId;
  function setUp() public override {
    super.setUp();
    uint256 i = 0;
    do {
      planetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getFactionId(planetId) == EEmpire.NULL);
    vm.startPrank(creator);
  }

  function testReinforce() public {
    Arrivals.set(planetId, 1);
    PlanetData memory planetData = Planet.get(planetId);
    LibResolveCombat.resolveCombat(planetData.factionId, planetId);
    assertEq(Planet.getShipCount(planetId), planetData.shipCount + 1);
    assertEq(Planet.getFactionId(planetId), planetData.factionId);
  }

  function testAttack() public {
    Arrivals.set(planetId, 1);
    Planet.setFactionId(planetId, EEmpire.Red);
    Planet.setShipCount(planetId, 5);
    LibResolveCombat.resolveCombat(EEmpire.Blue, planetId);
    assertEq(Planet.getShipCount(planetId), 4);
    assertEq(Planet.getFactionId(planetId), EEmpire.Red);
  }

  function testConquer() public {
    Arrivals.set(planetId, 6);
    Planet.setFactionId(planetId, EEmpire.Red);
    Planet.setShipCount(planetId, 5);
    LibResolveCombat.resolveCombat(EEmpire.Blue, planetId);
    assertEq(Planet.getShipCount(planetId), 1);
    assertEq(Planet.getFactionId(planetId), EEmpire.Blue);
  }
}
