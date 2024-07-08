// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { addressToId } from "src/utils.sol";

import { Faction, Player } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";
import { LibPoint } from "libraries/LibPoint.sol";
import { PointsMap } from "adts/PointsMap.sol";

contract LibPointTest is PrimodiumTest {
  bytes32 planetId;
  bytes32 aliceId;
  bytes32 bobId;
  function setUp() public override {
    super.setUp();
    aliceId = addressToId(alice);
    bobId = addressToId(bob);
  }

  function testInitEmptyEmpireIssuedPoints() public {
    for (uint i = 0; i < uint256(EEmpire.LENGTH); i++) {
      assertEq(Faction.getPointsIssued(EEmpire(i)), 0, "Empire points at game start should be 0");
    }
  }

  function testIssuePoints() public {
    vm.startPrank(creator);
    LibPoint.issuePoints(EEmpire.Red, aliceId, 100);
    assertEq(Faction.getPointsIssued(EEmpire.Red), 100, "Empire points issued should be 100");
    assertEq(PointsMap.get(EEmpire.Red, aliceId), 100, "Alice's Red Empire points should be 100");
    assertEq(PointsMap.get(EEmpire.Blue, aliceId), 0, "Alice's Blue Empire points should be 0");
    assertEq(PointsMap.get(EEmpire.Green, aliceId), 0, "Alice's Green Empire points should be 0");
    assertEq(PointsMap.get(EEmpire.Red, bobId), 0, "Bob's Red Empire points should be 0");
  }

  function testSequentialIssuePoints() public {
    testIssuePoints(); // Run previous test to set state. Alice has 100 Red Empire points.

    vm.startPrank(creator);
    LibPoint.issuePoints(EEmpire.Red, aliceId, 1);
    assertEq(Faction.getPointsIssued(EEmpire.Red), 101, "Empire points issued should be 101");
    assertEq(PointsMap.get(EEmpire.Red, aliceId), 101, "Alice's Red Empire points should be 101");
    assertEq(PointsMap.get(EEmpire.Blue, aliceId), 0, "Alice's Blue Empire points should be 0");
    assertEq(PointsMap.get(EEmpire.Green, aliceId), 0, "Alice's Green Empire points should be 0");
    assertEq(PointsMap.get(EEmpire.Red, bobId), 0, "Bob's Red Empire points should be 0");
  }

  function testIssueUniqueEmpirePoints() public {
    testSequentialIssuePoints(); // Run previous tests to set state. Alice has 101 Red Empire points.

    vm.startPrank(creator);
    LibPoint.issuePoints(EEmpire.Green, aliceId, 5);
    assertEq(Faction.getPointsIssued(EEmpire.Red), 101, "Red Empire points issued should be 101");
    assertEq(Faction.getPointsIssued(EEmpire.Green), 5, "Green Empire points issued should be 5");
    assertEq(PointsMap.get(EEmpire.Red, aliceId), 101, "Alice's Red Empire points should be 101");
    assertEq(PointsMap.get(EEmpire.Blue, aliceId), 0, "Alice's Blue Empire points should be 0");
    assertEq(PointsMap.get(EEmpire.Green, aliceId), 5, "Alice's Green Empire points should be 5");
    assertEq(PointsMap.get(EEmpire.Red, bobId), 0, "Bob's Red Empire points should be 0");
  }

  function testIndependentPlayerPoints() public {
    testIssueUniqueEmpirePoints(); // Run previous tests to set state. Alice has 101 Red Empire points and 5 Green Empire points.

    vm.startPrank(creator);
    LibPoint.issuePoints(EEmpire.Green, bobId, 7);
    assertEq(Faction.getPointsIssued(EEmpire.Red), 101, "Red Empire points issued should be 101");
    assertEq(Faction.getPointsIssued(EEmpire.Green), 12, "Green Empire points issued should be 12");
    assertEq(PointsMap.get(EEmpire.Red, aliceId), 101, "Alice's Red Empire points should be 101");
    assertEq(PointsMap.get(EEmpire.Blue, aliceId), 0, "Alice's Blue Empire points should be 0");
    assertEq(PointsMap.get(EEmpire.Green, aliceId), 5, "Alice's Green Empire points should be 5");
    assertEq(PointsMap.get(EEmpire.Red, bobId), 0, "Bob's Red Empire points should be 0");
    assertEq(PointsMap.get(EEmpire.Blue, bobId), 0, "Bob's Blue Empire points should be 0");
    assertEq(PointsMap.get(EEmpire.Green, bobId), 7, "Bob's Green Empire points should be 7");
  }

  function testRemovePoints() public {
    vm.startPrank(creator);
    LibPoint.issuePoints(EEmpire.Red, aliceId, 100);
    LibPoint.removePoints(EEmpire.Red, aliceId, 99);
    assertEq(Faction.getPointsIssued(EEmpire.Red), 1, "Empire points issued should be 1");
    assertEq(PointsMap.get(EEmpire.Red, aliceId), 1, "Alice's Red Empire points should be 1");
    LibPoint.removePoints(EEmpire.Red, aliceId, 1);
    assertEq(Faction.getPointsIssued(EEmpire.Red), 0, "Empire points issued should be 0");
    assertEq(PointsMap.get(EEmpire.Red, aliceId), 0, "Alice's Red Empire points should be 0");

    LibPoint.issuePoints(EEmpire.Red, aliceId, 10);
    LibPoint.issuePoints(EEmpire.Green, aliceId, 30);
    LibPoint.issuePoints(EEmpire.Red, bobId, 1);
    LibPoint.issuePoints(EEmpire.Green, bobId, 3);
    LibPoint.removePoints(EEmpire.Green, aliceId, 2);

    assertEq(Faction.getPointsIssued(EEmpire.Red), 11, "Red Empire points issued should be 11");
    assertEq(Faction.getPointsIssued(EEmpire.Green), 31, "Green Empire points issued should be 31");
    assertEq(PointsMap.get(EEmpire.Red, aliceId), 10, "Alice's Red Empire points should be 10");
    assertEq(PointsMap.get(EEmpire.Green, aliceId), 28, "Alice's Green Empire points should be 28");
    assertEq(PointsMap.get(EEmpire.Red, bobId), 1, "Bob's Red Empire points should be 1");
    assertEq(PointsMap.get(EEmpire.Green, bobId), 3, "Bob's Green Empire points should be 3");
  }

  function testFailRemovePoints() public {
    vm.startPrank(creator);
    LibPoint.issuePoints(EEmpire.Red, aliceId, 100);
    LibPoint.removePoints(EEmpire.Red, aliceId, 101);
  }

  function testFailRemoveTooManyEmpirePoints() public {
    vm.startPrank(creator);
    LibPoint.issuePoints(EEmpire.Red, aliceId, 100);
    Faction.setPointsIssued(EEmpire.Red, 99);
    LibPoint.removePoints(EEmpire.Red, aliceId, 100);
  }
}
