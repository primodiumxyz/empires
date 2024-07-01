// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { addressToId } from "src/utils.sol";
import { EMPIRE_COUNT } from "src/constants.sol";

import { Faction, Player } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";
import { LibPoint } from "libraries/LibPoint.sol";
 
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
    for (uint i = 0; i < EMPIRE_COUNT; i++) {
      assertEq(Faction.getPointsIssued(EEmpire(i)), 0, "Empire points at game start should be 0");
    }
  }

  function testIssuePointsNullEmpireFail() public {
    vm.startPrank(creator);
    vm.expectRevert("[LibPoint] Invalid empire");
    LibPoint.issuePoints(EEmpire.NULL, aliceId, 100);
  }

  function testIssuePoints() public {
    vm.startPrank(creator);
    LibPoint.issuePoints(EEmpire.Red, aliceId, 100);
    uint256[] memory alicePoints = LibPoint.getPlayerPoints(aliceId);
    uint256[] memory bobPoints = LibPoint.getPlayerPoints(bobId);
    assertEq(Faction.getPointsIssued(EEmpire.Red), 100, "Empire points issued should be 100");
    assertEq(alicePoints[uint256(EEmpire.Red)], 100, "Alice's Red Empire points should be 100");
    assertEq(alicePoints[uint256(EEmpire.Blue)], 0, "Alice's Blue Empire points should be 0");
    assertEq(alicePoints[uint256(EEmpire.Green)], 0, "Alice's Green Empire points should be 0");
    assertEq(bobPoints[uint256(EEmpire.Red)], 0, "Bob's Red Empire points should be 0");
  }

  function testSequentialIssuePoints() public {
    testIssuePoints(); // Run previous test to set state. Alice has 100 Red Empire points.
    
    vm.startPrank(creator);
    LibPoint.issuePoints(EEmpire.Red, aliceId, 1);
    uint256[] memory alicePoints = LibPoint.getPlayerPoints(aliceId);
    uint256[] memory bobPoints = LibPoint.getPlayerPoints(bobId);
    assertEq(Faction.getPointsIssued(EEmpire.Red), 101, "Empire points issued should be 101");
    assertEq(alicePoints[uint256(EEmpire.Red)], 101, "Alice's Red Empire points should be 101");
    assertEq(alicePoints[uint256(EEmpire.Blue)], 0, "Alice's Blue Empire points should be 0");
    assertEq(alicePoints[uint256(EEmpire.Green)], 0, "Alice's Green Empire points should be 0");
    assertEq(bobPoints[uint256(EEmpire.Red)], 0, "Bob's Red Empire points should be 0");
  }

  function testIssueUniqueEmpirePoints() public {
    testSequentialIssuePoints(); // Run previous tests to set state. Alice has 101 Red Empire points.

    vm.startPrank(creator);
    LibPoint.issuePoints(EEmpire.Green, aliceId, 5);
    uint256[] memory alicePoints = LibPoint.getPlayerPoints(aliceId);
    uint256[] memory bobPoints = LibPoint.getPlayerPoints(bobId);
    assertEq(Faction.getPointsIssued(EEmpire.Red), 101, "Red Empire points issued should be 101");
    assertEq(Faction.getPointsIssued(EEmpire.Green), 5, "Green Empire points issued should be 5");
    assertEq(alicePoints[uint256(EEmpire.Red)], 101, "Alice's Red Empire points should be 101");
    assertEq(alicePoints[uint256(EEmpire.Blue)], 0, "Alice's Blue Empire points should be 0");
    assertEq(alicePoints[uint256(EEmpire.Green)], 5, "Alice's Green Empire points should be 5");
    assertEq(bobPoints[uint256(EEmpire.Red)], 0, "Bob's Red Empire points should be 0");
  }

  function testIndependentPlayerPoints() public {
    testIssueUniqueEmpirePoints(); // Run previous tests to set state. Alice has 101 Red Empire points and 5 Green Empire points.
    
    vm.startPrank(creator);
    LibPoint.issuePoints(EEmpire.Green, bobId, 7);
    uint256[] memory alicePoints = LibPoint.getPlayerPoints(aliceId);
    uint256[] memory bobPoints = LibPoint.getPlayerPoints(bobId);
    assertEq(Faction.getPointsIssued(EEmpire.Red), 101, "Red Empire points issued should be 101");
    assertEq(Faction.getPointsIssued(EEmpire.Green), 12, "Green Empire points issued should be 12");
    assertEq(alicePoints[uint256(EEmpire.Red)], 101, "Alice's Red Empire points should be 101");
    assertEq(alicePoints[uint256(EEmpire.Blue)], 0, "Alice's Blue Empire points should be 0");
    assertEq(alicePoints[uint256(EEmpire.Green)], 5, "Alice's Green Empire points should be 5");
    assertEq(bobPoints[uint256(EEmpire.Red)], 0, "Bob's Red Empire points should be 0");
    assertEq(bobPoints[uint256(EEmpire.Blue)], 0, "Bob's Blue Empire points should be 0");
    assertEq(bobPoints[uint256(EEmpire.Green)], 7, "Bob's Green Empire points should be 7");
  }
}