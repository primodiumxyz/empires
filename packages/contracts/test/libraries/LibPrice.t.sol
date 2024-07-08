// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { addressToId } from "src/utils.sol";

import { Faction, Player, P_PointConfig, P_PointConfigData } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";

contract LibPriceTest is PrimodiumTest {
  P_PointConfigData config;
  function setUp() public override {
    super.setUp();
    config = P_PointConfig.get();
  }

  function testStartGetPointCost() public {
    assertEq(LibPrice.getPointCost(EEmpire.Red, 1), config.startPointCost, "Starting Red Empire point cost incorrect");
    assertEq(
      LibPrice.getPointCost(EEmpire.Blue, 1),
      config.startPointCost,
      "Starting Blue Empire point cost incorrect"
    );
    assertEq(
      LibPrice.getPointCost(EEmpire.Green, 1),
      config.startPointCost,
      "Starting Green Empire point cost incorrect"
    );
  }

  function testGetTwoPointsCost() public {
    assertEq(
      LibPrice.getPointCost(EEmpire.Red, 2),
      config.startPointCost + (config.pointCostIncrease + config.startPointCost),
      "Red Empire point cost for 2 points incorrect"
    );
    assertEq(
      LibPrice.getPointCost(EEmpire.Blue, 2),
      config.startPointCost + (config.pointCostIncrease + config.startPointCost),
      "Blue Empire point cost for 2 points incorrect"
    );
    assertEq(
      LibPrice.getPointCost(EEmpire.Green, 2),
      config.startPointCost + (config.pointCostIncrease + config.startPointCost),
      "Green Empire point cost for 2 points incorrect"
    );
  }

  function testGetRegressPointCost() public {
    uint256 initCost = config.startPointCost;
    uint256 incCost = config.pointCostIncrease;
    uint256 otherEmpireCount = uint256(EEmpire.LENGTH) - 1;
    assertEq(
      LibPrice.getRegressPointCost(EEmpire.Red),
      initCost * otherEmpireCount,
      "Red Empire point cost for 2 points incorrect"
    );
  }
}
