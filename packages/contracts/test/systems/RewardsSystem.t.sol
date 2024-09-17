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
import { EEmpire } from "codegen/common.sol";

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

  function setTimeGameover() internal {
    uint256 endBlock = P_GameConfig.getGameOverBlock();
    vm.roll(endBlock + 1);
  }

  function getEmpireCitadelPlanets(EEmpire empire) internal view returns (uint256) {
    bytes32[] memory citadelPlanets = CitadelPlanetsSet.getCitadelPlanetIds();
    uint256 EMPIRE_COUNT = P_GameConfig.getEmpireCount();
    uint256[] memory citadelPlanetsPerEmpire = new uint256[](EMPIRE_COUNT);
    for (uint256 i = 0; i < citadelPlanets.length; i++) {
      EEmpire owningEmpire = Planet.getEmpireId(citadelPlanets[i]);
      citadelPlanetsPerEmpire[uint256(owningEmpire)]++;
    }
    return citadelPlanetsPerEmpire[uint256(empire)];
  }

  function findCitadelPlanet(EEmpire empire) internal view returns (bytes32) {
    bytes32[] memory citadelPlanets = CitadelPlanetsSet.getCitadelPlanetIds();
    for (uint256 i = 0; i < citadelPlanets.length; i++) {
      EEmpire owningEmpire = Planet.getEmpireId(citadelPlanets[i]);
      if (owningEmpire == empire) {
        return citadelPlanets[i];
      }
    }
    revert("[RewardsSystemTest] No citadel planet found");
  }

  function findUnownedNonCitadelPlanet() internal view returns (bytes32) {
    bytes32[] memory planets = PlanetsSet.getPlanetIds();
    for (uint256 i = 0; i < planets.length; i++) {
      if (!Planet.getIsCitadel(planets[i]) && Planet.getEmpireId(planets[i]) == EEmpire.NULL) {
        return planets[i];
      }
    }
    revert("[RewardsSystemTest] No non-citadel planet found");
  }

  function testWithdrawEarningsTimeVictoryPseudorandomCondition() public {
    setTimeGameover();
    world.Empires__withdrawEarnings();
    uint256 winningEmpire = uint256(WinningEmpire.get());
    assertTrue(0 < winningEmpire && winningEmpire <= P_GameConfig.getEmpireCount(), "WinningEmpire is not in range");
  }

  function testWithdrawEarningsTimeVictoryPointsIssuedCondition() public {
    setTimeGameover();
    Empire.setPointsIssued(EEmpire.Red, 1);
    Empire.setPointsIssued(EEmpire.Blue, 4);
    Empire.setPointsIssued(EEmpire.Green, 3);
    world.Empires__withdrawEarnings();
    assertEq(WinningEmpire.get(), EEmpire.Blue);
  }

  function testWithdrawEarningsTimeVictoryTiedCitadelCondition() public {
    bytes32 extraCitadelPlanet = findUnownedNonCitadelPlanet();
    Planet.setEmpireId(extraCitadelPlanet, EEmpire.Green);
    EmpirePlanetsSet.add(EEmpire.Green, extraCitadelPlanet);
    EmpirePlanetsSet.remove(EEmpire.NULL, extraCitadelPlanet);
    setTimeGameover();
    world.Empires__withdrawEarnings();
    assertEq(WinningEmpire.get(), EEmpire.Green);
  }

  function testWithdrawEarningsTimeVictory() public {
    bytes32 extraCitadelPlanet = findCitadelPlanet(EEmpire.NULL);
    Planet.setEmpireId(extraCitadelPlanet, EEmpire.Blue);
    EmpirePlanetsSet.add(EEmpire.Blue, extraCitadelPlanet);
    EmpirePlanetsSet.remove(EEmpire.NULL, extraCitadelPlanet);
    setTimeGameover();
    world.Empires__withdrawEarnings();
    assertEq(WinningEmpire.get(), EEmpire.Blue);
  }

  function testWithdrawEarningsDominationVictory() public {
    bytes32[] memory citadelPlanets = CitadelPlanetsSet.getCitadelPlanetIds();
    for (uint256 i = 0; i < citadelPlanets.length; i++) {
      EEmpire prevEmpire = Planet.getEmpireId(citadelPlanets[i]);
      Planet.setEmpireId(citadelPlanets[i], EEmpire.Blue);
      EmpirePlanetsSet.add(EEmpire.Blue, citadelPlanets[i]);
      EmpirePlanetsSet.remove(prevEmpire, citadelPlanets[i]);
    }
    // Do NOT add setTimeGameover() here, because we want to test the case where the time is not up yet
    world.Empires__withdrawEarnings();
    assertEq(WinningEmpire.get(), EEmpire.Blue);
  }

  function testWithdrawEarningsVictoryAlreadyClaimed() public {
    testWithdrawEarningsDominationVictory();
    bytes32[] memory citadelPlanets = CitadelPlanetsSet.getCitadelPlanetIds();
    for (uint256 i = 0; i < citadelPlanets.length; i++) {
      EEmpire prevEmpire = Planet.getEmpireId(citadelPlanets[i]);
      Planet.setEmpireId(citadelPlanets[i], EEmpire.Green);
      EmpirePlanetsSet.add(EEmpire.Green, citadelPlanets[i]);
      EmpirePlanetsSet.remove(prevEmpire, citadelPlanets[i]);
    }
    setTimeGameover();
    world.Empires__withdrawEarnings();
    assertEq(WinningEmpire.get(), EEmpire.Blue, "Victory should be locked from domination");
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
    setTimeGameover();
    vm.startPrank(creator);
    WinningEmpire.set(EEmpire.Red);
    P_PointConfig.setPointRake(0); // out of 10_000

    PointsMap.setValue(EEmpire.Red, addressToId(alice), alicePoints);
    Empire.setPointsIssued(EEmpire.Red, totalPoints);

    uint256 alicePrevBalance = alice.balance;
    vm.stopPrank();
    vm.prank(alice);
    world.Empires__withdrawEarnings();

    uint256 aliceTotal = (value * alicePoints) / totalPoints;
    assertEq(alice.balance, aliceTotal + alicePrevBalance, "alice balance");
    assertEq(Balances.get(EMPIRES_NAMESPACE_ID), value - aliceTotal, "empire balance");

    assertEq(PointsMap.getValue(EEmpire.Red, addressToId(alice)), 0, "alice points");
    assertEq(PlayersMap.get(addressToId(alice)).gain, aliceTotal, "alice profit");

    // should be 0 because all points were withdrawn (or not issued in the first place)
    assertEq(Empire.getPointsIssued(EEmpire.Red), alicePoints == 0 ? totalPoints : 0, "empire points");
  }

  // function testWithdrawEarningsEqualAfterWithdrawal(uint256 playerPoints, uint256 totalPoints) public {
  function testWithdrawEarningsEqualAfterWithdrawal() public {
    uint256 playerPoints = 0;
    uint256 totalPoints = 1;

    vm.assume(totalPoints > 0);
    vm.assume(playerPoints <= totalPoints / 3);
    vm.assume(totalPoints < 100 ether);

    sendEther(alice, 1 ether);
    setTimeGameover();

    vm.deal(alice, 1 ether);
    vm.deal(bob, 1 ether);
    vm.deal(eve, 1 ether);

    vm.startPrank(creator);
    WinningEmpire.set(EEmpire.Red);

    Empire.setPointsIssued(EEmpire.Red, 100 ether);

    PointsMap.setValue(EEmpire.Red, addressToId(alice), playerPoints);
    PointsMap.setValue(EEmpire.Red, addressToId(bob), playerPoints);
    PointsMap.setValue(EEmpire.Red, addressToId(eve), playerPoints);
    Empire.setPointsIssued(EEmpire.Red, totalPoints);
    vm.stopPrank();
    vm.prank(alice);
    world.Empires__withdrawEarnings();
    vm.prank(bob);
    world.Empires__withdrawEarnings();
    // 0.1% difference
    assertApproxEqRel(alice.balance, bob.balance, .001e18, "balances not approximately equal");

    assertEq(
      Empire.getPointsIssued(EEmpire.Red),
      playerPoints == 0 ? totalPoints : totalPoints - (playerPoints * 2),
      "empire points"
    );
  }
}
