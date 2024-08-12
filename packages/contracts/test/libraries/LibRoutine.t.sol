// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { addressToId } from "src/utils.sol";

import { PlanetsSet } from "adts/PlanetsSet.sol";
import { P_RoutineCosts, Planet } from "codegen/index.sol";
import { ERoutine } from "codegen/common.sol";
import { LibRoutine } from "libraries/LibRoutine.sol";
import { RoutineThresholds } from "src/Types.sol";

contract LibRoutineTest is PrimodiumTest {
  bytes32 planetId;
  bytes32 aliceId;
  bytes32 bobId;

  RoutineThresholds routineThresholds =
    RoutineThresholds({
      planetId: planetId,
      accumulateGold: 2000,
      buyShields: 4000,
      buyShips: 6000,
      attackEnemy: 8000,
      supportAlly: 10000,
      attackTargetId: bytes32(""),
      supportTargetId: bytes32("")
    });
  function setUp() public override {
    super.setUp();
    aliceId = addressToId(alice);
    bobId = addressToId(bob);
    vm.startPrank(creator);
    uint i = 0;
    do {
      planetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getEmpireId(planetId) != 0);
    routineThresholds.planetId = planetId;
  }

  function testAccumulateGold() public {
    Planet.setGoldCount(planetId, 1);

    assertEq(Planet.getGoldCount(planetId), 1, "Planet gold count should be 1");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 4, "Planet shield count should be 4");

    LibRoutine._executeRoutine(routineThresholds, routineThresholds.accumulateGold - 1);
    uint256 goldAccumulation = P_RoutineCosts.get(ERoutine.AccumulateGold);

    assertEq(Planet.getGoldCount(planetId), 1 + goldAccumulation, "Planet gold count should be 1 + goldAccumulation");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 4, "Planet shield count should be 4");
  }

  function testBuyShips() public {
    Planet.setGoldCount(planetId, 2);
    P_RoutineCosts.set(ERoutine.BuyShips, 2);

    assertEq(Planet.getGoldCount(planetId), 2, "Planet gold count should be 2");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 4, "Planet shield count should be 4");

    LibRoutine._executeRoutine(routineThresholds, routineThresholds.buyShips - 1);

    assertEq(Planet.getGoldCount(planetId), 0, "Planet gold count should be 0");
    assertEq(Planet.getShipCount(planetId), 1, "Planet ship count should be 1");
    assertEq(Planet.getShieldCount(planetId), 4, "Planet shield count should be 4");

    Planet.setGoldCount(planetId, 9);

    assertEq(Planet.getGoldCount(planetId), 9, "Planet gold count should be 9");
    assertEq(Planet.getShipCount(planetId), 1, "Planet ship count should be 1");
    assertEq(Planet.getShieldCount(planetId), 4, "Planet shield count should be 4");

    LibRoutine._executeRoutine(routineThresholds, routineThresholds.buyShips - 1);

    assertEq(Planet.getGoldCount(planetId), 1, "Planet gold count should be 1");
    assertEq(Planet.getShipCount(planetId), 5, "Planet ship count should be 5");
    assertEq(Planet.getShieldCount(planetId), 4, "Planet shield count should be 4");
  }

  function testBuyShields() public {
    Planet.setGoldCount(planetId, 2);
    P_RoutineCosts.set(ERoutine.BuyShields, 2);

    assertEq(Planet.getGoldCount(planetId), 2, "Planet gold count should be 2");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 4, "Planet shield count should be 4");

    LibRoutine._executeRoutine(routineThresholds, routineThresholds.buyShields - 1);

    assertEq(Planet.getGoldCount(planetId), 0, "Planet gold count should be 0");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 5, "Planet shield count should be 5");

    Planet.setGoldCount(planetId, 7);

    assertEq(Planet.getGoldCount(planetId), 7, "Planet gold count should be 7");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 5, "Planet shield count should be 5");

    LibRoutine._executeRoutine(routineThresholds, routineThresholds.buyShields - 1);

    assertEq(Planet.getGoldCount(planetId), 1, "Planet gold count should be 1");
    assertEq(Planet.getShipCount(planetId), 0, "Planet ship count should be 0");
    assertEq(Planet.getShieldCount(planetId), 8, "Planet shield count should be 8");
  }
}
