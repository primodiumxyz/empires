// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { PendingMove, P_NPCMoveThresholds, Planet, PlanetData, Arrivals } from "codegen/index.sol";
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
    } while (Planet.getEmpireId(planetId) != EEmpire.Red);
    vm.startPrank(creator);
  }

  function testReinforce() public {
    Arrivals.set(planetId, EEmpire.Red, 1);
    PlanetData memory planetData = Planet.get(planetId);
    LibResolveCombat.resolveCombat(planetId);
    assertEq(Planet.getShipCount(planetId), planetData.shipCount + 1, "ship count should be 1 more than before");
    assertEq(Planet.getEmpireId(planetId), planetData.empireId, "empire id should be the same");
  }

  function testAttack() public {
    Arrivals.set(planetId, EEmpire.Blue, 1);
    Planet.setShipCount(planetId, 5);
    LibResolveCombat.resolveCombat(planetId);
    assertEq(Planet.getShipCount(planetId), 4, "ship count should be 4");
    assertEq(Planet.getEmpireId(planetId), EEmpire.Red, "empire id should be the same");
  }

  function testConquer() public {
    Arrivals.set(planetId, EEmpire.Blue, 6);
    Planet.setShipCount(planetId, 5);
    LibResolveCombat.resolveCombat(planetId);
    assertEq(Planet.getShipCount(planetId), 1);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Blue);
  }

  function testConquerClearPendingMoves() public {
    // create pending move
    P_NPCMoveThresholds.set(0, 10000, 10000, 10000); // Thresholds to always move forward
    Planet.setShipCount(planetId, 1);
    bool moved = LibMoveShips.createPendingMove(planetId);

    assertEq(moved, true, "should have moved");
    assertFalse(PendingMove.get(planetId).empireId == EEmpire.NULL);
    assertFalse(PendingMove.get(planetId).destinationPlanetId == bytes32(0));

    // conquer
    Arrivals.set(planetId, EEmpire.Blue, 6);
    Planet.setShipCount(planetId, 5);
    LibResolveCombat.resolveCombat(planetId);

    assertEq(PendingMove.get(planetId).empireId, EEmpire.NULL);
    assertEq(PendingMove.get(planetId).destinationPlanetId, bytes32(0));
  }

  function testAttackFullyShielded() public {
    Arrivals.set(planetId, EEmpire.Blue, 1);
    Planet.setShipCount(planetId, 5);
    Planet.setShieldCount(planetId, 2);
    LibResolveCombat.resolveCombat(planetId);
    assertEq(Planet.getShipCount(planetId), 5);
    assertEq(Planet.getShieldCount(planetId), 1);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Red);
  }

  function testAttackEqualsShield() public {
    Arrivals.set(planetId, EEmpire.Blue, 2);
    Planet.setShipCount(planetId, 5);
    Planet.setShieldCount(planetId, 2);
    LibResolveCombat.resolveCombat(planetId);
    assertEq(Planet.getShipCount(planetId), 5);
    assertEq(Planet.getShieldCount(planetId), 0);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Red);
  }

  function testAttackPartiallyShielded() public {
    Arrivals.set(planetId, EEmpire.Blue, 4);
    Planet.setShipCount(planetId, 5);
    Planet.setShieldCount(planetId, 1);
    LibResolveCombat.resolveCombat(planetId);
    assertEq(Planet.getShipCount(planetId), 2);
    assertEq(Planet.getShieldCount(planetId), 0);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Red);
  }

  function testAttackEqualsTotalDefenses() public {
    Arrivals.set(planetId, EEmpire.Blue, 6);
    Planet.setShipCount(planetId, 5);
    Planet.setShieldCount(planetId, 1);
    LibResolveCombat.resolveCombat(planetId);
    assertEq(Planet.getShipCount(planetId), 0);
    assertEq(Planet.getShieldCount(planetId), 0);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Red);
  }

  function testExceedsTotalDefenses() public {
    Arrivals.set(planetId, EEmpire.Blue, 5);
    Planet.setShipCount(planetId, 2);
    Planet.setShieldCount(planetId, 2);
    LibResolveCombat.resolveCombat(planetId);
    assertEq(Planet.getShipCount(planetId), 1);
    assertEq(Planet.getShieldCount(planetId), 0);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Blue);
  }

  function testTwoAttackers() public {
    // should resolve to green 3 attackers
    Arrivals.set(planetId, EEmpire.Blue, 5);
    Arrivals.set(planetId, EEmpire.Green, 8);
    Planet.setShipCount(planetId, 2);
    Planet.setShieldCount(planetId, 2);
    LibResolveCombat.resolveCombat(planetId);
    assertEq(Planet.getShipCount(planetId), 1);
    assertEq(Planet.getShieldCount(planetId), 0);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Red);
  }

  function testTwoAttackersArrivingDefenders() public {
    // should resolve to green 3 attackers
    Arrivals.set(planetId, EEmpire.Blue, 5);
    Arrivals.set(planetId, EEmpire.Green, 8);
    Arrivals.set(planetId, EEmpire.Red, 2);
    Planet.setShipCount(planetId, 2);
    Planet.setShieldCount(planetId, 2);
    LibResolveCombat.resolveCombat(planetId);
    // three attackers, 4 ship defenders, 2 shield defenders
    // should resolve to 3 ship defender, 0 shield defenders
    assertEq(Planet.getShipCount(planetId), 3);
    assertEq(Planet.getShieldCount(planetId), 0);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Red);
  }

  function testThreeAttackers() public {
    bytes32 emptyPlanetId;
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    for (uint256 i = 0; i < planetIds.length; i++) {
      emptyPlanetId = planetIds[i];
      if (Planet.getEmpireId(planetId) == EEmpire.NULL) {
        break;
      }
    }
    Planet.setShieldCount(emptyPlanetId, 0);
    // should resolve to green 3 attackers because green (winner) has 3 more ships than blue (second place)
    Arrivals.set(emptyPlanetId, EEmpire.Blue, 5);
    Arrivals.set(emptyPlanetId, EEmpire.Green, 8);
    Arrivals.set(emptyPlanetId, EEmpire.Red, 4);
    LibResolveCombat.resolveCombat(emptyPlanetId);
    assertEq(Planet.getShipCount(emptyPlanetId), 3, "should resolve to 3 ship defenders");
    assertEq(Planet.getShieldCount(emptyPlanetId), 0, "should resolve to 0 shield defenders");
    assertEq(Planet.getEmpireId(emptyPlanetId), EEmpire.Green, "should resolve to green");
  }
}
