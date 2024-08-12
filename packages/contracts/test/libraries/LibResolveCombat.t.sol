// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { PendingMove, Planet, PlanetData, Arrivals } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EMovement, EOrigin, EDirection } from "codegen/common.sol";
import { LibMoveShips } from "libraries/LibMoveShips.sol";
import { LibResolveCombat } from "libraries/LibResolveCombat.sol";
import { coordToId } from "src/utils.sol";

contract LibResolveCombatTest is PrimodiumTest {
  bytes32 planetId;
  bytes32 emptyPlanetId;

  function setUp() public override {
    super.setUp();
    uint256 i = 0;
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    do {
      planetId = planetIds[i];
      i++;
    } while (Planet.getEmpireId(planetId) != 1);

    for (i = 0; i < planetIds.length; i++) {
      emptyPlanetId = planetIds[i];
      if (Planet.getEmpireId(planetId) == 0) {
        break;
      }
    }
    vm.startPrank(creator);
  }

  function testReinforce() public {
    Arrivals.set(planetId, 1, 1);
    PlanetData memory planetData = Planet.get(planetId);
    LibResolveCombat.resolveCombat(planetId);
    assertEq(Planet.getShipCount(planetId), planetData.shipCount + 1, "ship count should be 1 more than before");
    assertEq(Planet.getEmpireId(planetId), planetData.empireId, "empire id should be the same");
  }

  function testAttack() public {
    Arrivals.set(planetId, 2, 1);
    Planet.setShipCount(planetId, 5);
    LibResolveCombat.resolveCombat(planetId);
    assertEq(Planet.getShipCount(planetId), 4, "ship count should be 4");
    assertEq(Planet.getEmpireId(planetId), 1, "empire id should be the same");
  }

  function testConquer() public {
    Arrivals.set(planetId, 2, 6);
    Planet.setShipCount(planetId, 5);
    LibResolveCombat.resolveCombat(planetId);
    assertEq(Planet.getShipCount(planetId), 1);
    assertEq(Planet.getEmpireId(planetId), 2);
  }

  function testConquerClearPendingMoves() public {
    // create pending move
    Planet.setShipCount(planetId, 1);
    bool moved = LibMoveShips.createPendingMove(planetId, emptyPlanetId);

    assertEq(moved, true, "should have moved");
    assertFalse(PendingMove.get(planetId).empireId == 0);
    assertFalse(PendingMove.get(planetId).destinationPlanetId == bytes32(0));

    // conquer
    Arrivals.set(planetId, 2, 6);
    Planet.setShipCount(planetId, 5);
    LibResolveCombat.resolveCombat(planetId);

    assertEq(PendingMove.get(planetId).empireId, 0);
    assertEq(PendingMove.get(planetId).destinationPlanetId, bytes32(0));
  }

  function testAttackFullyShielded() public {
    Arrivals.set(planetId, 2, 1);
    Planet.setShipCount(planetId, 5);
    Planet.setShieldCount(planetId, 2);
    LibResolveCombat.resolveCombat(planetId);
    assertEq(Planet.getShipCount(planetId), 5);
    assertEq(Planet.getShieldCount(planetId), 1);
    assertEq(Planet.getEmpireId(planetId), 1);
  }

  function testAttackEqualsShield() public {
    Arrivals.set(planetId, 2, 2);
    Planet.setShipCount(planetId, 5);
    Planet.setShieldCount(planetId, 2);
    LibResolveCombat.resolveCombat(planetId);
    assertEq(Planet.getShipCount(planetId), 5);
    assertEq(Planet.getShieldCount(planetId), 0);
    assertEq(Planet.getEmpireId(planetId), 1);
  }

  function testAttackPartiallyShielded() public {
    Arrivals.set(planetId, 2, 4);
    Planet.setShipCount(planetId, 5);
    Planet.setShieldCount(planetId, 1);
    LibResolveCombat.resolveCombat(planetId);
    assertEq(Planet.getShipCount(planetId), 2);
    assertEq(Planet.getShieldCount(planetId), 0);
    assertEq(Planet.getEmpireId(planetId), 1);
  }

  function testAttackEqualsTotalDefenses() public {
    Arrivals.set(planetId, 2, 6);
    Planet.setShipCount(planetId, 5);
    Planet.setShieldCount(planetId, 1);
    LibResolveCombat.resolveCombat(planetId);
    assertEq(Planet.getShipCount(planetId), 0);
    assertEq(Planet.getShieldCount(planetId), 0);
    assertEq(Planet.getEmpireId(planetId), 1);
  }

  function testExceedsTotalDefenses() public {
    Arrivals.set(planetId, 2, 5);
    Planet.setShipCount(planetId, 2);
    Planet.setShieldCount(planetId, 2);
    LibResolveCombat.resolveCombat(planetId);
    assertEq(Planet.getShipCount(planetId), 1);
    assertEq(Planet.getShieldCount(planetId), 0);
    assertEq(Planet.getEmpireId(planetId), 2);
  }

  function testTwoAttackers() public {
    // should resolve to green 3 attackers
    Arrivals.set(planetId, 2, 5);
    Arrivals.set(planetId, 3, 8);
    Planet.setShipCount(planetId, 2);
    Planet.setShieldCount(planetId, 2);
    LibResolveCombat.resolveCombat(planetId);
    assertEq(Planet.getShipCount(planetId), 1);
    assertEq(Planet.getShieldCount(planetId), 0);
    assertEq(Planet.getEmpireId(planetId), 1);
  }

  function testTwoAttackersArrivingDefenders() public {
    // should resolve to green 3 attackers
    Arrivals.set(planetId, 2, 5);
    Arrivals.set(planetId, 3, 8);
    Arrivals.set(planetId, 1, 2);
    Planet.setShipCount(planetId, 2);
    Planet.setShieldCount(planetId, 2);
    LibResolveCombat.resolveCombat(planetId);
    // three attackers, 4 ship defenders, 2 shield defenders
    // should resolve to 3 ship defender, 0 shield defenders
    assertEq(Planet.getShipCount(planetId), 3);
    assertEq(Planet.getShieldCount(planetId), 0);
    assertEq(Planet.getEmpireId(planetId), 1);
  }

  function testThreeAttackers() public {
    Planet.setShieldCount(emptyPlanetId, 0);
    // should resolve to green 3 attackers because green (winner) has 3 more ships than blue (second place)
    Arrivals.set(emptyPlanetId, 2, 5);
    Arrivals.set(emptyPlanetId, 3, 8);
    Arrivals.set(emptyPlanetId, 1, 4);
    Planet.setShipCount(emptyPlanetId, 0);
    Planet.setShieldCount(emptyPlanetId, 0);
    console.log(Planet.getShipCount(emptyPlanetId));
    console.log(Planet.getShieldCount(emptyPlanetId));
    console.log(uint8(Planet.getEmpireId(emptyPlanetId)));
    LibResolveCombat.resolveCombat(emptyPlanetId);
    assertEq(Planet.getShipCount(emptyPlanetId), 3, "should resolve to 3 ship defenders");
    assertEq(Planet.getShieldCount(emptyPlanetId), 0, "should resolve to 0 shield defenders");
    assertEq(Planet.getEmpireId(emptyPlanetId), 3, "should resolve to green");
  }
}
