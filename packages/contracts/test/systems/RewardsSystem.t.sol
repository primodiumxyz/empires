// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Balances } from "@latticexyz/world/src/codegen/tables/Balances.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";

import { addressToId } from "src/utils.sol";
import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { P_GameConfig, WinningEmpire, Empire, P_PointConfig } from "codegen/index.sol";
import { PointsMap } from "adts/PointsMap.sol";
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

  // function testClaimVictoryNotGameOver() public {
  //   vm.expectRevert("[RewardsSystem] Game is not over");
  //   world.Empires__claimVictory(EEmpire.Red);
  // }

  function setGameover() internal {
    uint256 endBlock = P_GameConfig.getGameOverBlock();
    vm.roll(endBlock + 1);
  }

  // function testClaimVictoryAlreadyClaimed() public {
  //   setGameover();
  //   world.Empires__claimVictory(EEmpire.Red);
  //   vm.expectRevert("[RewardsSystem] Victory has already been claimed");
  //   world.Empires__claimVictory(EEmpire.Blue);
  // }

  // function testClaimVictory() public {
  //   setGameover();
  //   world.Empires__claimVictory(EEmpire.Red);
  //   assertEq(WinningEmpire.get(), EEmpire.Red);
  // }

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
    setGameover();

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
