// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { RESOURCE_SYSTEM, RESOURCE_NAMESPACE } from "@latticexyz/world/src/worldResourceTypes.sol";
import { Balances } from "@latticexyz/world/src/codegen/tables/Balances.sol";
import { ResourceId, WorldResourceIdLib, WorldResourceIdInstance } from "@latticexyz/world/src/WorldResourceId.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { ROOT_NAMESPACE, ROOT_NAME } from "@latticexyz/world/src/constants.sol";
import { ROOT_NAMESPACE_ID } from "@latticexyz/world/src/constants.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";

import { addressToId } from "src/utils.sol";
import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { P_GameConfig, WinningEmpire, Faction, P_PointConfig } from "codegen/index.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { EEmpire } from "codegen/common.sol";

contract WorldBalanceTestSystem is System {
  function echoValue() public payable returns (uint256) {
    return _msgValue();
  }
}

contract RewardsSystemTest is PrimodiumTest {
  bytes32 planetId;
  uint256 turnLength = 100;
  uint256 value = 100 ether;

  WorldBalanceTestSystem public system = new WorldBalanceTestSystem();

  ResourceId public systemId =
    WorldResourceIdLib.encode({
      typeId: RESOURCE_SYSTEM,
      namespace: WorldResourceIdInstance.getNamespace(EMPIRES_NAMESPACE_ID),
      name: "testSystem"
    });

  function setUp() public override {
    super.setUp();

    vm.startPrank(creator);
    world.registerSystem(systemId, system, true);
    world.registerFunctionSelector(systemId, "echoValue()");
  }

  function testClaimVictoryNotGameOver() public {
    vm.expectRevert("[RewardsSystem] Game is not over");
    world.Empires__claimVictory(EEmpire.Red);
  }

  function setGameover() internal {
    uint256 endBlock = P_GameConfig.getGameOverBlock();
    vm.roll(endBlock + 1);
  }

  function testClaimVictoryAlreadyClaimed() public {
    setGameover();
    world.Empires__claimVictory(EEmpire.Red);
    vm.expectRevert("[RewardsSystem] Victory has already been claimed");
    world.Empires__claimVictory(EEmpire.Blue);
  }

  function testClaimVictory() public {
    setGameover();
    world.Empires__claimVictory(EEmpire.Red);
    assertEq(WinningEmpire.get(), EEmpire.Red);
  }

  function testSendEther() public {
    bytes memory data = world.call{ value: value }(systemId, abi.encodeCall(system.echoValue, ()));
    assertEq(abi.decode(data, (uint256)), value);

    assertEq(Balances.get(EMPIRES_NAMESPACE_ID), value);
  }

  function testTakeRake() public {
    testSendEther();
    setGameover();
    world.Empires__claimVictory(EEmpire.Red);

    Faction.setPointsIssued(EEmpire.Red, 100 ether);

    P_PointConfig.setPointRake(5_000); // out of 10_000

    world.Empires__withdrawEarnings();

    assertEq(Balances.get(EMPIRES_NAMESPACE_ID), value / 2);
    assertEq(Balances.get(ADMIN_NAMESPACE_ID), value / 2);

    // should not take rake again
    world.Empires__withdrawEarnings();

    assertEq(Balances.get(EMPIRES_NAMESPACE_ID), value / 2);
    assertEq(Balances.get(ADMIN_NAMESPACE_ID), value / 2);
  }

  function testWithdrawEarnings(uint256 alicePoints, uint256 totalPoints) public {
    vm.assume(totalPoints > 0);
    vm.assume(alicePoints <= totalPoints);
    vm.assume(totalPoints < 100 ether);
    testSendEther();
    setGameover();
    world.Empires__claimVictory(EEmpire.Red);

    P_PointConfig.setPointRake(0); // out of 10_000

    PointsMap.set(EEmpire.Red, addressToId(alice), alicePoints);
    Faction.setPointsIssued(EEmpire.Red, totalPoints);

    uint256 alicePrevBalance = alice.balance;
    vm.stopPrank();
    vm.prank(alice);
    world.Empires__withdrawEarnings();

    uint256 aliceTotal = (value * alicePoints) / totalPoints;
    assertEq(alice.balance, aliceTotal + alicePrevBalance, "alice balance");
    assertEq(Balances.get(EMPIRES_NAMESPACE_ID), value - aliceTotal, "empire balance");

    assertEq(PointsMap.get(EEmpire.Red, addressToId(alice)), 0, "alice points");

    // should be 0 because all points were withdrawn (or not issued in the first place)
    assertEq(Faction.getPointsIssued(EEmpire.Red), alicePoints == 0 ? totalPoints : 0, "empire points");
  }

  function testWithdrawEarningsEqualAfterWithdrawal(uint256 playerPoints, uint256 totalPoints) public {
    vm.assume(totalPoints > 0);
    vm.assume(playerPoints <= totalPoints / 3);
    vm.assume(totalPoints < 100 ether);

    testSendEther();
    setGameover();
    world.Empires__claimVictory(EEmpire.Red);

    Faction.setPointsIssued(EEmpire.Red, 100 ether);

    PointsMap.set(EEmpire.Red, addressToId(alice), playerPoints);
    PointsMap.set(EEmpire.Red, addressToId(bob), playerPoints);
    PointsMap.set(EEmpire.Red, addressToId(eve), playerPoints);
    Faction.setPointsIssued(EEmpire.Red, totalPoints);
    vm.stopPrank();
    vm.prank(alice);
    world.Empires__withdrawEarnings();
    vm.prank(bob);
    world.Empires__withdrawEarnings();
    // 0.1% difference
    assertApproxEqRel(alice.balance, bob.balance, .001e18);

    assertEq(
      Faction.getPointsIssued(EEmpire.Red),
      playerPoints == 0 ? totalPoints : totalPoints - (playerPoints * 2),
      "empire points"
    );
  }
}
