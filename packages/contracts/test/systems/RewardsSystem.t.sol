// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Balances } from "@latticexyz/world/src/codegen/tables/Balances.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";

import { addressToId } from "src/utils.sol";
import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { P_GameConfig, WinningEmpire, Empire, P_PointConfig, Planet } from "codegen/index.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { PlayersMap } from "adts/PlayersMap.sol";

import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";
import { CitadelPlanetsSet } from "adts/CitadelPlanetsSet.sol";

contract RewardsSystemTest is PrimodiumTest {
  bytes32 planetId;
  uint256 turnLength = 100;
  uint256 value = 100 ether;

  function setUp() public override {
    super.setUp();

    vm.startPrank(creator);
    world.registerSystem(systemId, system, true);
    world.registerFunctionSelector(systemId, "echoValue()");
  }

  function testWithdrawEarningsNotGameOver() public {
    vm.expectRevert("[RewardsSystem] Game is not over");
    world.Empires__withdrawEarnings();
  }

  function setGameover() internal {
    uint256 endBlock = P_GameConfig.getGameOverBlock();
    vm.roll(endBlock + 1);
  }

  function getEmpireCitadelPlanets(uint8 empire) internal view returns (uint256) {
    bytes32[] memory citadelPlanets = CitadelPlanetsSet.getCitadelPlanetIds();
    uint8 empireCount = P_GameConfig.getEmpireCount();
    uint256[] memory citadelPlanetsPerEmpire = new uint256[](empireCount);
    for (uint256 i = 0; i < citadelPlanets.length; i++) {
      uint8 owningEmpire = Planet.getEmpireId(citadelPlanets[i]);
      citadelPlanetsPerEmpire[owningEmpire]++;
    }
    return citadelPlanetsPerEmpire[empire];
  }

  function findCitadelPlanet(uint8 empire) internal view returns (bytes32) {
    bytes32[] memory citadelPlanets = CitadelPlanetsSet.getCitadelPlanetIds();
    for (uint256 i = 0; i < citadelPlanets.length; i++) {
      uint8 owningEmpire = Planet.getEmpireId(citadelPlanets[i]);
      if (owningEmpire == empire) {
        return citadelPlanets[i];
      }
    }
    revert("[RewardsSystemTest] No citadel planet found");
  }

  function findUnownedNonCitadelPlanet() internal view returns (bytes32) {
    bytes32[] memory planets = PlanetsSet.getPlanetIds();
    for (uint256 i = 0; i < planets.length; i++) {
      if (!Planet.getIsCitadel(planets[i]) && Planet.getEmpireId(planets[i]) == 0) {
        return planets[i];
      }
    }
    revert("[RewardsSystemTest] No non-citadel planet found");
  }

  function testWithdrawEarningsTimeVictoryTiedTwice() public {
    setGameover();
    world.Empires__withdrawEarnings(); // note: this currently hits all tie conditions and then defaults to Red
    assertEq(WinningEmpire.get(), 1);
  }

  function testWithdrawEarningsTimeVictoryTiedOnce() public {
    bytes32 extraCitadelPlanet = findUnownedNonCitadelPlanet();
    Planet.setEmpireId(extraCitadelPlanet, 3);
    EmpirePlanetsSet.add(3, extraCitadelPlanet);
    EmpirePlanetsSet.remove(0, extraCitadelPlanet);
    setGameover();
    uint256 playerEmpirePoints = PointsMap.getValue(3, addressToId(alice));
    uint256 lockedPoints = PointsMap.getLockedPoints(3, addressToId(alice));
    assertGe(playerEmpirePoints, lockedPoints, "playerEmpirePoints should be greater than or equal to lockedPoints");

    world.Empires__withdrawEarnings();
    assertEq(WinningEmpire.get(), 3);
  }

  function testWithdrawEarningsTimeVictory() public {
    bytes32 extraCitadelPlanet = findCitadelPlanet(0);
    Planet.setEmpireId(extraCitadelPlanet, 2);
    EmpirePlanetsSet.add(2, extraCitadelPlanet);
    EmpirePlanetsSet.remove(0, extraCitadelPlanet);
    setGameover();
    world.Empires__withdrawEarnings();
    // assertEq(WinningEmpire.get(), 2);
  }

  function testWithdrawEarningsDominationVictory() public {
    bytes32[] memory citadelPlanets = CitadelPlanetsSet.getCitadelPlanetIds();
    for (uint256 i = 0; i < citadelPlanets.length; i++) {
      uint8 prevEmpire = Planet.getEmpireId(citadelPlanets[i]);
      Planet.setEmpireId(citadelPlanets[i], 2);
      EmpirePlanetsSet.add(2, citadelPlanets[i]);
      EmpirePlanetsSet.remove(prevEmpire, citadelPlanets[i]);
    }
    // Do NOT add setGameOver() here, because we want to test the case where the time is not up yet
    world.Empires__withdrawEarnings();
    assertEq(WinningEmpire.get(), 2);
  }

  function testWithdrawEarningsVictoryAlreadyClaimed() public {
    testWithdrawEarningsDominationVictory();
    bytes32[] memory citadelPlanets = CitadelPlanetsSet.getCitadelPlanetIds();
    for (uint256 i = 0; i < citadelPlanets.length; i++) {
      uint8 prevEmpire = Planet.getEmpireId(citadelPlanets[i]);
      Planet.setEmpireId(citadelPlanets[i], 3);
      EmpirePlanetsSet.add(3, citadelPlanets[i]);
      EmpirePlanetsSet.remove(prevEmpire, citadelPlanets[i]);
    }
    setGameover();
    world.Empires__withdrawEarnings();
    assertEq(WinningEmpire.get(), 2, "Victory should be locked from domination");
  }

  function testSendEther() public {
    sendEther(alice, value);

    assertEq(Balances.get(EMPIRES_NAMESPACE_ID), value);
  }

  function testWithdrawEarnings(uint256 alicePoints, uint256 totalPoints) public {
    vm.assume(totalPoints > 0);
    vm.assume(alicePoints <= totalPoints);
    vm.assume(totalPoints < 100 ether);
    testSendEther();
    setGameover();
    vm.startPrank(creator);
    WinningEmpire.set(1);
    P_PointConfig.setPointRake(0); // out of 10_000

    PointsMap.setValue(1, addressToId(alice), alicePoints);
    Empire.setPointsIssued(1, totalPoints);

    uint256 alicePrevBalance = alice.balance;
    uint256 gain = PlayersMap.get(addressToId(alice)).gain;
    vm.stopPrank();
    vm.prank(alice);
    world.Empires__withdrawEarnings();

    uint256 aliceTotal = (value * alicePoints) / totalPoints;
    assertEq(alice.balance, aliceTotal + alicePrevBalance, "alice balance");
    assertEq(Balances.get(EMPIRES_NAMESPACE_ID), value - aliceTotal, "empire balance");

    assertEq(PointsMap.getValue(1, addressToId(alice)), 0, "alice points");
    assertEq(PlayersMap.get(addressToId(alice)).gain, aliceTotal, "alice profit");

    // should be 0 because all points were withdrawn (or not issued in the first place)
    assertEq(Empire.getPointsIssued(1), alicePoints == 0 ? totalPoints : 0, "empire points");
  }

  // function testWithdrawEarningsEqualAfterWithdrawal(uint256 playerPoints, uint256 totalPoints) public {
  function testWithdrawEarningsEqualAfterWithdrawal() public {
    uint256 playerPoints = 0;
    uint256 totalPoints = 1;

    vm.assume(totalPoints > 0);
    vm.assume(playerPoints <= totalPoints / 3);
    vm.assume(totalPoints < 100 ether);

    sendEther(alice, 1 ether);
    setGameover();

    vm.deal(alice, 1 ether);
    vm.deal(bob, 1 ether);
    vm.deal(eve, 1 ether);

    vm.startPrank(creator);
    WinningEmpire.set(1);

    Empire.setPointsIssued(1, 100 ether);

    PointsMap.setValue(1, addressToId(alice), playerPoints);
    PointsMap.setValue(1, addressToId(bob), playerPoints);
    PointsMap.setValue(1, addressToId(eve), playerPoints);
    Empire.setPointsIssued(1, totalPoints);
    vm.stopPrank();
    vm.prank(alice);
    world.Empires__withdrawEarnings();
    vm.prank(bob);
    world.Empires__withdrawEarnings();
    // 0.1% difference
    assertApproxEqRel(alice.balance, bob.balance, .001e18, "balances not approximately equal");

    assertEq(
      Empire.getPointsIssued(1),
      playerPoints == 0 ? totalPoints : totalPoints - (playerPoints * 2),
      "empire points"
    );
  }
}
