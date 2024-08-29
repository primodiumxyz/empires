// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { PendingMove, Planet, PlanetData } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EEmpire } from "codegen/common.sol";
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
    } while (Planet.getEmpireId(planetId) != EEmpire.Red);

    for (i = 0; i < planetIds.length; i++) {
      emptyPlanetId = planetIds[i];
      if (Planet.getEmpireId(planetId) == EEmpire.NULL) {
        break;
      }
    }
    vm.startPrank(creator);
  }

  function testReinforce() public {
    PlanetData memory planetData = Planet.get(planetId);
    LibResolveCombat.resolveCombat(EEmpire.Red, 1, planetId);
    assertEq(Planet.getShipCount(planetId), planetData.shipCount + 1, "ship count should be 1 more than before");
    assertEq(Planet.getEmpireId(planetId), planetData.empireId, "empire id should be the same");
  }

  function testAttack() public {
    Planet.setShipCount(planetId, 5);
    LibResolveCombat.resolveCombat(EEmpire.Blue, 1, planetId);
    assertEq(Planet.getShipCount(planetId), 4, "ship count should be 4");
    assertEq(Planet.getEmpireId(planetId), EEmpire.Red, "empire id should be the same");
  }

  function testConquer() public {
    Planet.setShipCount(planetId, 5);
    LibResolveCombat.resolveCombat(EEmpire.Blue, 6, planetId);
    assertEq(Planet.getShipCount(planetId), 1);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Blue);
  }

  function testConquerClearPendingMoves() public {
    // create pending move
    Planet.setShipCount(planetId, 1);
    bool moved = LibMoveShips.createPendingMove(planetId, emptyPlanetId);

    assertEq(moved, true, "should have moved");
    assertFalse(PendingMove.get(planetId).empireId == EEmpire.NULL);
    assertFalse(PendingMove.get(planetId).destinationPlanetId == bytes32(0));

    // conquer
    Planet.setShipCount(planetId, 5);
    LibResolveCombat.resolveCombat(EEmpire.Blue, 6, planetId);

    assertEq(PendingMove.get(planetId).empireId, EEmpire.NULL);
    assertEq(PendingMove.get(planetId).destinationPlanetId, bytes32(0));
  }

  function testAttackFullyShielded() public {
    Planet.setShipCount(planetId, 5);
    Planet.setShieldCount(planetId, 2);
    LibResolveCombat.resolveCombat(EEmpire.Blue, 1, planetId);
    assertEq(Planet.getShipCount(planetId), 5);
    assertEq(Planet.getShieldCount(planetId), 1);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Red);
  }

  function testAttackEqualsShield() public {
    Planet.setShipCount(planetId, 5);
    Planet.setShieldCount(planetId, 2);
    LibResolveCombat.resolveCombat(EEmpire.Blue, 2, planetId);
    assertEq(Planet.getShipCount(planetId), 5);
    assertEq(Planet.getShieldCount(planetId), 0);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Red);
  }

  function testAttackPartiallyShielded() public {
    Planet.setShipCount(planetId, 5);
    Planet.setShieldCount(planetId, 1);
    LibResolveCombat.resolveCombat(EEmpire.Blue, 4, planetId);
    assertEq(Planet.getShipCount(planetId), 2);
    assertEq(Planet.getShieldCount(planetId), 0);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Red);
  }

  function testAttackEqualsTotalDefenses() public {
    Planet.setShipCount(planetId, 5);
    Planet.setShieldCount(planetId, 1);
    LibResolveCombat.resolveCombat(EEmpire.Blue, 6, planetId);
    assertEq(Planet.getShipCount(planetId), 0);
    assertEq(Planet.getShieldCount(planetId), 0);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Red);
  }

  function testExceedsTotalDefenses() public {
    Planet.setShipCount(planetId, 2);
    Planet.setShieldCount(planetId, 2);
    LibResolveCombat.resolveCombat(EEmpire.Blue, 5, planetId);
    assertEq(Planet.getShipCount(planetId), 1);
    assertEq(Planet.getShieldCount(planetId), 0);
    assertEq(Planet.getEmpireId(planetId), EEmpire.Blue);
  }
}
