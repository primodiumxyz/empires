// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";

import { Empire, Value_PointsMapData } from "codegen/index.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { EEmpire } from "codegen/common.sol";

contract PointsMapTest is PrimodiumTest {
  bytes32 playerId = "playerId";
  bytes32 playerId2 = "playerId2";

  function setUp() public override {
    super.setUp();
    vm.startPrank(creator);
  }

  function testHas() public {
    PointsMap.setValue(EEmpire.Red, playerId, 50);
    assertTrue(PointsMap.has(EEmpire.Red, playerId));
    assertFalse(PointsMap.has(EEmpire.Blue, playerId));
  }

  function testIncreaseScore() public {
    PointsMap.setValue(EEmpire.Red, playerId, 50);
    assertEq(PointsMap.getValue(EEmpire.Red, playerId), 50);
    assertEq(Empire.getPointsIssued(EEmpire.Red), 50);
  }

  function testChangeScore() public {
    PointsMap.setValue(EEmpire.Red, playerId, 50);
    PointsMap.setValue(EEmpire.Red, playerId, 75);
    assertEq(PointsMap.getValue(EEmpire.Red, playerId), 75);
    assertEq(Empire.getPointsIssued(EEmpire.Red), 75);

    PointsMap.setValue(EEmpire.Red, playerId2, 50);
    assertEq(PointsMap.getValue(EEmpire.Red, playerId2), 50);
    assertEq(Empire.getPointsIssued(EEmpire.Red), 125);

    PointsMap.setValue(EEmpire.Red, playerId, 15);
    assertEq(PointsMap.getValue(EEmpire.Red, playerId), 15);
    assertEq(Empire.getPointsIssued(EEmpire.Red), 65);
  }

  function testGetAll() public {
    PointsMap.setValue(EEmpire.Red, playerId, 50);
    PointsMap.setValue(EEmpire.Red, playerId2, 20);
    bytes32[] memory players = PointsMap.keys(EEmpire.Red);
    Value_PointsMapData[] memory values = PointsMap.values(EEmpire.Red);
    assertEq(players.length, 2);
    assertEq(values.length, 2);
  }

  function testRemove() public {
    PointsMap.setValue(EEmpire.Red, playerId, 50);
    PointsMap.remove(EEmpire.Red, playerId);
    assertFalse(PointsMap.has(EEmpire.Red, playerId));
    assertEq(Empire.getPointsIssued(EEmpire.Red), 0);
  }

  function testClear() public {
    PointsMap.setValue(EEmpire.Red, playerId, 50);
    PointsMap.setValue(EEmpire.Red, playerId2, 20);
    PointsMap.clear(EEmpire.Red);
    bytes32[] memory players = PointsMap.keys(EEmpire.Red);
    Value_PointsMapData[] memory values = PointsMap.values(EEmpire.Red);
    assertEq(players.length, 0);
    assertEq(values.length, 0);
    assertEq(Empire.getPointsIssued(EEmpire.Red), 0);
  }
}
