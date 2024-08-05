// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { addressToId } from "src/utils.sol";

import { Empire, Player, P_PointConfig } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";
import { LibPoint } from "libraries/LibPoint.sol";
import { PointsMap } from "adts/PointsMap.sol";

contract LibPointTest is PrimodiumTest {
  bytes32 planetId;
  bytes32 aliceId;
  bytes32 bobId;
  uint256 pointUnit;
  function setUp() public override {
    super.setUp();
    aliceId = addressToId(alice);
    bobId = addressToId(bob);
    pointUnit = P_PointConfig.getPointUnit();
  }

  function testInitEmptyEmpireIssuedPoints() public {
    for (uint i = 0; i < uint256(EEmpire.LENGTH); i++) {
      assertEq(Empire.getPointsIssued(EEmpire(i)), 0, "Empire points at game start should be 0");
    }
  }

  function testIssuePoints() public {
    vm.startPrank(creator);
    LibPoint.issuePoints(EEmpire.Red, aliceId, 100 * pointUnit);
    assertEq(Empire.getPointsIssued(EEmpire.Red), 100 * pointUnit, "Empire points issued should be 100");
    assertEq(PointsMap.getValue(EEmpire.Red, aliceId), 100 * pointUnit, "Alice's Red Empire points should be 100");
    assertEq(PointsMap.getValue(EEmpire.Blue, aliceId), 0, "Alice's Blue Empire points should be 0");
    assertEq(PointsMap.getValue(EEmpire.Green, aliceId), 0, "Alice's Green Empire points should be 0");
    assertEq(PointsMap.getValue(EEmpire.Red, bobId), 0, "Bob's Red Empire points should be 0");
  }

  function testSequentialIssuePoints() public {
    testIssuePoints(); // Run previous test to set state. Alice has 100 Red Empire points.

    vm.startPrank(creator);
    LibPoint.issuePoints(EEmpire.Red, aliceId, 1 * pointUnit);
    assertEq(Empire.getPointsIssued(EEmpire.Red), 101 * pointUnit, "Empire points issued should be 101");
    assertEq(PointsMap.getValue(EEmpire.Red, aliceId), 101 * pointUnit, "Alice's Red Empire points should be 101");
    assertEq(PointsMap.getValue(EEmpire.Blue, aliceId), 0, "Alice's Blue Empire points should be 0");
    assertEq(PointsMap.getValue(EEmpire.Green, aliceId), 0, "Alice's Green Empire points should be 0");
    assertEq(PointsMap.getValue(EEmpire.Red, bobId), 0, "Bob's Red Empire points should be 0");
  }

  function testIssueUniqueEmpirePoints() public {
    testSequentialIssuePoints(); // Run previous tests to set state. Alice has 101 Red Empire points.

    vm.startPrank(creator);
    LibPoint.issuePoints(EEmpire.Green, aliceId, 5 * pointUnit);
    assertEq(Empire.getPointsIssued(EEmpire.Red), 101 * pointUnit, "Red Empire points issued should be 101");
    assertEq(Empire.getPointsIssued(EEmpire.Green), 5 * pointUnit, "Green Empire points issued should be 5");
    assertEq(PointsMap.getValue(EEmpire.Red, aliceId), 101 * pointUnit, "Alice's Red Empire points should be 101");
    assertEq(PointsMap.getValue(EEmpire.Blue, aliceId), 0, "Alice's Blue Empire points should be 0");
    assertEq(PointsMap.getValue(EEmpire.Green, aliceId), 5 * pointUnit, "Alice's Green Empire points should be 5");
    assertEq(PointsMap.getValue(EEmpire.Red, bobId), 0, "Bob's Red Empire points should be 0");
  }

  function testIndependentPlayerPoints() public {
    testIssueUniqueEmpirePoints(); // Run previous tests to set state. Alice has 101 Red Empire points and 5 Green Empire points.

    vm.startPrank(creator);
    LibPoint.issuePoints(EEmpire.Green, bobId, 7 * pointUnit);
    assertEq(Empire.getPointsIssued(EEmpire.Red), 101 * pointUnit, "Red Empire points issued should be 101");
    assertEq(Empire.getPointsIssued(EEmpire.Green), 12 * pointUnit, "Green Empire points issued should be 12");
    assertEq(PointsMap.getValue(EEmpire.Red, aliceId), 101 * pointUnit, "Alice's Red Empire points should be 101");
    assertEq(PointsMap.getValue(EEmpire.Blue, aliceId), 0, "Alice's Blue Empire points should be 0");
    assertEq(PointsMap.getValue(EEmpire.Green, aliceId), 5 * pointUnit, "Alice's Green Empire points should be 5");
    assertEq(PointsMap.getValue(EEmpire.Red, bobId), 0, "Bob's Red Empire points should be 0");
    assertEq(PointsMap.getValue(EEmpire.Blue, bobId), 0, "Bob's Blue Empire points should be 0");
    assertEq(PointsMap.getValue(EEmpire.Green, bobId), 7 * pointUnit, "Bob's Green Empire points should be 7");
  }

  function testRemovePoints() public {
    vm.startPrank(creator);
    LibPoint.issuePoints(EEmpire.Red, aliceId, 100 * pointUnit);
    LibPoint.removePoints(EEmpire.Red, aliceId, 99 * pointUnit);
    assertEq(Empire.getPointsIssued(EEmpire.Red), 1 * pointUnit, "Empire points issued should be 1");
    assertEq(PointsMap.getValue(EEmpire.Red, aliceId), 1 * pointUnit, "Alice's Red Empire points should be 1");
    LibPoint.removePoints(EEmpire.Red, aliceId, 1 * pointUnit);
    assertEq(Empire.getPointsIssued(EEmpire.Red), 0, "Empire points issued should be 0");
    assertEq(PointsMap.getValue(EEmpire.Red, aliceId), 0, "Alice's Red Empire points should be 0");

    LibPoint.issuePoints(EEmpire.Red, aliceId, 10 * pointUnit);
    LibPoint.issuePoints(EEmpire.Green, aliceId, 30 * pointUnit);
    LibPoint.issuePoints(EEmpire.Red, bobId, 1 * pointUnit);
    LibPoint.issuePoints(EEmpire.Green, bobId, 3 * pointUnit);
    LibPoint.removePoints(EEmpire.Green, aliceId, 2 * pointUnit);

    assertEq(Empire.getPointsIssued(EEmpire.Red), 11 * pointUnit, "Red Empire points issued should be 11");
    assertEq(Empire.getPointsIssued(EEmpire.Green), 31 * pointUnit, "Green Empire points issued should be 31");
    assertEq(PointsMap.getValue(EEmpire.Red, aliceId), 10 * pointUnit, "Alice's Red Empire points should be 10");
    assertEq(PointsMap.getValue(EEmpire.Green, aliceId), 28 * pointUnit, "Alice's Green Empire points should be 28");
    assertEq(PointsMap.getValue(EEmpire.Red, bobId), 1 * pointUnit, "Bob's Red Empire points should be 1");
    assertEq(PointsMap.getValue(EEmpire.Green, bobId), 3 * pointUnit, "Bob's Green Empire points should be 3");
  }

  function testFailRemovePoints() public {
    vm.startPrank(creator);
    LibPoint.issuePoints(EEmpire.Red, aliceId, 100 * pointUnit);
    LibPoint.removePoints(EEmpire.Red, aliceId, 101 * pointUnit);
  }

  function testFailRemoveTooManyEmpirePoints() public {
    vm.startPrank(creator);
    LibPoint.issuePoints(EEmpire.Red, aliceId, 100 * pointUnit);
    Empire.setPointsIssued(EEmpire.Red, 99 * pointUnit);
    LibPoint.removePoints(EEmpire.Red, aliceId, 100 * pointUnit);
  }
}
