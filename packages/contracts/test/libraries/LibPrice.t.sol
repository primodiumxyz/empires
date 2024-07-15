// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { addressToId } from "src/utils.sol";

import { Faction, Player, ActionCost, P_PointConfig, P_PointConfigData, P_ActionConfig, P_ActionConfigData } from "codegen/index.sol";
import { EEmpire, EPlayerAction } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { EMPIRE_COUNT } from "src/constants.sol";

contract LibPriceTest is PrimodiumTest {
  P_PointConfigData config;
  P_ActionConfigData actionConfig;
  function setUp() public override {
    super.setUp();
    config = P_PointConfig.get();
    actionConfig = P_ActionConfig.get();
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
    uint256 initPointCost = config.startPointCost;
    assertEq(
      LibPrice.getRegressPointCost(EEmpire.Red),
      initPointCost * (EMPIRE_COUNT - 1),
      "Red Empire point cost for 2 points incorrect"
    );
    assertEq(
      LibPrice.getRegressPointCost(EEmpire.Blue),
      initPointCost * (EMPIRE_COUNT - 1),
      "Red Empire point cost for 2 points incorrect"
    );
    assertEq(
      LibPrice.getRegressPointCost(EEmpire.Green),
      initPointCost * (EMPIRE_COUNT - 1),
      "Red Empire point cost for 2 points incorrect"
    );
  }

  function testGetProgressPointCost() public {
    uint256 initPointCost = config.startPointCost;
    assertEq(
      LibPrice.getProgressPointCost(EEmpire.Red),
      (EMPIRE_COUNT - 1) * (initPointCost + ((EMPIRE_COUNT - 2) * config.pointCostIncrease) / 2),
      "Red Empire point cost for EMPIRE_COUNT - 1 points incorrect"
    );
    assertEq(
      LibPrice.getProgressPointCost(EEmpire.Blue),
      (EMPIRE_COUNT - 1) * (initPointCost + ((EMPIRE_COUNT - 2) * config.pointCostIncrease) / 2),
      "Blue Empire point cost for EMPIRE_COUNT - 1 points incorrect"
    );
    assertEq(
      LibPrice.getProgressPointCost(EEmpire.Green),
      (EMPIRE_COUNT - 1) * (initPointCost + ((EMPIRE_COUNT - 2) * config.pointCostIncrease) / 2),
      "Green Empire point cost for EMPIRE_COUNT - 1 points incorrect"
    );
  }

  function testGetTotalCostProgress() public {
    assertEq(
      LibPrice.getTotalCost(EPlayerAction.CreateDestroyer, EEmpire.Red, true),
      actionConfig.startActionCost + LibPrice.getProgressPointCost(EEmpire.Red),
      "Total cost for Red Empire incorrect"
    );
  }

  function testGetTotalCostRegress() public {
    assertEq(
      LibPrice.getTotalCost(EPlayerAction.KillDestroyer, EEmpire.Red, false),
      actionConfig.startActionCost + LibPrice.getRegressPointCost(EEmpire.Red),
      "Total cost for Red Empire incorrect"
    );
  }

  function testPointCostUp() public {
    vm.startPrank(creator);
    uint256 beginPointCost = LibPrice.getPointCost(EEmpire.Red, 1);
    LibPrice.pointCostUp(EEmpire.Red, 1);
    uint256 nextPointCost = LibPrice.getPointCost(EEmpire.Red, 1);
    assertEq(nextPointCost, beginPointCost + config.pointCostIncrease, "First point cost increase incorrect");
    LibPrice.pointCostUp(EEmpire.Red, 1);
    uint256 finalPointCost = LibPrice.getPointCost(EEmpire.Red, 1);
    assertEq(finalPointCost, nextPointCost + config.pointCostIncrease, "Second point cost increase incorrect");
    assertEq(LibPrice.getPointCost(EEmpire.Blue, 1), config.startPointCost, "Blue Empire point cost should not change");
    assertEq(
      LibPrice.getPointCost(EEmpire.Green, 1),
      config.startPointCost,
      "Green Empire point cost should not change"
    );
    assertEq(
      LibPrice.getPointCost(EEmpire.Red, 2),
      finalPointCost * 2 + config.pointCostIncrease,
      "Red Empire point cost for 2 points incorrect"
    );
  }

  function testActionCostUp() public {
    vm.startPrank(creator);
    uint256 beginActionCost = ActionCost.get(EEmpire.Red, EPlayerAction.CreateDestroyer);
    LibPrice.actionCostUp(EEmpire.Red, EPlayerAction.CreateDestroyer);
    uint256 nextActionCost = ActionCost.get(EEmpire.Red, EPlayerAction.CreateDestroyer);
    assertEq(nextActionCost, beginActionCost + actionConfig.actionCostIncrease, "First action cost increase incorrect");
    LibPrice.actionCostUp(EEmpire.Red, EPlayerAction.CreateDestroyer);
    uint256 finalActionCost = ActionCost.get(EEmpire.Red, EPlayerAction.CreateDestroyer);
    assertEq(
      finalActionCost,
      nextActionCost + actionConfig.actionCostIncrease,
      "Second action cost increase incorrect"
    );
    assertEq(
      ActionCost.get(EEmpire.Red, EPlayerAction.KillDestroyer),
      actionConfig.startActionCost,
      "Red Empire's other action costs should not change"
    );
    assertEq(
      ActionCost.get(EEmpire.Blue, EPlayerAction.CreateDestroyer),
      actionConfig.startActionCost,
      "Blue Empire's other action costs should not change"
    );
    assertEq(
      ActionCost.get(EEmpire.Green, EPlayerAction.CreateDestroyer),
      actionConfig.startActionCost,
      "Green Empire's other action costs should not change"
    );
  }

  function testEmpirePointCostDown() public {
    vm.startPrank(creator);
    Faction.setPointCost(EEmpire.Red, config.minPointCost + config.pointGenRate);
    Faction.setPointCost(EEmpire.Blue, config.minPointCost + config.pointGenRate);
    Faction.setPointCost(EEmpire.Green, config.minPointCost + config.pointGenRate);
    LibPrice.turnEmpirePointCostDown(EEmpire.Red);
    assertEq(
      Faction.getPointCost(EEmpire.Red),
      config.minPointCost,
      "Red Empire point cost down incorrect when matching gen rate"
    );
    assertEq(
      Faction.getPointCost(EEmpire.Blue),
      config.minPointCost + config.pointGenRate,
      "Blue Empire point cost should not change"
    );
    assertEq(
      Faction.getPointCost(EEmpire.Green),
      config.minPointCost + config.pointGenRate,
      "Green Empire point cost should not change"
    );

    Faction.setPointCost(EEmpire.Red, config.minPointCost + config.pointGenRate - 1);
    LibPrice.turnEmpirePointCostDown(EEmpire.Red);
    assertEq(
      Faction.getPointCost(EEmpire.Red),
      config.minPointCost,
      "Red Empire point cost down incorrect when less than gen rate"
    );

    Faction.setPointCost(EEmpire.Red, config.minPointCost);
    LibPrice.turnEmpirePointCostDown(EEmpire.Red);
    assertEq(
      Faction.getPointCost(EEmpire.Red),
      config.minPointCost,
      "Red Empire point cost down incorrect when at min cost"
    );

    Faction.setPointCost(EEmpire.Red, config.minPointCost + config.pointGenRate + 1);
    LibPrice.turnEmpirePointCostDown(EEmpire.Red);
    assertEq(
      Faction.getPointCost(EEmpire.Red),
      config.minPointCost + 1,
      "Red Empire point cost down incorrect when greater than gen rate"
    );

    Faction.setPointCost(EEmpire.Red, config.minPointCost + config.pointGenRate * 2 + 1);
    LibPrice.turnEmpirePointCostDown(EEmpire.Red);
    assertEq(
      Faction.getPointCost(EEmpire.Red),
      config.minPointCost + config.pointGenRate + 1,
      "Red Empire point cost down incorrect when much greater than gen rate"
    );
    LibPrice.turnEmpirePointCostDown(EEmpire.Red);
    assertEq(Faction.getPointCost(EEmpire.Red), config.minPointCost + 1, "Sequential Point cost down not working");

    assertEq(
      Faction.getPointCost(EEmpire.Blue),
      config.minPointCost + config.pointGenRate,
      "Blue Empire point cost should remain unchanged"
    );
    assertEq(
      Faction.getPointCost(EEmpire.Green),
      config.minPointCost + config.pointGenRate,
      "Green Empire point cost should remain unchanged"
    );

    LibPrice.turnEmpirePointCostDown(EEmpire.Green);
    assertEq(
      Faction.getPointCost(EEmpire.Green),
      config.minPointCost,
      "Empire point cost down incorrect when different empire"
    );
    assertEq(
      Faction.getPointCost(EEmpire.Red),
      config.minPointCost + 1,
      "Red Empire point cost should remain unchanged"
    );
  }

  function testEmpirePlayerActionsCostDown() public {
    vm.startPrank(creator);
    ActionCost.set(EEmpire.Red, EPlayerAction.CreateDestroyer, actionConfig.minActionCost + actionConfig.actionGenRate);
    ActionCost.set(EEmpire.Red, EPlayerAction.KillDestroyer, actionConfig.minActionCost + actionConfig.actionGenRate);
    ActionCost.set(
      EEmpire.Blue,
      EPlayerAction.CreateDestroyer,
      actionConfig.minActionCost + actionConfig.actionGenRate
    );
    ActionCost.set(EEmpire.Blue, EPlayerAction.KillDestroyer, actionConfig.minActionCost + actionConfig.actionGenRate);
    ActionCost.set(
      EEmpire.Green,
      EPlayerAction.CreateDestroyer,
      actionConfig.minActionCost + actionConfig.actionGenRate
    );
    ActionCost.set(EEmpire.Green, EPlayerAction.KillDestroyer, actionConfig.minActionCost + actionConfig.actionGenRate);

    LibPrice.empirePlayerActionsCostDown(EEmpire.Red);
    assertEq(
      ActionCost.get(EEmpire.Red, EPlayerAction.CreateDestroyer),
      actionConfig.minActionCost,
      "Red Empire action cost down incorrect when matching gen rate"
    );
    assertEq(
      ActionCost.get(EEmpire.Red, EPlayerAction.KillDestroyer),
      actionConfig.minActionCost,
      "Red Empire action cost down should affect all actions of the empire"
    );
    assertEq(
      ActionCost.get(EEmpire.Blue, EPlayerAction.CreateDestroyer),
      actionConfig.minActionCost + actionConfig.actionGenRate,
      "Blue Empire action cost should not change"
    );
    assertEq(
      ActionCost.get(EEmpire.Blue, EPlayerAction.KillDestroyer),
      actionConfig.minActionCost + actionConfig.actionGenRate,
      "Blue Empire action cost should not change"
    );
    assertEq(
      ActionCost.get(EEmpire.Green, EPlayerAction.CreateDestroyer),
      actionConfig.minActionCost + actionConfig.actionGenRate,
      "Green Empire action cost should not change"
    );
    assertEq(
      ActionCost.get(EEmpire.Green, EPlayerAction.KillDestroyer),
      actionConfig.minActionCost + actionConfig.actionGenRate,
      "Green Empire action cost should not change"
    );

    ActionCost.set(
      EEmpire.Red,
      EPlayerAction.CreateDestroyer,
      actionConfig.minActionCost + actionConfig.actionGenRate - 1
    );
    LibPrice.empirePlayerActionsCostDown(EEmpire.Red);
    assertEq(
      ActionCost.get(EEmpire.Red, EPlayerAction.CreateDestroyer),
      actionConfig.minActionCost,
      "Red Empire action cost down incorrect when less than gen rate"
    );

    ActionCost.set(EEmpire.Red, EPlayerAction.CreateDestroyer, actionConfig.minActionCost);
    LibPrice.empirePlayerActionsCostDown(EEmpire.Red);
    assertEq(
      ActionCost.get(EEmpire.Red, EPlayerAction.CreateDestroyer),
      actionConfig.minActionCost,
      "Red Empire action cost down incorrect when at min cost"
    );

    ActionCost.set(
      EEmpire.Red,
      EPlayerAction.CreateDestroyer,
      actionConfig.minActionCost + actionConfig.actionGenRate + 1
    );
    LibPrice.empirePlayerActionsCostDown(EEmpire.Red);
    assertEq(
      ActionCost.get(EEmpire.Red, EPlayerAction.CreateDestroyer),
      actionConfig.minActionCost + 1,
      "Red Empire action cost down incorrect when greater than gen rate"
    );

    ActionCost.set(
      EEmpire.Red,
      EPlayerAction.CreateDestroyer,
      actionConfig.minActionCost + actionConfig.actionGenRate * 2 + 1
    );
    LibPrice.empirePlayerActionsCostDown(EEmpire.Red);
    assertEq(
      ActionCost.get(EEmpire.Red, EPlayerAction.CreateDestroyer),
      actionConfig.minActionCost + actionConfig.actionGenRate + 1,
      "Red Empire action cost down incorrect when much greater than gen rate"
    );
    LibPrice.empirePlayerActionsCostDown(EEmpire.Red);
    assertEq(
      ActionCost.get(EEmpire.Red, EPlayerAction.CreateDestroyer),
      actionConfig.minActionCost + 1,
      "Sequential Action cost down not working"
    );

    assertEq(
      ActionCost.get(EEmpire.Blue, EPlayerAction.CreateDestroyer),
      actionConfig.minActionCost + actionConfig.actionGenRate,
      "Blue Empire action cost should remain unchanged"
    );
    assertEq(
      ActionCost.get(EEmpire.Green, EPlayerAction.CreateDestroyer),
      actionConfig.minActionCost + actionConfig.actionGenRate,
      "Green Empire action cost should remain unchanged"
    );

    LibPrice.empirePlayerActionsCostDown(EEmpire.Green);
    assertEq(
      ActionCost.get(EEmpire.Green, EPlayerAction.CreateDestroyer),
      actionConfig.minActionCost,
      "Empire action cost down incorrect when different empire"
    );
    assertEq(
      ActionCost.get(EEmpire.Red, EPlayerAction.CreateDestroyer),
      actionConfig.minActionCost + 1,
      "Red Empire action cost should remain unchanged"
    );
  }
}
