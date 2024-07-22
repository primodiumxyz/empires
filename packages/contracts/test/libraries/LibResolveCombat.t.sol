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
    } while (Planet.getEmpireId(planetId) == EEmpire.NULL);
    vm.startPrank(creator);
  }

  function testReinforce() public {
    Arrivals.set(planetId, 1);
    PlanetData memory planetData = Planet.get(planetId);
    LibResolveCombat.resolveCombat(planetData.empireId, planetId);
    assertEq(Planet.getShipCount(planetId), planetData.shipCount + 1);
    assertEq(Planet.getEmpireId(planetId), planetData.empireId);
  }

  function testAttack() public {
    Arrivals.set(planetId, 1);
    Planet.setEmpireId(planetId, EEmpire.Red);
    Planet.setShipCount(planetId, 5);
    LibResolveCombat.resolveCombat(EEmpire.Blue, planetId);
    assertEq(Planet.getShipCount(planetId), 4);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Red);
  }

  function testConquer() public {
    Arrivals.set(planetId, 6);
    Planet.setEmpireId(planetId, EEmpire.Red);
    Planet.setShipCount(planetId, 5);
    LibResolveCombat.resolveCombat(EEmpire.Blue, planetId);
    assertEq(Planet.getShipCount(planetId), 1);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Blue);
  }

  function testAttackFullyShielded() public {
    Arrivals.set(planetId, 1);
    Planet.setEmpireId(planetId, EEmpire.Red);
    Planet.setShipCount(planetId, 5);
    Planet.setShieldCount(planetId, 2);
    LibResolveCombat.resolveCombat(EEmpire.Blue, planetId);
    assertEq(Planet.getShipCount(planetId), 5);
    assertEq(Planet.getShieldCount(planetId), 1);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Red);
  }

  function testAttackEqualsShield() public {
    Arrivals.set(planetId, 2);
    Planet.setEmpireId(planetId, EEmpire.Red);
    Planet.setShipCount(planetId, 5);
    Planet.setShieldCount(planetId, 2);
    LibResolveCombat.resolveCombat(EEmpire.Blue, planetId);
    assertEq(Planet.getShipCount(planetId), 5);
    assertEq(Planet.getShieldCount(planetId), 0);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Red);
  }

  function testAttackPartiallyShielded() public {
    Arrivals.set(planetId, 4);
    Planet.setEmpireId(planetId, EEmpire.Red);
    Planet.setShipCount(planetId, 5);
    Planet.setShieldCount(planetId, 1);
    LibResolveCombat.resolveCombat(EEmpire.Blue, planetId);
    assertEq(Planet.getShipCount(planetId), 2);
    assertEq(Planet.getShieldCount(planetId), 0);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Red);
  }

  function testAttackEqualsTotalDefenses() public {
    Arrivals.set(planetId, 6);
    Planet.setEmpireId(planetId, EEmpire.Red);
    Planet.setShipCount(planetId, 5);
    Planet.setShieldCount(planetId, 1);
    LibResolveCombat.resolveCombat(EEmpire.Blue, planetId);
    assertEq(Planet.getShipCount(planetId), 0);
    assertEq(Planet.getShieldCount(planetId), 0);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Red);
  }

  function testExceedsTotalDefenses() public {
    Arrivals.set(planetId, 5);
    Planet.setEmpireId(planetId, EEmpire.Red);
    Planet.setShipCount(planetId, 2);
    Planet.setShieldCount(planetId, 2);
    LibResolveCombat.resolveCombat(EEmpire.Blue, planetId);
    assertEq(Planet.getShipCount(planetId), 1);
    assertEq(Planet.getShieldCount(planetId), 0);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Blue);
  }
}
