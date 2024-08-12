// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";

import { Empire, Value_PointsMapData } from "codegen/index.sol";
import { PointsMap } from "adts/PointsMap.sol";

contract PointsMapTest is PrimodiumTest {
  bytes32 playerId = "playerId";
  bytes32 playerId2 = "playerId2";

  function setUp() public override {
    super.setUp();
    vm.startPrank(creator);
  }

  function testHas() public {
    PointsMap.setValue(1, playerId, 50);
    assertTrue(PointsMap.has(1, playerId));
    assertFalse(PointsMap.has(2, playerId));
  }

  function testIncreaseScore() public {
    PointsMap.setValue(1, playerId, 50);
    assertEq(PointsMap.getValue(1, playerId), 50);
    assertEq(Empire.getPointsIssued(1), 50);
  }

  function testChangeScore() public {
    PointsMap.setValue(1, playerId, 50);
    PointsMap.setValue(1, playerId, 75);
    assertEq(PointsMap.getValue(1, playerId), 75);
    assertEq(Empire.getPointsIssued(1), 75);

    PointsMap.setValue(1, playerId2, 50);
    assertEq(PointsMap.getValue(1, playerId2), 50);
    assertEq(Empire.getPointsIssued(1), 125);

    PointsMap.setValue(1, playerId, 15);
    assertEq(PointsMap.getValue(1, playerId), 15);
    assertEq(Empire.getPointsIssued(1), 65);
  }

  function testGetAll() public {
    PointsMap.setValue(1, playerId, 50);
    PointsMap.setValue(1, playerId2, 20);
    bytes32[] memory players = PointsMap.keys(1);
    Value_PointsMapData[] memory values = PointsMap.values(1);
    assertEq(players.length, 2);
    assertEq(values.length, 2);
  }

  function testRemove() public {
    PointsMap.setValue(1, playerId, 50);
    PointsMap.remove(1, playerId);
    assertFalse(PointsMap.has(1, playerId));
    assertEq(Empire.getPointsIssued(1), 0);
  }

  function testClear() public {
    PointsMap.setValue(1, playerId, 50);
    PointsMap.setValue(1, playerId2, 20);
    PointsMap.clear(1);
    bytes32[] memory players = PointsMap.keys(1);
    Value_PointsMapData[] memory values = PointsMap.values(1);
    assertEq(players.length, 0);
    assertEq(values.length, 0);
    assertEq(Empire.getPointsIssued(1), 0);
  }
}
