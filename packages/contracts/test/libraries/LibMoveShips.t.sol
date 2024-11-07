// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { PendingMove, Planet, PlanetData, P_GameConfig } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";
import { ArrivedMap } from "adts/ArrivedMap.sol";
import { EEmpire, EMovement, EOrigin, EDirection } from "codegen/common.sol";
import { LibMoveShips } from "libraries/LibMoveShips.sol";
import { LibResolveCombat } from "libraries/LibResolveCombat.sol";
import { coordToId } from "src/utils.sol";

contract LibMoveShipsTest is PrimodiumTest {
  bytes32 planetId;

  bytes32 targetPlanet = coordToId(100, -1);

  function setUp() public override {
    super.setUp();
    uint256 i = 0;
    do {
      planetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getEmpireId(planetId) == EEmpire.NULL);
    vm.startPrank(creator);
    P_GameConfig.setGameOverBlock(block.number + 100000);
    vm.roll(1);
    vm.warp(1);
    vm.prevrandao(bytes32("1"));
  }

  // helper for setting up test conditions
  function findUnownedNonCitadelPlanet() internal view returns (bytes32) {
    bytes32[] memory planets = PlanetsSet.getPlanetIds();
    for (uint256 i = 0; i < planets.length; i++) {
      if (!Planet.getIsCitadel(planets[i]) && Planet.getEmpireId(planets[i]) == EEmpire.NULL) {
        return planets[i];
      }
    }
    revert("[LibMoveShipsTest] No unowned non-citadel planet found");
  }

  function testCreatePendingMove() public {
    Planet.setEmpireId(planetId, EEmpire.Red);
    Planet.setShipCount(planetId, 1);
    bool moved = LibMoveShips.createPendingMove(planetId, targetPlanet);
    assertTrue(moved, "should have moved");

    assertFalse(PendingMove.get(planetId).empireId == EEmpire.NULL);
    assertEq(PendingMove.get(planetId).destinationPlanetId, targetPlanet);
  }

  function testFailCreatePendingMoveTargetNotPlanet() public {
    Planet.setEmpireId(planetId, EEmpire.Red);
    Planet.setShipCount(planetId, 1);
    LibMoveShips.createPendingMove(planetId, bytes32("69"));
  }

  function testExecuteMove() public {
    assignPlanetToEmpire(planetId, EEmpire.Red);
    assignPlanetToEmpire(targetPlanet, EEmpire.Red);
    vm.startPrank(creator);
    Planet.setShipCount(planetId, 1);
    Planet.setShipCount(targetPlanet, 2);
    bool moved = LibMoveShips.createPendingMove(planetId, targetPlanet);
    assertTrue(moved, "should have moved");

    LibMoveShips.executePendingMoves(planetId);

    assertEq(Planet.getShipCount(planetId), 0, "ship count should be 0");
    assertEq(Planet.getShipCount(targetPlanet), 3, "target planet should have 3 ships");

    assertTrue(PendingMove.get(planetId).empireId == EEmpire.NULL);
    assertEq(PendingMove.get(planetId).destinationPlanetId, bytes32(0));
  }

  function testExecuteMoveArrivedMapProcedureAndRemoval() public {
    bytes32 planet1 = findUnownedNonCitadelPlanet();
    assignPlanetToEmpire(planet1, EEmpire.Red);
    bytes32 planet2 = findUnownedNonCitadelPlanet();
    assignPlanetToEmpire(planet2, EEmpire.Red);
    bytes32 planet3 = findUnownedNonCitadelPlanet();
    assignPlanetToEmpire(planet3, EEmpire.Red);
    vm.startPrank(creator);

    assertTrue(planet1 != planet2 && planet1 != planet3 && planet2 != planet3, "planets should be different");
    assertTrue(Planet.getEmpireId(planet1) == EEmpire.Red && Planet.getEmpireId(planet2) == EEmpire.Red && Planet.getEmpireId(planet3) == EEmpire.Red, "planets should be owned by red");

    Planet.setShipCount(planet1, 10);
    Planet.setShipCount(planet2, 200);
    Planet.setShipCount(planet3, 3000);
    LibMoveShips.createPendingMove(planet1, planet2);
    LibMoveShips.createPendingMove(planet2, planet3);

    LibMoveShips.executePendingMoves(planet1);
    assertEq(ArrivedMap.get(planet2), 10, "planet 2 should document 10 arrived ships");
    assertEq(Planet.getShipCount(planet1), 0, "planet 1 should have 0 ships remaining");
    assertEq(Planet.getShipCount(planet2), 210, "planet 2 should have 210 ships");

    LibMoveShips.executePendingMoves(planet2);
    assertEq(ArrivedMap.get(planet3), 200, "planet 3 should document 200 arrived ships");
    assertEq(ArrivedMap.get(planet2), 0, "arrived map for planet 2 was not reset");
    assertEq(Planet.getShipCount(planet2), 10, "planet 2 should have 10 ships remaining from arrival of ships from planet 1");
    assertEq(Planet.getShipCount(planet3), 3200, "planet 3 should have 3200 ships");
  }

  function testArrivedMapMultipleArrivedShips() public {
    bytes32 planet1 = findUnownedNonCitadelPlanet();
    assignPlanetToEmpire(planet1, EEmpire.Red);
    bytes32 planet2 = findUnownedNonCitadelPlanet();
    assignPlanetToEmpire(planet2, EEmpire.Red);
    bytes32 planet3 = findUnownedNonCitadelPlanet();
    assignPlanetToEmpire(planet3, EEmpire.Red);

    vm.startPrank(creator);
    Planet.setShipCount(planet1, 10);
    Planet.setShipCount(planet2, 200);
    Planet.setShipCount(planet3, 3000);
    LibMoveShips.createPendingMove(planet1, planet3); // both 1 and 2 go to planet 3
    LibMoveShips.createPendingMove(planet2, planet3);
    LibMoveShips.createPendingMove(planet3, planet1);

    LibMoveShips.executePendingMoves(planet1);
    assertEq(ArrivedMap.get(planet3), 10, "planet 3 should document 10 arrived ships");
    assertEq(Planet.getShipCount(planet1), 0, "planet 1 should have 0 ships remaining");
    assertEq(Planet.getShipCount(planet3), 3010, "planet 3 should have 3010 ships");

    LibMoveShips.executePendingMoves(planet2);
    assertEq(ArrivedMap.get(planet3), 210, "planet 3 should document arrived ships from both planets 1 and 2");
    assertEq(Planet.getShipCount(planet2), 0, "planet 2 should have 0 ships remaining");
    assertEq(Planet.getShipCount(planet3), 3210, "planet 3 should have all 3210 ships");

    LibMoveShips.executePendingMoves(planet3);
    assertEq(ArrivedMap.get(planet1), 3000, "planet 1 should document 3000 arrived ships");
    assertEq(ArrivedMap.get(planet3), 0, "arrived map for planet 3 was not reset");
    assertEq(Planet.getShipCount(planet3), 210, "planet 3 should have 210 ships remaining");
    assertEq(Planet.getShipCount(planet1), 3000, "planet 1 should have 3000 ships");
  }

  function testArrivedMapNoShipsLeavePlanet() public {
    bytes32 planet1 = findUnownedNonCitadelPlanet();
    assignPlanetToEmpire(planet1, EEmpire.Red);
    bytes32 planet2 = findUnownedNonCitadelPlanet();
    assignPlanetToEmpire(planet2, EEmpire.Red);
    bytes32 planet3 = findUnownedNonCitadelPlanet();
    assignPlanetToEmpire(planet3, EEmpire.Red);

    vm.startPrank(creator);
    Planet.setShipCount(planet1, 100);
    Planet.setShipCount(planet2, 1);
    Planet.setShipCount(planet3, 0);
    LibMoveShips.createPendingMove(planet1, planet2);
    LibMoveShips.createPendingMove(planet2, planet3);

    LibMoveShips.executePendingMoves(planet1);
    assertEq(ArrivedMap.get(planet2), 100, "planet 2 should document 100 arrived ships");
    assertEq(Planet.getShipCount(planet1), 0, "planet 1 should have 0 ships remaining");
    assertEq(Planet.getShipCount(planet2), 101, "planet 2 should have 101 ships");

    Planet.setShipCount(planet2, 100); // planet 2 loses a ship somehow (acid rain)

    LibMoveShips.executePendingMoves(planet2);
    assertEq(ArrivedMap.get(planet3), 0, "planet 3 should not have documented arrived ships");
    assertEq(Planet.getShipCount(planet2), 100, "planet 2 should not have moved its 100 ships");
    assertEq(Planet.getShipCount(planet3), 0, "planet 3 should have 0 ships");
  }
}
